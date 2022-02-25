import React, { FC, useState } from "react";
import { Objects, ObjectTypes, ProgressInfo } from "./types";

interface EditorViewProps {
  cloned: boolean;
  cloning: boolean;
  repoURL: string;
  branch: string;
  progress: ProgressInfo | null;
  objectTypes?: ObjectTypes;
  objects?: Objects;
  cloneRepo: () => void;
  reset: () => void;
}

interface RepoViewProps {
  repoURL: string;
  branch: string;
  objectTypes?: ObjectTypes;
  objects?: Objects;
}

const RepoView: FC<RepoViewProps> = ({ repoURL, objectTypes, objects }) => {
  return (
    <>
      {Object.keys(objectTypes || {}).map((name) => {
        return <h2>{name}</h2>;
      })}
    </>
  );
};

interface CloneViewProps {
  cloning: boolean;
  branch: string;
  setBranch: string;
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

const EditorView: FC<EditorViewProps> = ({
  branch,
  cloned,
  cloning,
  repoURL,
  cloneRepo,
  progress,
  reset,
  objects,
  objectTypes,
}) => {
  return (
    <div className="editor">
      <span>repo: {repoURL}</span>
      <button onClick={reset}>Reset</button>
      {cloned ? (
        <RepoView
          repoURL={repoURL}
          objects={objects}
          objectTypes={objectTypes}
        />
      ) : (
        <CloneView
          cloning={cloning}
          cloneRepo={cloneRepo}
          progress={progress}
        />
      )}
    </div>
  );
};

export default EditorView;
