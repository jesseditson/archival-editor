import React, { FC, useState } from "react";
import RepoView from "./repoView";
import { Objects, ObjectTypes, ProgressInfo } from "./types";

interface EditorViewProps {
  cloned: boolean;
  cloning: boolean;
  repoURL: string;
  branch: string;
  progress: ProgressInfo | null;
  objectTypes?: ObjectTypes;
  objects?: Objects;
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
          branch={branch}
          repoURL={repoURL}
          objects={objects}
          objectTypes={objectTypes}
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

export default EditorView;
