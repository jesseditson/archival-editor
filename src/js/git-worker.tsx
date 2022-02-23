/* eslint-env worker */
import LightningFS from "@isomorphic-git/lightning-fs";
import git from "isomorphic-git";
import GitHttp from "isomorphic-git/http/web/index";
import {
  GitCloneData,
  GitWorkerData,
  GitWorkerDataContainer,
  GitWorkerMessage,
  GitWorkerOperation,
} from "./types";

const PROXY_URL = "https://cors.isomorphic-git.org";

const getOpData = <K extends keyof GitWorkerDataContainer>(
  data: GitWorkerDataContainer,
  key: K
): GitWorkerDataContainer[K] => data[key];

// @ts-ignore: LightningFS.FSConstructorOptions defines all keys as required.
// See: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/58917
let fs = new LightningFS("fs", { wipe: false });
self.addEventListener("message", async (evt) => {
  const message = evt.data as GitWorkerMessage;
  switch (message.op) {
    case GitWorkerOperation.clone:
      await clone(message.data[message.op] as GitCloneData);
      break;
  }
  self.postMessage({ op: GitWorkerOperation.confirm, uuid: message.uuid });
});

const clone = async (data: GitCloneData) => {
  // @ts-ignore: see above
  fs = new LightningFS("fs", { wipe: true });
  return git.clone({
    corsProxy: PROXY_URL,
    url: data.url,
    fs,
    http: GitHttp,
    dir: data.dir,
    onProgress(evt) {
      console.log(evt);
    },
    onMessage(msg) {
      console.log(msg);
    },
    onAuth(url) {
      console.log(url);
    },
    onAuthFailure(msg) {
      console.log(msg);
    },
  });
};
