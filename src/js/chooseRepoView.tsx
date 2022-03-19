import { toJS } from "mobx";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Github } from "./types";

const ARCHIVAL_WEBSITE_TEMPLATE_NODE_ID = "R_kgDOGX83rQ";

interface ChooseRepoViewProps {
  refreshRepos: () => void;
  repoList: Github.Repo[];
  initialRepoURL: string;
  setRepo: (repo: Github.Repo) => void;
}

const ChooseRepoView: FC<ChooseRepoViewProps> = ({
  repoList,
  refreshRepos,
  initialRepoURL,
  setRepo,
}) => {
  const [repoURL, updateRepoURL] = useState<string>(initialRepoURL);
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
        repo.name === "christianreynoso.com" ||
        repo.name === "archival-website"
      ) {
        console.log(toJS(repo));
      }
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
    if (repos.length === 0) {
      setShowAll(true);
    }
  }, [repos.length]);
  useEffect(() => {
    if (repoList.length === 0) {
      refreshRepos();
    }
  }, [repoList]);
  return (
    <div className="editor">
      <fieldset className="filters">
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
      </fieldset>
      <ul className="repo-list">
        {repos.map((repo) => (
          <li key={repo.node_id} className="repo" onClick={() => setRepo(repo)}>
            <h3>{repo.name}</h3>
            {repo.template_repository}
          </li>
        ))}
      </ul>
      {/* <input
        onChange={(t) => updateRepoURL(t.target.value)}
        placeholder="repo URL"
        value={repoURL}
      />
      <button onClick={() => setRepoURL(repoURL)}>Choose</button> */}
    </div>
  );
};

export default ChooseRepoView;
