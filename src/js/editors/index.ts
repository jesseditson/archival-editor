import { ScalarType } from "../types";
import { EditorProps } from "./types";
import { StringEditor } from "./string-editor";
import { FC } from "react";
import { MarkdownEditor } from "./markdown-editor";

const editorMap: { [type: ScalarType]: FC<EditorProps<any>> } = {
  string: StringEditor,
  markdown: MarkdownEditor,
};

export default editorMap;
