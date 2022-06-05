import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import EditorModel from "../model/editor";
import { EditorView } from "../editor-view";
import { FileUploadContext } from "../lib/file-upload-context";

export const EditorVM = observer<{ editorModel: EditorModel }>(
  ({ editorModel }) => {
    const onUpload = useCallback(
      (file: File) => editorModel.uploadFile(file),
      [editorModel.uploadFile]
    );
    return (
      <FileUploadContext.Provider value={{ onUpload }}>
        <EditorView
          repo={editorModel.repo!}
          branch={editorModel.branch}
          cloneRepo={editorModel.cloneRepo}
          netlifyConnected={editorModel.netlifyConnected}
          netlifyAccessToken={editorModel.netlifyAccessToken}
          onNetlifyLogout={editorModel.onNetlifyLogout}
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
          onDelete={editorModel.onRemove}
          syncing={editorModel.syncing}
          onSync={editorModel.sync}
          hasUnsyncedChanges={editorModel.hasUnsyncedChanges}
        />
      </FileUploadContext.Provider>
    );
  }
);
