/* eslint-env worker */
import LightningFS from "@isomorphic-git/lightning-fs";
import git from "isomorphic-git";
import { v4 as uuidv4 } from "uuid";
import GitHttp from "isomorphic-git/http/web/index";
import {
  GitCloneData,
  GitWorkerMessage,
  GitWorkerOperation,
  GitWorkerDataType,
} from "./types";

const PROXY_URL = "https://cors.isomorphic-git.org";

const perform = <T extends GitWorkerOperation>(
  operation: T,
  data: GitWorkerDataType<T>
) => {
  const uuid = uuidv4();
  self.postMessage({
    op: operation,
    uuid,
    data: {
      [operation]: data,
    },
  });
};

// @ts-ignore: LightningFS.FSConstructorOptions defines all keys as required.
// See: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/58917
let fs = new LightningFS("fs", { wipe: false });
self.onmessage = async (evt) => {
  const message = evt.data as GitWorkerMessage;
  switch (message.op) {
    case GitWorkerOperation.clone:
      await clone(message.data[message.op] as GitCloneData);
      break;
  }
  self.postMessage({ op: GitWorkerOperation.confirm, uuid: message.uuid });
};

self.onmessageerror = (error) => {
  console.error(error);
};

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
      perform(GitWorkerOperation.progress, {
        task: evt.phase,
        progress: evt.loaded / evt.total,
      });
    },
    onMessage(msg) {
      console.log(msg);
    },
    onAuth(url) {
      return {
        username: data.accessToken,
        password: "x-oauth-basic",
      };
    },
    onAuthFailure(msg) {
      console.log(msg);
    },
  });
};
