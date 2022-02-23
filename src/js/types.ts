export enum GitWorkerOperation {
  clone,
  confirm,
}

export interface GitCloneData {
  url: string;
  dir: string;
}

export interface GitWorkerDataContainer {
  [GitWorkerOperation.confirm]?: {};
  [GitWorkerOperation.clone]?: GitCloneData;
}

export type GitWorkerData = GitCloneData | {};

export interface GitWorkerMessage {
  op: GitWorkerOperation;
  data: GitWorkerDataContainer;
  uuid: string;
}
