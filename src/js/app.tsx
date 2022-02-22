import React from "react";
import ReactDOM from "react-dom";
import EditorVM from "./viewmodel/editor";
import EditorModel from "./model/editor";

const editorModel = new EditorModel();

ReactDOM.render(
  <EditorVM model={editorModel} />,
  document.getElementById("archival-editor")
);
