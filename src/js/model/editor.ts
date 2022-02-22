import { makeAutoObservable } from "mobx";
import { GitWorkerMessage } from "../types";

const worker = new SharedWorker(new URL("../git-worker.tsx", import.meta.url), {
  type: "module",
});

export default class Editor {
  repoURL: string;

  constructor() {
    this.repoURL = "";
    makeAutoObservable(this);
    worker.port.start();
    worker.port.addEventListener("message", (evt) => {
      const message = evt.data as GitWorkerMessage;
      console.log(message.data);
    });
  }
}
