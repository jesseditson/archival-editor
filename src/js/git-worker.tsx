/* eslint-env worker */
import LightningFS from "@isomorphic-git/lightning-fs";
import git from "isomorphic-git";
import GitHttp from "isomorphic-git/http/web/index";
import { GitWorkerData, GitWorkerMessage, GitWorkerOperation } from "./types";

const defaultFSArgs = {};

// @ts-ignore: LightningFS.FSConstructorOptions defines all keys as required.
// See: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/58917
let fs = new LightningFS("fs", { wipe: false });
self.addEventListener("message", async (evt) => {
  const message = evt.data as GitWorkerMessage;
  await operations[message.op](message.data[GitWorkerOperation.clone]);
});

const clone = async (data: GitWorkerData[GitWorkerOperation.clone]) => {
  // @ts-ignore: see above
  fs = new LightningFS("fs", { wipe: true });
  return git.clone({
    corsProxy: "https://cors.isomorphic-git.org",
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

const operations = {
  [GitWorkerOperation.clone]: clone,
};
