import React, { FC } from "react";
import { ProgressInfo } from "./types";

interface EditorViewProps {
  cloned: boolean;
  cloning: boolean;
  repoURL: string;
  progress: ProgressInfo | null;
  cloneRepo: () => void;
  reset: () => void;
}

interface RepoViewProps {
  repoURL: string;
}

const RepoView: FC<RepoViewProps> = ({ repoURL }) => {
  return (
    <>
      <span>repo: {repoURL}</span>
    </>
  );
};

interface CloneViewProps {
  cloning: boolean;
  cloneRepo: () => void;
  progress: ProgressInfo | null;
}

const CloneView: FC<CloneViewProps> = ({ cloning, cloneRepo, progress }) => {
  return (
    <>
      {cloning ? null : <button onClick={cloneRepo}>Clone Repo</button>}
      {progress ? (
        <span>
          {progress.task}: {Math.round(progress.progress * 100)}%
        </span>
      ) : null}
    </>
  );
};

const EditorView: FC<EditorViewProps> = ({
  cloned,
  cloning,
  repoURL,
  cloneRepo,
  progress,
  reset,
}) => {
  return (
    <div className="editor">
      {cloned ? (
        <RepoView repoURL={repoURL} />
      ) : (
        <CloneView
          cloning={cloning}
          cloneRepo={cloneRepo}
          progress={progress}
        />
      )}
      <button onClick={reset}>Reset</button>
    </div>
  );
};

export default EditorView;
