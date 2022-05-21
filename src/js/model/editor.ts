import {
  runInAction,
  autorun,
  makeObservable,
  observable,
  computed,
  toJS,
} from "mobx";
import { v4 as uuidv4 } from "uuid";
import { GithubAuth, GithubClient } from "../lib/github-client";
import {
  changeId,
  childChangeId,
  childFieldFromChangeId,
  DEFAULT_VALUES,
  setChildField,
} from "../lib/util";
import {
  Change,
  Deletion,
  ErrorData,
  Github,
  GitWorkerDataType,
  GitWorkerMessage,
  GitWorkerOperation,
  MetaKeys,
  ObjectChildData,
  ObjectData,
  ObjectDefinition,
  ObjectsData,
  ObjectValue,
  ProgressInfo,
  ScalarType,
  ValidationError,
} from "../types";

const CONFIG = {
  authURL: "https://github.com/login/oauth/authorize",
  redirectURI: process.env.GITHUB_REDIRECT_URI!,
  clientID: process.env.GITHUB_CLIENT_ID!,
  scopes: ["repo"],
};

const waitingPromises: Map<string, Function> = new Map();
export default class Editor {
  githubAuth: GithubAuth | null = null;
  githubClient: GithubClient | null = null;
  userInfo: Github.User | null = null;
  repoList: Github.Repo[] = [];
  repo: Github.Repo | null = null;
  branch: string = "main";
  cloning: boolean = false;
  cloned: boolean = false;
  progressInfo: ProgressInfo | null = null;
  worker: Worker;
  gitObjects: ObjectsData | null = null;
  changes: Change[] = [];
  deletions: Deletion[] = [];
  syncing: boolean = false;
  errors: ErrorData[] = [];

  get loggedIn(): boolean {
    return !!this.githubClient;
  }

  get authenticated(): boolean {
    return !!this.repo && !!this.githubAuth;
  }

  get hasUnsyncedChanges(): boolean {
    return this.changes.length > 0 || this.deletions.length > 0;
  }

  get changedFields(): Map<string, Change> {
    return new Map(this.changes.map((c) => [changeId(c), c]));
  }

  get objects(): ObjectsData | null {
    if (!this.gitObjects) {
      return null;
    }
    const objects = toJS(this.gitObjects);
    const existingObjects = (Object.values(objects.objects) || []).reduce(
      (p, c) => p.concat(c),
      []
    );
    const idsWithChildDeletions: Map<string, Deletion[]> = new Map();
    const deletedIds = new Set(
      this.deletions
        .filter((d) => {
          // this is ugly but cheaper
          if (d.field) {
            const childDels = idsWithChildDeletions.get(d.id) || [];
            childDels.push(d);
            idsWithChildDeletions.set(d.id, childDels);
            return false;
          }
          return true;
        })
        .map((d) => d.id)
    );
    const existingObjectIds = new Set(existingObjects.map((o) => o._id));
    // Create a hash of all the files that were changed but don't yet exist in our git repo.
    const newFiles: { [id: string]: ObjectData } = {};
    const fileTypes: { [id: string]: string } = {};
    this.changes.forEach((change) => {
      const { id, field, index } = childFieldFromChangeId(change.id);
      if (deletedIds.has(id)) {
        return;
      }
      if (!existingObjectIds.has(id)) {
        newFiles[id] = newFiles[id] || { _id: id };
        if (fileTypes[id] && fileTypes[id] !== change.objectType) {
          throw new Error("Object type mismatch");
        }
        fileTypes[id] = change.objectType;
        const def = objects.types[change.objectType][change.field];
        if (field && index !== null) {
          // This is a change to a subfield so we need to hydrate the child structure and set this particular value
          newFiles[id][field] = setChildField(
            toJS(newFiles[id][field]) as ObjectChildData[],
            index,
            change.field,
            change.value
          );
        } else if (!def && !MetaKeys.has(change.field)) {
          // This change is for a field that doesn't exist on the definition of this object. It should be impossible.
          console.log(toJS(change));
          throw new Error(`Invalid field ${change.field} in change`);
        } else {
          // This is a simple scalar value, set it directly.
          newFiles[id][change.field] = change.value;
        }
      }
    });
    // Add objects only visible in changes
    Object.values(newFiles).forEach((newFile) =>
      objects.objects[fileTypes[newFile._id]].push(newFile)
    );
    // Remove deleted objects
    for (const type in objects.objects) {
      for (const idx in objects.objects[type]) {
        const object = objects.objects[type][idx];
        if (deletedIds.has(object._id)) {
          delete objects.objects[type][idx];
        } else {
          (idsWithChildDeletions.get(object._id) || []).forEach((cd) => {
            const children = objects.objects[type][idx][cd.field!] as (
              | ObjectChildData
              | undefined
            )[];
            children[cd.index!] = undefined;
            objects.objects[type][idx][cd.field!] =
              children as ObjectChildData[];
          });
        }
      }
    }
    return objects;
  }

  public openLogin = () => {
    const newURL = `${CONFIG.authURL}?redirect_uri=${encodeURIComponent(
      CONFIG.redirectURI
    )}&client_id=${CONFIG.clientID}&scope=${CONFIG.scopes.join(
      " "
    )}&state=${uuidv4()}`;
    window.location.href = newURL;
  };

  public setRepo = (repo: Github.Repo) => {
    runInAction(() => {
      this.repo = repo;
      this.branch = repo.default_branch;
    });
    this.cloneRepo(this.branch);
  };

  public cloneRepo = async (branch?: string) => {
    if (!this.repo) {
      throw new Error("No Repo Selected");
    }
    runInAction(() => {
      this.branch = branch || this.repo!.default_branch;
      this.cloned = false;
      this.cloning = true;
    });
    await this.perform(GitWorkerOperation.clone, {
      url: this.repo!.clone_url,
      accessToken: this.githubAuth?.accessToken,
      branch: this.branch,
    });
    runInAction(() => {
      this.cloning = false;
      this.cloned = true;
    });
  };

  public refreshObjects = () => {
    this.perform(GitWorkerOperation.refreshObjects);
  };

  public onAddObject = async (
    name: string,
    type: string,
    object: ObjectDefinition
  ): Promise<(ValidationError | void)[]> => {
    if (this.syncing) {
      throw new Error("Cannot add a child while syncing.");
    }
    const objectId = `temp:${uuidv4()}`;
    const changeForValue = (field: string, value: ObjectValue): Change => ({
      id: changeId(objectId, field),
      objectType: type,
      field: field,
      value,
    });
    const changes = Object.keys(object).map((field) => {
      const fieldDef = object[field];
      let defaultValue: ScalarType | Array<any> =
        DEFAULT_VALUES[fieldDef as keyof typeof DEFAULT_VALUES];
      if (Array.isArray(fieldDef)) {
        defaultValue = [];
      }
      return changeForValue(field, defaultValue);
    });
    changes.push(changeForValue("_id", objectId));
    changes.push(changeForValue("_filename", `/objects/${type}/${name}.toml`));
    changes.push(changeForValue("_name", name));
    const values = await Promise.allSettled(changes.map(this.onUpdate));
    return values
      .filter((v) => v.status === "fulfilled")
      .map((v) => (v as PromiseFulfilledResult<ValidationError | void>).value);
  };

  public onRemove = (id: string, field?: string, index?: number) => {
    runInAction(() => {
      this.deletions.push({
        id,
        field,
        index,
      });
    });
  };

  public onAddChild = async (
    parentType: string,
    object: ObjectDefinition,
    parentId: string,
    index: number,
    field: string
  ): Promise<(ValidationError | void)[]> => {
    if (this.syncing) {
      throw new Error("Cannot add a child while syncing.");
    }
    const fields = object[field] as ObjectDefinition[];
    const changes = Object.keys(fields[0]).map((cf) => {
      const change: Change = {
        id: childChangeId(parentId, field, index, cf),
        objectType: parentType,
        field: cf,
        value: DEFAULT_VALUES[fields[0][cf] as keyof typeof DEFAULT_VALUES],
        index,
      };
      return change;
    });
    const values = await Promise.allSettled(changes.map(this.onUpdate));
    return values
      .filter((v) => v.status === "fulfilled")
      .map((v) => (v as PromiseFulfilledResult<ValidationError | void>).value);
  };

  public onUpdate = async (change: Change): Promise<ValidationError | void> => {
    if (this.syncing) {
      throw new Error("Cannot update while syncing.");
    }
    // TODO: validate change
    runInAction(() => {
      if (this.changedFields.has(change.id)) {
        for (const i in this.changes) {
          if (this.changes[i].id === change.id) {
            this.changes[i] = change;
            break;
          }
        }
      } else {
        this.changes.push(change);
      }
    });
    return Promise.resolve();
  };

  public resetChanges = async (): Promise<void> => {
    runInAction(() => {
      this.changes = [];
      this.deletions = [];
    });
  };

  public sync = async () => {
    if (!this.authenticated) {
      throw new Error("Not Logged In");
    }
    runInAction(() => {
      this.syncing = true;
    });
    await this.perform(GitWorkerOperation.sync, {
      userInfo: toJS(this.userInfo!),
      changes: toJS(this.changes),
      deletions: toJS(this.deletions),
      accessToken: this.githubAuth!.accessToken!,
    });
    runInAction(() => {
      this.changes = [];
      this.deletions = [];
      this.syncing = false;
    });
  };

  public reset = () => {
    runInAction(() => {
      this.userInfo = null;
      this.repo = null;
      this.branch = "main";
      this.cloned = false;
      this.progressInfo = null;
      this.gitObjects = null;
      this.changes = [];
      this.deletions = [];
    });
  };

  public refreshRepos = async () => {
    if (!this.githubClient) {
      throw new Error("Not Logged In");
    }
    runInAction(() => {
      this.progressInfo = { task: "Loading Repositories...", progress: -1 };
    });
    const repoList = await this.githubClient.allUserRepos();
    runInAction(() => {
      this.progressInfo = null;
      this.repoList = repoList;
    });
  };

  constructor(serialized: string | null, path: string, queryString: string) {
    makeObservable(this, {
      githubAuth: observable,
      repoList: observable,
      repo: observable,
      branch: observable,
      authenticated: computed,
      changedFields: computed,
      loggedIn: computed,
      cloning: observable,
      cloned: observable,
      progressInfo: observable,
      gitObjects: observable,
      objects: computed,
      errors: observable,
      changes: observable,
      deletions: observable,
    });
    const query = new URLSearchParams(queryString);
    if (this.loadAuth(path, query)) {
      setTimeout(() => window.location.replace("/"), 500);
    } else if (serialized) {
      const init = JSON.parse(serialized);
      this.userInfo = init.userInfo;
      this.repo = init.repo;
      this.branch = init.branch;
      this.githubAuth = init.githubAuth;
      this.cloned = init.cloned;
      this.changes = init.changes || [];
      this.deletions = init.deletions || [];
    }
    this.worker = new Worker(
      new URL("../worker/git-worker.ts", import.meta.url),
      {
        type: "module",
      }
    );
    this.worker.onmessageerror = (error) => {
      console.error(error);
    };
    this.worker.onmessage = this.handleMessage;
    if (this.githubAuth) {
      this.githubClient = new GithubClient(this.githubAuth);
      this.loadUserInfo();
    }
    if (this.cloned) {
      this.refreshObjects();
    }
  }

  private loadUserInfo = async () => {
    if (!this.githubClient) {
      throw new Error("Not Logged In.");
    }
    const userInfo = await this.githubClient.userInfo();
    runInAction(() => {
      this.userInfo = userInfo;
    });
  };

  private loadAuth = (path: string, data: URLSearchParams): boolean => {
    if (path === "/authorized/github") {
      this.githubAuth = {
        accessToken: data.get("access_token")!,
        tokenType: data.get("token_type")!,
        scopes: data.get("scope")?.split(" ")!,
      };
      this.githubClient = new GithubClient(this.githubAuth);
      return true;
    }
    return false;
  };

  private handleMessage = (evt: MessageEvent<GitWorkerMessage>) => {
    const message = evt.data;
    switch (message.op) {
      case GitWorkerOperation.confirm:
        const promise = waitingPromises.get(message.uuid);
        if (promise) {
          promise();
        }
        return;
      case GitWorkerOperation.progress:
        runInAction(() => {
          this.progressInfo = message.data[GitWorkerOperation.progress] || null;
          if (this.progressInfo?.progress === 1) {
            this.progressInfo = null;
          }
        });
        return;
      case GitWorkerOperation.objects:
        runInAction(() => {
          this.gitObjects = message.data[GitWorkerOperation.objects] || null;
        });
        return;
      case GitWorkerOperation.error:
        runInAction(() => {
          const error = message.data[GitWorkerOperation.error];
          console.error(`ERROR: ${error}`);
          this.errors.push(error!);
        });
        return;
      default:
        console.log(message.data);
        return;
    }
  };

  private perform = <T extends GitWorkerOperation>(
    op: T,
    data?: GitWorkerDataType<T>
  ) => {
    const uuid = uuidv4();
    this.worker.postMessage({ op: op, uuid: uuid, data: { [op]: data } });
    return new Promise<void>((resolve) => {
      waitingPromises.set(uuid, resolve);
    }).then(() => waitingPromises.delete(uuid));
  };
}

export function onPersist(
  editor: Editor,
  callback: (serialized: string) => Promise<void> | void
) {
  autorun(() => {
    const data = {
      userInfo: editor.userInfo,
      repo: editor.repo,
      branch: editor.branch,
      githubAuth: editor.githubAuth,
      cloned: editor.cloned,
      changes: editor.changes,
      deletions: editor.deletions,
    };
    callback(JSON.stringify(data));
  });
}
