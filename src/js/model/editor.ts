import { autorun, makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import {
  GitWorkerData,
  GitWorkerDataType,
  GitWorkerMessage,
  GitWorkerOperation,
  ProgressInfo,
} from "../types";

const waitingPromises: Map<string, Function> = new Map();

interface GithubAuth {
  accessToken: string;
  tokenType: string;
  scopes: string[];
}

export default class Editor {
  githubAuth: GithubAuth | null = null;
  repoURL: string = "";
  cloned: boolean = false;
  progressInfo: ProgressInfo | null = null;
  worker: Worker;

  get authenticated(): boolean {
    return !!this.repoURL && !!this.githubAuth;
  }

  public cloneRepo = async () => {
    this.cloned = false;
    await this.perform(GitWorkerOperation.clone, {
      url: this.repoURL,
      dir: `/${hashCode(this.repoURL)}`,
    });
    this.cloned = true;
  };

  constructor(serialized: string | null, path: string, queryString: string) {
    makeAutoObservable(this);
    const query = new URLSearchParams(queryString);
    if (this.loadAuth(path, query)) {
      window.location.replace("/");
    } else if (serialized) {
      const init = JSON.parse(serialized);
      this.repoURL = init.repoURL;
      this.githubAuth = init.githubAuth;
    }
    this.worker = new Worker(new URL("../git-worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessageerror = (error) => {
      console.error(error);
    };
    this.worker.onmessage = (evt) => {
      const message = evt.data as GitWorkerMessage;
      if (message.op === GitWorkerOperation.confirm) {
        const promise = waitingPromises.get(message.uuid);
        if (promise) {
          promise();
        }
        return;
      } else if (message.op === GitWorkerOperation.progress) {
        this.progressInfo = message.data[GitWorkerOperation.progress] || null;
        if (this.progressInfo?.progress === 1) {
          this.progressInfo = null;
        }
      }
      console.log(message.data);
    };
  }

  private loadAuth = (path: string, data: URLSearchParams): boolean => {
    if (path === "/authorized/github") {
      this.githubAuth = {
        accessToken: data.get("access_token")!,
        tokenType: data.get("token_type")!,
        scopes: data.get("scope")?.split(" ")!,
      };
      return true;
    }
    return false;
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

function hashCode(str: string) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function onPersist(
  editor: Editor,
  callback: (serialized: string) => Promise<void> | void
) {
  autorun(() => {
    const data = {
      repoURL: editor.repoURL,
      githubAuth: editor.githubAuth,
    };
    callback(JSON.stringify(data));
  });
}
