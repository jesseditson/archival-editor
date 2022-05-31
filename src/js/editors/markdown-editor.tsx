import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { EditorProps } from "./types";
import throttle from "lodash.throttle";
import styled from "@emotion/styled";
import MarkdownIt from "markdown-it";
import MdEditor from "react-markdown-editor-lite";
// import style manually
import "react-markdown-editor-lite/lib/index.css";
import { FileUploadContext, FileUploadContextProps } from "../lib/file-upload-context";

const mdParser = new MarkdownIt(/* Markdown-it options */);

interface MarkdownEditorProps extends EditorProps<string> { }

const StringEditorContainer = styled.div<{ isUnsaved: boolean }>`
  background-color: ${({ isUnsaved }) => (isUnsaved ? "yellow" : "initial")};
  padding: 5px;
`;

const MarkdownEditorView: FC<MarkdownEditorProps & FileUploadContextProps> = ({
  initialValue,
  field,
  disabled,
  isUnsaved,
  onUpdate,
  onUpload,
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
        onImageUpload={onUpload}
      />
    </StringEditorContainer>
  );
};

export const MarkdownEditor: FC<MarkdownEditorProps> = (props: MarkdownEditorProps) => (
  <FileUploadContext.Consumer>
    {(fuProps: FileUploadContextProps) => (
      <MarkdownEditorView {...props} {...fuProps} />
    )}
  </FileUploadContext.Consumer>
);
