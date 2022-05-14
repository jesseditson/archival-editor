import styled from "@emotion/styled";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Loader } from "react-feather";
import { EditorContainer } from "./lib/styled";
import { Github, ProgressInfo } from "./types";

const ARCHIVAL_WEBSITE_TEMPLATE_NODE_ID = "R_kgDOGX83rQ";

interface ChooseRepoViewProps {
  progressInfo: ProgressInfo | null;
  refreshRepos: () => void;
  repoList: Github.Repo[];
  setRepo: (repo: Github.Repo) => void;
}

const Filters = styled.fieldset`
  font-size: 1em;
`;
const RepoList = styled.ul`
  font-size: 1em;
  list-style-type: none;
  padding-left: 0;
`;

export const ChooseRepoView: FC<ChooseRepoViewProps> = ({
  progressInfo,
  repoList,
  refreshRepos,
  setRepo,
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);
  const [showForks, setShowForks] = useState<boolean>(false);
  const toggleShowAll = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowAll(e.target.checked);
    },
    [showAll]
  );
  const toggleShowForks = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowForks(e.target.checked);
    },
    [showForks]
  );
  const repos = useMemo(() => {
    return repoList.filter((repo) => {
      if (
        // TODO: this doesn't seem to be returned :(
        repo.template_repository &&
        repo.template_repository?.node_id === ARCHIVAL_WEBSITE_TEMPLATE_NODE_ID
      ) {
        return true;
      }
      // Make some educated guesses
      if (repo.topics.includes("archival") || repo.language === "CSS") {
        return true;
      }
      if (!showAll) {
        return false;
      }
      if (repo.archived || repo.disabled) {
        return false;
      }
      return showForks ? true : !repo.fork;
    });
  }, [repoList, showForks, showAll]);
  useEffect(() => {
    if (repoList.length === 0) {
      refreshRepos();
    }
  }, [repoList]);
  if (progressInfo?.task) {
    return (
      <EditorContainer>
        {progressInfo.task}
        <Loader />
      </EditorContainer>
    );
  }
  return (
    <EditorContainer>
      <h1>Choose a Website</h1>
      <Filters>
        {repos.length && (
          <label>
            Show All:{" "}
            <input type="checkbox" checked={showAll} onChange={toggleShowAll} />
          </label>
        )}
        {showAll && (
          <label>
            Show Forks:{" "}
            <input
              type="checkbox"
              checked={showForks}
              onChange={toggleShowForks}
            />
          </label>
        )}
      </Filters>
      <RepoList>
        {repos.map((repo) => (
          <li key={repo.node_id} className="repo" onClick={() => setRepo(repo)}>
            <h3>{repo.name}</h3>
            {repo.template_repository}
          </li>
        ))}
      </RepoList>
    </EditorContainer>
  );
};
