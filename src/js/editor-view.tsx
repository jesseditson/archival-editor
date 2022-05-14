import React, { FC, useState } from "react";
import RepoView from "./repo-view";
import {
  Change,
  Github,
  Objects,
  ObjectTypes,
  ProgressInfo,
  ValidationError,
} from "./types";

interface EditorViewProps {
  cloned: boolean;
  cloning: boolean;
  repo: Github.Repo;
  branch: string;
  progress: ProgressInfo | null;
  objectTypes?: ObjectTypes;
  objects?: Objects;
  onUpdate: (change: Change) => Promise<ValidationError | void>;
  syncing: boolean;
  hasUnsyncedChanges: boolean;
  onSync: () => Promise<void>;
  cloneRepo: (branch: string) => void;
  reset: () => void;
}

interface CloneViewProps {
  cloning: boolean;
  branch: string;
  cloneRepo: (branch: string) => void;
  progress: ProgressInfo | null;
}

const CloneView: FC<CloneViewProps> = ({
  branch: initialBranch,
  cloning,
  cloneRepo,
  progress,
}) => {
  const [branch, updateBranch] = useState(initialBranch);
  return (
    <>
      {cloning ? null : (
        <input
          value={branch}
          onChange={(e) => updateBranch(e.target.value)}
          placeholder="branch"
        />
      )}
      {cloning ? null : (
        <button onClick={() => cloneRepo(branch)}>Clone Repo</button>
      )}
      {progress ? (
        <span>
          {progress.task}: {Math.round(progress.progress * 100)}%
        </span>
      ) : null}
    </>
  );
};

export const EditorView: FC<EditorViewProps> = ({
  branch,
  cloned,
  cloning,
  repo,
  cloneRepo,
  progress,
  reset,
  objects,
  objectTypes,
  onUpdate,
  onSync,
  syncing,
  hasUnsyncedChanges,
}) => {
  return (
    <div className="editor">
      <span>repo: {repo.name}</span>
      <button onClick={reset}>Reset</button>
      {hasUnsyncedChanges && (
        <>
          <span>Changes Not Published</span>
          <button onClick={onSync}>Publish</button>
        </>
      )}
      {cloned ? (
        <RepoView
          branch={branch}
          syncing={syncing}
          repo={repo}
          objects={objects}
          objectTypes={objectTypes}
          onUpdate={onUpdate}
        />
      ) : (
        <CloneView
          branch={branch}
          cloning={cloning}
          cloneRepo={cloneRepo}
          progress={progress}
        />
      )}
    </div>
  );
};
