import {
  runInAction,
  autorun,
  makeObservable,
  observable,
  computed,
} from "mobx";
import { v4 as uuidv4 } from "uuid";
import GithubClient, { GithubAuth } from "../lib/github-client";
import {
  ErrorData,
  Github,
  GitWorkerDataType,
  GitWorkerMessage,
  GitWorkerOperation,
  ObjectsData,
  ProgressInfo,
} from "../types";

const waitingPromises: Map<string, Function> = new Map();

export default class Editor {
  githubAuth: GithubAuth | null = null;
  githubClient: GithubClient | null = null;
  repoList: Github.Repo[] = [];
  repoURL: string = "";
  branch: string = "main";
  cloning: boolean = false;
  cloned: boolean = false;
  progressInfo: ProgressInfo | null = null;
  worker: Worker;
  objects: ObjectsData | null = null;
  errors: ErrorData[] = [];

  get authenticated(): boolean {
    return !!this.repoURL && !!this.githubAuth;
  }

  public cloneRepo = async (branch: string) => {
    runInAction(() => {
      this.branch = branch;
      this.cloned = false;
      this.cloning = true;
    });
    await this.perform(GitWorkerOperation.clone, {
      url: this.repoURL,
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

  public reset = () => {
    runInAction(() => {
      this.repoURL = "";
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
    const repoList = await this.githubClient.allUserRepos();
    runInAction(() => {
      console.log(repoList);
      this.repoList = repoList;
    });
  };

  constructor(serialized: string | null, path: string, queryString: string) {
    makeObservable(this, {
      githubAuth: observable,
      repoList: observable,
      repoURL: observable,
      branch: observable,
      authenticated: computed,
      cloning: observable,
      cloned: observable,
      progressInfo: observable,
      objects: observable,
      errors: observable,
    });
    const query = new URLSearchParams(queryString);
    if (this.loadAuth(path, query)) {
      window.location.replace("/");
    } else if (serialized) {
      const init = JSON.parse(serialized);
      this.repoURL = init.repoURL;
      this.branch = init.branch;
      this.githubAuth = init.githubAuth;
      this.cloned = init.cloned;
    }
    this.worker = new Worker(new URL("../git-worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessageerror = (error) => {
      console.error(error);
    };
    this.worker.onmessage = this.handleMessage;
    if (this.githubAuth) {
      this.githubClient = new GithubClient(this.githubAuth);
    }
    if (this.cloned) {
      this.refreshObjects();
    }
  }

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
      repoURL: editor.repoURL,
      branch: editor.branch,
      githubAuth: editor.githubAuth,
      cloned: editor.cloned,
    };
    callback(JSON.stringify(data));
  });
}
