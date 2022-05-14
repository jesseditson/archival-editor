import { ScalarType } from "../types";
import { EditorProps } from "./types";
import { StringEditor } from "./string-editor";
import { FC } from "react";

const editorMap: { [type: ScalarType]: FC<EditorProps<any>> } = {
  string: StringEditor,
  markdown: StringEditor,
};

export default editorMap;
