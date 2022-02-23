import React, { FC, useState } from "react";
import EditorModel from "./model/editor";

interface EditorProps {
  currentRepoURL: string;
  cloneRepo: (repoURL: string) => void;
}

const Editor: FC<EditorProps> = ({ currentRepoURL, cloneRepo }) => {
  const [repoURL, setRepoURL] = useState<string>(currentRepoURL);
  return (
    <div className="editor">
      <input
        onChange={(t) => setRepoURL(t.target.value)}
        placeholder="repo URL"
        value={repoURL}
      />
      <button onClick={() => cloneRepo(repoURL)}>Clone</button>
    </div>
  );
};

export default Editor;
