export enum GitWorkerOperation {
  clone,
  confirm,
  progress,
}

export interface GitCloneData {
  url: string;
  dir: string;
  accessToken?: string;
}

export interface ProgressInfo {
  task: string;
  progress: number;
}

export type GitWorkerDataType<T extends GitWorkerOperation> =
  T extends GitWorkerOperation.confirm
    ? {}
    : T extends GitWorkerOperation.clone
    ? GitCloneData
    : T extends GitWorkerOperation.progress
    ? ProgressInfo
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
