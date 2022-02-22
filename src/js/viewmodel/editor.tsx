import React from "react";
import { observer } from "mobx-react-lite";
import EditorModel from "../model/editor";
import Editor from "../editor";

const EditorVM = observer<{ model: EditorModel }>(({ model }) => (
  <Editor data={model} />
));
export default EditorVM;
