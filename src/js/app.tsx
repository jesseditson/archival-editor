import React, { FC, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import EditorVM from "./viewmodel/editor";
import EditorModel, { onPersist } from "./model/editor";
import ChooseRepoVM from "./viewmodel/chooseRepo";

const App: FC = () => {
  const createModel = useCallback(
    () =>
      new EditorModel(
        localStorage.getItem("editorModel"),
        window.location.pathname,
        window.location.search
      ),
    []
  );
  const editorModel = createModel();
  useEffect(() => {
    onPersist(editorModel, (serialized) => {
      localStorage.setItem("editorModel", serialized);
    });
  }, [editorModel]);
  if (editorModel.authenticated) {
    return <EditorVM editorModel={editorModel} />;
  }
  return <ChooseRepoVM editorModel={editorModel} />;
};

ReactDOM.render(<App />, document.getElementById("archival-editor"));
