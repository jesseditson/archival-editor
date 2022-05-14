import React, { FC, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import styled from "@emotion/styled";
import { EditorVM } from "./viewmodel/editor";
import EditorModel, { onPersist } from "./model/editor";
import { ChooseRepoVM } from "./viewmodel/choose-repo";
import { autorun, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { SignInView } from "./sign-in-view";

const Content = observer<{ editorModel: EditorModel }>(({ editorModel }) => {
  if (editorModel.authenticated) {
    return <EditorVM editorModel={editorModel} />;
  } else if (editorModel.loggedIn) {
    return <ChooseRepoVM editorModel={editorModel} />;
  }
  return <SignInView openSignIn={editorModel.openLogin} />;
});

const AppContainer = styled.div`
  padding: 1em;
`;

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
  return (
    <AppContainer>
      <Content editorModel={editorModel} />
    </AppContainer>
  );
};

ReactDOM.render(<App />, document.getElementById("archival-editor"));
