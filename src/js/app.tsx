import React, { FC, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { EditorVM } from "./viewmodel/editor";
import EditorModel, { onPersist } from "./model/editor";
import { ChooseRepoVM } from "./viewmodel/choose-repo";
import { autorun, toJS } from "mobx";
import { observer } from "mobx-react-lite";

const Content = observer<{ editorModel: EditorModel }>(({ editorModel }) => {
  if (editorModel.authenticated) {
    return <EditorVM editorModel={editorModel} />;
  }
  return <ChooseRepoVM editorModel={editorModel} />;
});

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
      console.log("writing:", JSON.parse(serialized));
      localStorage.setItem("editorModel", serialized);
    });
    autorun(() => {
      console.log(toJS(editorModel));
    });
  }, [editorModel]);
  return <Content editorModel={editorModel} />;
};

ReactDOM.render(<App />, document.getElementById("archival-editor"));
