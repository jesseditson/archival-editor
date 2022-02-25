import React from "react";
import { observer } from "mobx-react-lite";
import EditorModel from "../model/editor";
import EditorView from "../editorView";

const EditorVM = observer<{ editorModel: EditorModel }>(({ editorModel }) => {
  return (
    <EditorView
      repoURL={editorModel.repoURL}
      branch={editorModel.branch}
      cloneRepo={editorModel.cloneRepo}
      progress={editorModel.progressInfo}
      cloned={editorModel.cloned}
      cloning={editorModel.cloning}
      reset={editorModel.reset}
      objectTypes={editorModel.objects?.types}
      objects={editorModel.objects?.objects}
    />
  );
});
export default EditorVM;
