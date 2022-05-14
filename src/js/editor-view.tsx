import styled from "@emotion/styled";
import React, { FC, useCallback, useState } from "react";
import { ArrowLeft, Settings } from "react-feather";
import { EditorContainer } from "./lib/styled";
import { ObjectView } from "./object-view";
import { ObjectTypesView } from "./object-types-view";
import {
  Change,
  Github,
  ObjectData,
  ObjectDefinition,
  Objects,
  ObjectTypes,
  ProgressInfo,
  ValidationError,
} from "./types";
import { ObjectsView } from "./objects-view";
import { toJS } from "mobx";

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

const SettingsViewContainer = styled.div``;
const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

interface SettingsViewProps {
  cloning: boolean;
  branch: string;
  onReset: () => void;
  onDismiss: () => void;
  cloneRepo: (branch: string) => void;
  progress: ProgressInfo | null;
}

const SettingsView: FC<SettingsViewProps> = ({
  branch: initialBranch,
  cloning,
  cloneRepo,
  progress,
  onReset,
  onDismiss,
}) => {
  const [branch, updateBranch] = useState(initialBranch);
  return (
    <SettingsViewContainer>
      <SettingsHeader>
        <ArrowLeft onClick={onDismiss} /> Settings
      </SettingsHeader>
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
      <button onClick={onReset}>Reset</button>
    </SettingsViewContainer>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

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
  const [showingSettings, setShowingSettings] = useState(false);
  const [showingType, setShowingType] = useState<string | null>();
  const [showingObject, setShowingObject] = useState<ObjectData | null>(null);
  const goHome = useCallback(() => {
    setShowingType(null);
    setShowingObject(null);
  }, []);
  if (showingSettings) {
    return (
      <SettingsView
        onDismiss={() => setShowingSettings(false)}
        onReset={reset}
        branch={branch}
        cloning={cloning}
        cloneRepo={cloneRepo}
        progress={progress}
      />
    );
  }
  return (
    <EditorContainer>
      <HeaderContainer>
        <h1 onClick={goHome}>{repo.name}</h1>
        <Settings onClick={() => setShowingSettings(true)} />
      </HeaderContainer>
      {hasUnsyncedChanges && (
        <>
          <span>Changes Not Published</span>
          <button onClick={onSync}>Publish</button>
        </>
      )}
      {progress ? (
        <span>
          {progress.task}: {Math.round(progress.progress * 100)}%
        </span>
      ) : null}
      {showingType && showingObject ? (
        <ObjectView
          definition={objectTypes![showingType]}
          object={showingObject}
          syncing={syncing}
          onUpdate={(field, value, index) =>
            onUpdate({
              objectType: showingType,
              id: showingObject._id,
              field,
              value,
              index,
            })
          }
          onDismiss={() => setShowingObject(null)}
        />
      ) : null}
      {showingType && !showingObject ? (
        <ObjectsView
          objects={objects && objects[showingType]}
          type={showingType}
          onShowObject={setShowingObject}
          onDismiss={goHome}
        />
      ) : null}
      {!showingObject && !showingType && cloned ? (
        <ObjectTypesView
          objects={objects}
          types={objectTypes}
          onShowType={setShowingType}
        />
      ) : null}
    </EditorContainer>
  );
};
