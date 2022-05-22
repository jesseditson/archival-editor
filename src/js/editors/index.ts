import { ScalarType } from "../types";
import { EditorProps } from "./types";
import { StringEditor } from "./string-editor";
import { FC } from "react";
import { MarkdownEditor } from "./markdown-editor";
import { ImageEditor } from "./image";

const editorMap: Record<ScalarType, FC<EditorProps<any>>> = {
  string: StringEditor,
  markdown: MarkdownEditor,
  image: ImageEditor,
  date: StringEditor,
};

export default editorMap;
