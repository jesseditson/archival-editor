import React, { FC, useState } from "react";

interface ChooseRepoViewProps {
  initialRepoURL: string;
  setRepoURL: (repoURL: string) => void;
}

const ChooseRepoView: FC<ChooseRepoViewProps> = ({
  initialRepoURL,
  setRepoURL,
}) => {
  const [repoURL, updateRepoURL] = useState<string>(initialRepoURL);
  return (
    <div className="editor">
      <input
        onChange={(t) => updateRepoURL(t.target.value)}
        placeholder="repo URL"
        value={repoURL}
      />
      <button onClick={() => setRepoURL(repoURL)}>Choose</button>
    </div>
  );
};

export default ChooseRepoView;
