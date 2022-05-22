import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { EditorProps } from "./types";
import throttle from "lodash.throttle";
import styled from "@emotion/styled";
import MarkdownIt from "markdown-it";
import MdEditor from "react-markdown-editor-lite";
// import style manually
import "react-markdown-editor-lite/lib/index.css";

const mdParser = new MarkdownIt(/* Markdown-it options */);

interface MarkdownEditorProps extends EditorProps<string> {}

const StringEditorContainer = styled.div<{ isUnsaved: boolean }>`
  background-color: ${({ isUnsaved }) => (isUnsaved ? "yellow" : "initial")};
  padding: 5px;
`;

export const MarkdownEditor: FC<MarkdownEditorProps> = ({
  initialValue,
  field,
  disabled,
  isUnsaved,
  onUpdate,
}) => {
  const [value, setValue] = useState(initialValue);
  const updateValue = useMemo(
    () =>
      throttle((text: string) => {
        onUpdate(text);
      }, 400),
    [onUpdate]
  );
  const onChange = useCallback(
    ({ text }: { text: string }) => {
      setValue(text);
      updateValue(text);
    },
    [setValue, updateValue]
  );
  const onImageUpload = useCallback((file: File) => {
    //TODO
    console.error("Image uploading not yet supported.");
  }, []);
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  return (
    <StringEditorContainer isUnsaved={isUnsaved}>
      <MdEditor
        value={value}
        readOnly={disabled}
        style={{ height: "500px" }}
        renderHTML={(text) => mdParser.render(text)}
        onChange={onChange}
        onImageUpload={onImageUpload}
      />
    </StringEditorContainer>
  );
};
