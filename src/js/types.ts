export enum GitWorkerOperation {
  clone,
}

export interface GitWorkerData {
  [GitWorkerOperation.clone]: {
    url: string;
    dir: string;
  };
}

export interface GitWorkerMessage {
  op: GitWorkerOperation;
  data: GitWorkerData;
}
