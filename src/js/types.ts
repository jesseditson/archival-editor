export enum GitWorkerOperation {
  clone,
  confirm,
  progress,
  refreshObjects,
  objects,
  error,
}

export interface GitCloneData {
  url: string;
  accessToken?: string;
  branch: string;
}

export interface ProgressInfo {
  task: string;
  progress: number;
}

// TODO: only the "template" key should be allowed to be an arbitrary string.
export type ScalarType = "string" | "markdown" | string;

export interface ObjectDefinition {
  [key: string]: ScalarType;
}

export interface ObjectTypes {
  [name: string]: ObjectDefinition;
}

export type ObjectValue = string | number;

export interface ObjectData {
  _name: string;
  [key: string]: ObjectValue | ObjectValue[];
}

export interface Objects {
  [name: string]: ObjectData[];
}

export interface ObjectsData {
  types: ObjectTypes;
  objects: Objects;
}

export interface ValidationError {
  message: string;
}

export interface ErrorData {
  message: string;
}

export type GitWorkerDataType<T extends GitWorkerOperation> =
  T extends GitWorkerOperation.objects
    ? ObjectsData
    : T extends GitWorkerOperation.clone
    ? GitCloneData
    : T extends GitWorkerOperation.progress
    ? ProgressInfo
    : T extends GitWorkerOperation.error
    ? ErrorData
    : never;

export type GitWorkerDataContainer = {
  [op in GitWorkerOperation]?: GitWorkerDataType<op>;
};

// TODO: can this be expressed dynamically?
export type GitWorkerData = GitCloneData | ProgressInfo | {};

export interface GitWorkerMessage {
  op: GitWorkerOperation;
  data: GitWorkerDataContainer;
  uuid: string;
}
