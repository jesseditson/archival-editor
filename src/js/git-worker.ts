/* eslint-env worker */
import LightningFS from "@isomorphic-git/lightning-fs";
import git from "isomorphic-git";
import { v4 as uuidv4 } from "uuid";
import GitHttp from "isomorphic-git/http/web/index";
import toml from "toml";

import {
  GitCloneData,
  GitWorkerMessage,
  GitWorkerOperation,
  GitWorkerDataType,
  ObjectTypes,
  Objects,
  ObjectDefinition,
  ObjectData,
} from "./types";

const PROXY_URL = process.env.PROXY_URL;

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

let fs = new LightningFS("fs", { wipe: false });
self.onmessage = async (evt) => {
  const message = evt.data as GitWorkerMessage;
  switch (message.op) {
    case GitWorkerOperation.clone:
      await handleErrors(() => clone(message.data[message.op] as GitCloneData));
      break;
    case GitWorkerOperation.refreshObjects:
      await handleErrors(refreshObjects);
      break;
  }
  self.postMessage({ op: GitWorkerOperation.confirm, uuid: message.uuid });
};

self.onmessageerror = (error) => {
  console.error(error);
};

const handleErrors = async <T>(block: () => Promise<T>): Promise<T | void> => {
  try {
    return block();
  } catch (error) {
    perform(GitWorkerOperation.error, { message: (error as Error).message });
    return Promise.resolve();
  }
};

const clone = async (data: GitCloneData) => {
  fs = new LightningFS("fs", { wipe: true });
  await git.clone({
    corsProxy: PROXY_URL,
    url: data.url,
    fs,
    http: GitHttp,
    dir: "/",
    ref: data.branch,
    singleBranch: true,
    noTags: true,
    depth: 1,
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
  await refreshObjects(data.branch);
};

const parseObject = (
  definition: ObjectDefinition,
  name: string,
  fileStr: string
) => {
  const objectData = toml.parse(fileStr) as ObjectData;
  objectData._name = name;
  return objectData;
};

const refreshObjects = async (branch: string = "HEAD") => {
  const files = await git.listFiles({ fs, dir: "/", ref: branch });
  console.log(files);
  const objectsStr = (
    await fs.promises.readFile("/objects.toml", { encoding: "utf8" })
  ).toString();
  const objectTypes = toml.parse(objectsStr) as ObjectTypes;
  const objectDirs = await fs.promises.readdir("/objects");
  const objects: Objects = {};
  Promise.all(
    objectDirs.map(async (name) => {
      const objectFiles = await fs.promises.readdir(`/objects/${name}`);
      objects[name] = [];
      return (await Promise.all(objectFiles)).map(async (file) => {
        const objectName = file.replace(/\.[^\.]+$/, "");
        const fileStr = (
          await fs.promises.readFile(`/objects/${name}/${file}`)
        ).toString();
        objects[name].push(parseObject(objectTypes[name], objectName, fileStr));
      });
    })
  );
  perform(GitWorkerOperation.objects, {
    types: objectTypes,
    objects,
  });
};
