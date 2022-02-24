import React, { FC } from "react";

interface EditorViewProps {
  repoURL: string;
  cloneRepo: (repoURL: string) => void;
}

const EditorView: FC<EditorViewProps> = ({ repoURL, cloneRepo }) => {
  return <div className="editor">Editor</div>;
};

export default EditorView;
