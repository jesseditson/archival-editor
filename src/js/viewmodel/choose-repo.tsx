import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import EditorModel from "../model/editor";
import { ChooseRepoView } from "../choose-repo-view";
import { Github } from "../types";

export const ChooseRepoVM = observer<{ editorModel: EditorModel }>(
  ({ editorModel }) => {
    const setRepo = useCallback((repo: Github.Repo) => {
      editorModel.setRepo(repo);
    }, []);
    return (
      <ChooseRepoView
        progressInfo={editorModel.progressInfo}
        refreshRepos={editorModel.refreshRepos}
        repoList={editorModel.repoList}
        setRepo={setRepo}
      />
    );
  }
);
