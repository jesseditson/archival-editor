import React from "react";
import { observer } from "mobx-react-lite";
import EditorModel from "../model/editor";
import { EditorView } from "../editor-view";

export const EditorVM = observer<{ editorModel: EditorModel }>(
  ({ editorModel }) => {
    return (
      <EditorView
        repo={editorModel.repo!}
        branch={editorModel.branch}
        cloneRepo={editorModel.cloneRepo}
        progress={editorModel.progressInfo}
        cloned={editorModel.cloned}
        cloning={editorModel.cloning}
        reset={editorModel.reset}
        resetChanges={editorModel.resetChanges}
        changedFields={editorModel.changedFields}
        objectTypes={editorModel.objects?.types}
        objects={editorModel.objects?.objects}
        onUpdate={editorModel.onUpdate}
        onAddObject={editorModel.onAddObject}
        onAddChild={editorModel.onAddChild}
        syncing={editorModel.syncing}
        onSync={editorModel.sync}
        hasUnsyncedChanges={editorModel.hasUnsyncedChanges}
      />
    );
  }
);
