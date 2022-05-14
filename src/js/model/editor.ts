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
  Change,
  ErrorData,
  Github,
  GitWorkerDataType,
  GitWorkerMessage,
  GitWorkerOperation,
  ObjectsData,
  ProgressInfo,
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
  objects: ObjectsData | null = null;
  changes: Change[] = [];
  syncing: boolean = false;
  errors: ErrorData[] = [];

  get loggedIn(): boolean {
    return !!this.githubClient;
  }

  get authenticated(): boolean {
    return !!this.repo && !!this.githubAuth;
  }

  get hasUnsyncedChanges(): boolean {
    return this.changes.length > 0;
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

  public onUpdate = async (change: Change): Promise<ValidationError | void> => {
    if (this.syncing) {
      throw new Error("Cannot update while syncing.");
    }
    // TODO: validate change
    runInAction(() => {
      this.changes.push(change);
    });
    return Promise.resolve();
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
      accessToken: this.githubAuth!.accessToken!,
    });
    runInAction(() => {
      this.changes = [];
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
      this.objects = null;
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
      loggedIn: computed,
      cloning: observable,
      cloned: observable,
      progressInfo: observable,
      objects: observable,
      errors: observable,
      changes: observable,
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
          this.objects = message.data[GitWorkerOperation.objects] || null;
        });
        return;
      case GitWorkerOperation.error:
        runInAction(() => {
          const error = message.data[GitWorkerOperation.error];
          console.error(`ERROR: ${error}`);
          this.errors.push(error!);
        });
        return;
    }
    console.log(message.data);
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
    };
    callback(JSON.stringify(data));
  });
}
