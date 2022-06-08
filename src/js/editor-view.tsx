import styled from "@emotion/styled";
import React, { FC, useCallback, useMemo, useState } from "react";
import { Activity, Settings } from "react-feather";
import { Button, EditorContainer } from "./lib/styled";
import { ObjectView } from "./object-view";
import { ObjectTypesView } from "./object-types-view";
import {
  Change,
  CommitsData,
  Github,
  Objects,
  ObjectTypes,
  ProgressInfo,
  RootObjectDefinition,
  ValidationError,
} from "./types";
import { ObjectsView } from "./objects-view";
import { changeId } from "./lib/util";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorView } from "./error-view";
import { SettingsView } from "./settings-view";
import { NetlifyHistory } from "./viewmodel/netlify-history";
import { toJS } from "mobx";

interface EditorViewProps {
  cloned: boolean;
  cloning: boolean;
  repo: Github.Repo;
  branch: string;
  changedFields: Map<string, Change>;
  progress: ProgressInfo | null;
  objectTypes?: ObjectTypes;
  objects?: Objects;
  netlifyConnected: boolean;
  getGitShas: (shas: string[]) => Promise<CommitsData>;
  netlifyAccessToken?: string;
  onNetlifyLogout: () => void;
  onUpdate: (change: Change) => Promise<ValidationError | void>;
  onAddObject: (
    name: string,
    type: string,
    object: RootObjectDefinition
  ) => Promise<(ValidationError | void)[]>;
  onAddChild: (
    parentType: string,
    object: RootObjectDefinition,
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
  getGitShas,
  netlifyConnected,
  netlifyAccessToken,
  onNetlifyLogout,
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
  const [showingNetlifyBuilds, setShowingNetlifyBuilds] = useState(false);
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
        netlifyConnected={netlifyConnected}
        onNetlifyLogout={onNetlifyLogout}
        onReset={reset}
        branch={branch}
        cloning={cloning}
        cloneRepo={cloneRepo}
        progress={progress}
      />
    );
  }
  if (showingNetlifyBuilds && netlifyAccessToken) {
    return (
      <NetlifyHistory accessToken={netlifyAccessToken} repoURL={repo.html_url} fetchShaInfo={getGitShas} onDismiss={() => setShowingNetlifyBuilds(false)} />
    )
  }
  return (
    <EditorContainer>
      <HeaderContainer>
        <h1 onClick={goHome}>{repo.name}</h1>
        <div>
          {netlifyConnected ? <Activity onClick={() => setShowingNetlifyBuilds(true)} /> : null}
          <Settings onClick={() => setShowingSettings(true)} />
        </div>
      </HeaderContainer>
      <ErrorBoundary FallbackComponent={ErrorView}>
        {showingType && showingObjectIndex !== null ? (
          <ObjectView
            definition={objectTypes![showingType]}
            object={showingObject!}
            syncing={syncing}
            changedFields={changedFields}
            onUpdate={(field, value, index, path) =>
              onUpdate({
                objectType: showingType,
                id: changeId(showingObject!._id, field, index, path),
                field,
                value,
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
      </ErrorBoundary>
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
            <SyncedNote>unsynced changes</SyncedNote>
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
