/* eslint-env worker */
import LightningFS from "@isomorphic-git/lightning-fs";
import cloneDeep from "lodash.clonedeep";
import git from "isomorphic-git";
import { v4 as uuidv4 } from "uuid";
import GitHttp from "isomorphic-git/http/web/index";
import TOML from "@iarna/toml";

import {
  GitCloneData,
  GitWorkerMessage,
  GitWorkerOperation,
  GitWorkerDataType,
  Objects,
  ObjectDefinition,
  ObjectData,
  SyncData,
  ContentAddressableObjectData,
  Change,
  ObjectValue,
  WriteableObjectData,
  ObjectTypes,
} from "../types";

const PROXY_URL = process.env.PROXY_URL;
const DEFAULT_COMMIT_MSG =
  process.env.DEFAULT_COMMIT_MSG || "Changes from Archival Editor";
const REPO_DIR = "/";

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
    case GitWorkerOperation.save:
      await handleErrors(() => save(message.data[message.op] as SyncData));
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
    dir: REPO_DIR,
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
  await refreshObjects();
};

const parseObjectTypes = (objectsStr: string) => {
  const types = TOML.parse(objectsStr) as ObjectTypes;
  for (const t in types) {
    // Remove special fields that are not related to editable content.
    delete types[t].template;
  }
  return types;
};

const hashForObject = async (object: ObjectData): Promise<string> => {
  const cloned = cloneDeep(object) as ContentAddressableObjectData;
  delete cloned._id;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(JSON.stringify(cloned))
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const parseObject = async (
  definition: ObjectDefinition,
  name: string,
  fileStr: string,
  filename: string
) => {
  const objectData = TOML.parse(fileStr) as ObjectData;
  objectData._filename = filename;
  objectData._name = name;
  objectData._id = await hashForObject(objectData);
  return objectData;
};

const objectCache: Map<string, ObjectData> = new Map();

const refreshObjects = async () => {
  const objectsStr = (
    await fs.promises.readFile("/objects.toml", { encoding: "utf8" })
  ).toString();
  const objectTypes = parseObjectTypes(objectsStr);
  const objectDirs = await fs.promises.readdir("/objects");
  const objects: Objects = {};
  await Promise.all(
    objectDirs.map(async (name) => {
      const objectFiles = await fs.promises.readdir(`/objects/${name}`);
      objects[name] = [];
      return Promise.all(
        objectFiles.map(async (file) => {
          const objectName = file.replace(/\.[^\.]+$/, "");
          const filename = `/objects/${name}/${file}`;
          const fileStr = (
            await fs.promises.readFile(filename, {
              encoding: "utf8",
            })
          ).toString();
          const obj = await parseObject(
            objectTypes[name],
            objectName,
            fileStr,
            filename
          );
          objects[name].push(obj);
          objectCache.set(obj._id, obj);
        })
      );
    })
  );
  perform(GitWorkerOperation.objects, {
    types: objectTypes,
    objects,
  });
};

const applyChange = async (
  orig: ObjectData,
  change: Change
): Promise<ObjectData> => {
  const data = cloneDeep(orig);
  // TODO: Maybe some types will want to perform more complex merges.
  if (change.index !== undefined) {
    (data[change.field] as ObjectValue[])[change.index] = change.value;
  } else {
    data[change.field] = change.value;
  }
  data._id = await hashForObject(data);
  return data;
};

class MissingObjectError extends Error {
  change: Change;
  constructor(change: Change) {
    super("Missing Object");
    this.change = change;
  }
}

const commitAllObjects = async (
  message: string,
  author: { name: string; email: string }
) => {
  const objectDirs = await fs.promises.readdir("/objects");
  await Promise.all(
    objectDirs.map(async (name) => {
      const objectFiles = await fs.promises.readdir(`/objects/${name}`);
      return Promise.all(
        objectFiles.map(async (file) => {
          const filename = `objects/${name}/${file}`;
          return git.add({ fs, filepath: filename, dir: REPO_DIR });
        })
      );
    })
  );
  await git.commit({ author, fs, message, dir: REPO_DIR });
};

const save = async (data: SyncData) => {
  const {
    changes,
    userInfo: { name, email },
  } = data;
  // Pull before syncing. If the data is missing in the next step, we could have
  // conflicted. We'll need to reapply our changes on the client and try again.
  await git.pull({
    fs,
    fastForwardOnly: true,
    corsProxy: PROXY_URL,
    author: {
      name,
      email,
    },
    http: GitHttp,
    dir: REPO_DIR,
    singleBranch: true,
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
  // Make sure all the changes apply cleanly. If we throw during this promise,
  // we'll abort all updates so we won't end up with partial application.
  const newObjects: { change: Change; object: ObjectData }[] = [];
  // We also need to run this serially since changes can commute
  for (const change of changes) {
    const currentObj = objectCache.get(change.id);
    if (!currentObj) {
      throw new MissingObjectError(change);
    }
    const object = await applyChange(currentObj, change);
    newObjects.push({ change, object });
  }
  await Promise.all(
    newObjects.map(async ({ change, object }) => {
      const writeable = cloneDeep(object) as WriteableObjectData;
      delete writeable._id;
      delete writeable._name;
      delete writeable._filename;
      const serialized = TOML.stringify(writeable);
      await fs.promises.writeFile(object._filename, serialized);
      objectCache.delete(change.id);
      objectCache.set(object._id, object);
    })
  );
  await commitAllObjects(DEFAULT_COMMIT_MSG, {
    name,
    email,
  });
  await git.push({
    fs,
    corsProxy: PROXY_URL,
    http: GitHttp,
    dir: REPO_DIR,
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
  // TODO: Can do a targeted refresh for better perf
  return refreshObjects();
};
