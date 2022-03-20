import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import EditorModel from "../model/editor";
import ChooseRepoView from "../chooseRepoView";
import { v4 as uuidv4 } from "uuid";
import { runInAction } from "mobx";
import { Github } from "../types";

const CONFIG = {
  authURL: "https://github.com/login/oauth/authorize",
  redirectURI: process.env.GITHUB_REDIRECT_URI!,
  clientID: process.env.GITHUB_CLIENT_ID!,
  scopes: ["repo"],
};

const ChooseRepoVM = observer<{ editorModel: EditorModel }>(
  ({ editorModel }) => {
    const setRepo = useCallback((repo: Github.Repo) => {
      editorModel.setRepo(repo);
      if (!editorModel.authenticated) {
        const newURL = `${CONFIG.authURL}?redirect_uri=${encodeURIComponent(
          CONFIG.redirectURI
        )}&client_id=${CONFIG.clientID}&scope=${CONFIG.scopes.join(
          " "
        )}&state=${uuidv4()}`;
        window.location.href = newURL;
      }
    }, []);
    return (
      <ChooseRepoView
        refreshRepos={editorModel.refreshRepos}
        repoList={editorModel.repoList}
        setRepo={setRepo}
      />
    );
  }
);
export default ChooseRepoVM;
