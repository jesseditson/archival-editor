export enum GitWorkerOperation {
  clone,
  confirm,
  progress,
  refreshObjects,
  objects,
  error,
  sync,
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
export type ScalarType = "string" | "markdown" | "image" | string;

export interface ObjectDefinition {
  [key: string]: ScalarType;
}

export type RootObjectDefinition = ObjectDefinition & {
  [key: string]: ObjectDefinition[];
};

export interface ObjectTypes {
  [name: string]: RootObjectDefinition;
}

export type ObjectArrayValue = string[] | number[];
export type ObjectValue =
  | string
  | number
  | ObjectArrayValue
  | ObjectArrayValue[];

export interface ObjectChildData {
  [key: string]: ObjectValue | ObjectChildData[];
}
export interface ObjectData extends ObjectChildData {
  _filename: string;
  _name: string;
  _id: string;
}

export const MetaKeys = new Set(["_id", "_name", "_filename"]);

export type ContentAddressableObjectData = Omit<ObjectData, "_id">;
export type WriteableObjectData = Omit<
  ContentAddressableObjectData,
  "_name" | "_filename"
>;

export interface Change {
  objectType: string;
  id: string;
  field: string;
  value: ObjectValue;
}

export interface Deletion {
  id: string;
  field?: string;
  index?: number;
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

export interface SyncData {
  userInfo: Github.User;
  changes: Change[];
  deletions: Deletion[];
  accessToken: string;
  description?: string;
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
    : T extends GitWorkerOperation.sync
    ? SyncData
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

export namespace Github {
  export interface User {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    type?: string;
    site_admin?: boolean;
    name?: string;
    company?: string;
    blog?: string;
    location?: string;
    email?: string;
    hireable?: boolean;
    bio?: string;
    twitter_username?: string;
    public_repos?: number;
    public_gists?: number;
    followers?: number;
    following?: number;
    created_at?: string;
    updated_at?: string;
    private_gists?: number;
    total_private_repos?: number;
    owned_private_repos?: number;
    disk_usage?: number;
    collaborators?: number;
    two_factor_authentication?: boolean;
    plan?: {
      name: string;
      space: number;
      private_repos: number;
      collaborators: number;
    };
  }
  export interface License {
    key: string;
    name: string;
    url: string;
    spdx_id: string;
    node_id: string;
    html_url: string;
  }
  export interface Repo {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string;
    fork: boolean;
    url: string;
    git_url: string;
    ssh_url: string;
    clone_url: string;
    language: string | null;
    forks_count: number;
    stargazers_count: number;
    watchers_count: number;
    size: number;
    default_branch: string;
    open_issues_count: number;
    is_template: boolean;
    topics: string[];
    has_issues: boolean;
    has_projects: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    has_downloads: boolean;
    archived: boolean;
    disabled: boolean;
    visibility: string;
    pushed_at: string;
    created_at: string;
    updated_at: string;
    permissions: {
      admin: boolean;
      push: boolean;
      pull: boolean;
    };
    allow_rebase_merge: boolean;
    template_repository: Repo | null;
    temp_clone_token: string;
    allow_squash_merge: boolean;
    allow_auto_merge: boolean;
    delete_branch_on_merge: boolean;
    allow_merge_commit: boolean;
    subscribers_count: number;
    network_count: number;
    license: License;
    forks: number;
    open_issues: number;
    watchers: number;
  }
}
