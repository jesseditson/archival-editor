import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { GitWorkerData, GitWorkerMessage, GitWorkerOperation } from "../types";

const waitingPromises: Map<string, Function> = new Map();
export default class Editor {
  repoURL: string;
  worker: Worker;

  public cloneRepo = (repoURL: string) => {
    this.repoURL = repoURL;
    return this.perform(GitWorkerOperation.clone, {
      url: repoURL,
      dir: `/${hashCode(repoURL)}`,
    });
  };

  constructor() {
    this.repoURL = "https://github.com/jesseditson/archival-docs";
    this.worker = new Worker(new URL("../git-worker.ts", import.meta.url), {
      type: "module",
    });
    makeAutoObservable(this);
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
      }
      console.log(message.data);
    };
  }

  private perform = (op: GitWorkerOperation, data?: GitWorkerData) => {
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
