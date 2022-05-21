/* eslint-env worker */
import LightningFS from "@isomorphic-git/lightning-fs";
import cloneDeep from "lodash.clonedeep";
import git, { GitProgressEvent } from "isomorphic-git";
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
  WriteableObjectData,
  ObjectTypes,
  ObjectChildData,
} from "../types";
import { childFieldFromChangeId, setChildField } from "../lib/util";

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
    case GitWorkerOperation.sync:
      await handleErrors(() => sync(message.data[message.op] as SyncData));
      break;
  }
  self.postMessage({ op: GitWorkerOperation.confirm, uuid: message.uuid });
};

self.onmessageerror = (error) => {
  console.error(error);
};

const onProgress = (evt: GitProgressEvent) => {
  let progress = evt.loaded / 100;
  if (evt.total) {
    progress = evt.loaded / evt.total;
  }
  perform(GitWorkerOperation.progress, {
    task: evt.phase,
    progress,
  });
};

const sendProgress = (name: string, progress: number) => {
  perform(GitWorkerOperation.progress, {
    task: name,
    progress,
  });
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
    onProgress,
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
  const { field, index } = childFieldFromChangeId(change.id);
  if (index !== null && field) {
    data[field] = setChildField(
      data[field] as ObjectChildData[],
      index,
      change.field,
      change.value
    );
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

const sync = async (data: SyncData) => {
  const {
    changes,
    userInfo: { name, email },
  } = data;
  if (!name || !email) {
    throw new Error("Git User must have a name and email");
  }
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
    onProgress,
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
  // First, do a pass to hydrate our object cache with any optimistically created temp objects
  let optimisticObjects: Map<string, ObjectData> = new Map();
  for (const change of changes) {
    const { id } = childFieldFromChangeId(change.id);
    let currentObj = objectCache.get(id) || optimisticObjects.get(id);
    if (!currentObj && id.startsWith("temp:")) {
      currentObj = { _filename: id, _id: id, _name: id };
    }
    optimisticObjects.set(id, await applyChange(currentObj!, change));
  }
  // Make sure all the changes apply cleanly. If we throw during this promise,
  // we'll abort all updates so we won't end up with partial application.
  const newObjects: { change: Change; object: ObjectData }[] = [];
  // We need to run this serially since changes can commute
  let idx = 0;
  for (const change of changes) {
    sendProgress("Applying Changes", ++idx / changes.length);
    const { id } = childFieldFromChangeId(change.id);
    const currentObj = objectCache.get(id) || optimisticObjects.get(id);
    if (!currentObj) {
      throw new MissingObjectError(change);
    }
    const object = await applyChange(currentObj, change);
    newObjects.push({ change, object });
  }
  let completed = 0;
  sendProgress("Writing Files", 0);
  await Promise.all(
    newObjects.map(async ({ change, object }) => {
      const writeable = cloneDeep(object) as WriteableObjectData;
      delete writeable._id;
      delete writeable._name;
      delete writeable._filename;
      const serialized = TOML.stringify(writeable);
      await fs.promises.writeFile(object._filename, serialized);
      sendProgress("Writing Files", ++completed / newObjects.length);
      objectCache.delete(change.id);
      objectCache.set(object._id, object);
    })
  );
  sendProgress("Committing Files", 0);
  await commitAllObjects(DEFAULT_COMMIT_MSG, {
    name,
    email,
  });
  await git.push({
    fs,
    corsProxy: PROXY_URL,
    http: GitHttp,
    dir: REPO_DIR,
    onProgress,
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
  sendProgress("Done", 1);
  // TODO: Can do a targeted refresh for better perf
  return refreshObjects();
};
