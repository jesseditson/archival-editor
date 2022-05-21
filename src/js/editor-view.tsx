import styled from "@emotion/styled";
import React, { FC, useCallback, useMemo, useState } from "react";
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

interface EditorViewProps {
  cloned: boolean;
  cloning: boolean;
  repo: Github.Repo;
  branch: string;
  changedFields: Map<string, Change>;
  progress: ProgressInfo | null;
  objectTypes?: ObjectTypes;
  objects?: Objects;
  onUpdate: (change: Change) => Promise<ValidationError | void>;
  onAddObject: (
    name: string,
    type: string,
    object: ObjectDefinition
  ) => Promise<(ValidationError | void)[]>;
  onAddChild: (
    parentType: string,
    object: ObjectDefinition,
    parentId: string,
    index: number,
    field: string
  ) => Promise<(ValidationError | void)[]>;
  onDelete: (id: string, field?: string, index?: number) => void;
  resetChanges: () => Promise<void>;
  syncing: boolean;
  hasUnsyncedChanges: boolean;
  onSync: () => Promise<void>;
  cloneRepo: (branch: string) => void;
  reset: () => void;
}

const SettingsViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1.2em;
  & > * {
    margin-bottom: 1em;
  }
`;
const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  h2 {
    flex-grow: 1;
    font-size: 1em;
  }
`;

interface SettingsViewProps {
  cloning: boolean;
  branch: string;
  onReset: () => void;
  onDismiss: () => void;
  cloneRepo: (branch: string) => void;
  progress: ProgressInfo | null;
}

const Button = styled.button`
  border: 0;
  border-radius: 5px;
`;

const ResetButton = styled(Button)`
  background-color: red;
  color: white;
`;

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
        <ArrowLeft onClick={onDismiss} />
        <h2>Settings</h2>
      </SettingsHeader>
      <div>
        {cloning ? null : (
          <input
            value={branch}
            onChange={(e) => updateBranch(e.target.value)}
            placeholder="branch"
          />
        )}
        {cloning ? null : (
          <Button onClick={() => cloneRepo(branch)}>Checkout Branch</Button>
        )}
      </div>
      {progress ? (
        <span>
          {progress.task}: {Math.round(progress.progress * 100)}%
        </span>
      ) : null}
      <ResetButton onClick={onReset}>Reset Repository</ResetButton>
    </SettingsViewContainer>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SaveButton = styled(Button)`
  font-size: 1.2em;
  padding: 0.2em 0.5em;
`;

const CancelButton = styled(Button)`
  font-size: 1.2em;
  padding: 0.2em 0.5em;
  background-color: transparent;
  margin-right: 10px;
`;

const BottomControls = styled.div`
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
`;
const ControlContent = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 1em;
  align-items: center;
`;

const SyncedNote = styled.span`
  color: #333;
  margin-right: 10px;
`;

const ProgressContainer = styled.div`
  width: 100%;
  position: relative;
  height: 1em;
`;
const ProgressMessage = styled.span`
  position: absolute;
  margin-left: 10px;
`;
const ProgressBar = styled.div<{ completion: number }>`
  position: absolute;
  width: ${({ completion }) => completion * 100}%;
  height: 1em;
  background-color: #ddc5dd;
`;

export const EditorView: FC<EditorViewProps> = ({
  branch,
  cloned,
  cloning,
  repo,
  cloneRepo,
  progress,
  reset,
  resetChanges,
  changedFields,
  objects,
  objectTypes,
  onUpdate,
  onAddChild,
  onAddObject,
  onDelete,
  onSync,
  syncing,
  hasUnsyncedChanges,
}) => {
  const [showingSettings, setShowingSettings] = useState(false);
  const [showingType, setShowingType] = useState<string | null>();
  const [showingObjectIndex, setShowingObjectIndex] = useState<number | null>(
    null
  );
  const goHome = useCallback(() => {
    setShowingType(null);
    setShowingObjectIndex(null);
  }, []);
  const showingObject = useMemo(() => {
    if (!objects || !showingType || showingObjectIndex === null) {
      return null;
    }
    return objects[showingType][showingObjectIndex];
  }, [objects, showingType, showingObjectIndex]);
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
      {showingType && showingObjectIndex !== null ? (
        <ObjectView
          definition={objectTypes![showingType]}
          object={showingObject!}
          syncing={syncing}
          changedFields={changedFields}
          onUpdate={(field, value, index) =>
            onUpdate({
              objectType: showingType,
              id: showingObject!._id,
              field,
              value,
              index,
            })
          }
          onAddChild={(parentId, index, field) =>
            onAddChild(
              showingType,
              objectTypes![showingType],
              parentId,
              index,
              field
            )
          }
          onDelete={onDelete}
          onDismiss={() => setShowingObjectIndex(null)}
        />
      ) : null}
      {showingType && !showingObject ? (
        <ObjectsView
          objects={objects && objects[showingType]}
          type={showingType}
          onShowObjectIndex={setShowingObjectIndex}
          onAddObject={(name: string) =>
            onAddObject(name, showingType, objectTypes![showingType])
          }
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
      <BottomControls>
        {progress ? (
          <ProgressContainer>
            <ProgressBar completion={progress.progress} />
            <ProgressMessage>
              {progress.task}: {Math.round(progress.progress * 100)}%
            </ProgressMessage>
          </ProgressContainer>
        ) : null}
        <ControlContent>
          {hasUnsyncedChanges ? (
            <SyncedNote>
              {changedFields.size} unsynced change
              {changedFields.size === 1 ? "" : "s"}
            </SyncedNote>
          ) : null}
          <CancelButton
            disabled={!hasUnsyncedChanges}
            onClick={() => {
              resetChanges();
              goHome();
            }}
          >
            Reset
          </CancelButton>
          <SaveButton disabled={!hasUnsyncedChanges} onClick={onSync}>
            Publish
          </SaveButton>
        </ControlContent>
      </BottomControls>
    </EditorContainer>
  );
};
