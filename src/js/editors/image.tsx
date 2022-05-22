import React, {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useState,
} from "react";
import { EditorProps } from "./types";
import styled from "@emotion/styled";
import {
  FileUploadContext,
  FileUploadContextProps,
} from "../lib/file-upload-context";
import { Link2, Loader, UploadCloud } from "react-feather";

const IMG_SRC_RE = /^(http|data)/;

interface ImageEditorProps extends EditorProps<string> {}

const ImageEditorContainer = styled.div<{ isUnsaved: boolean }>`
  position: relative;
  border-color: ${({ isUnsaved }) => (isUnsaved ? "yellow" : "transparent")};
  border-width: 5px;
  border-style: solid;
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ImagePreview = styled.div<{ imageURL: string }>`
  width: 100%;
  height: 100%;
  background-image: url("${({ imageURL }) => imageURL}");
  background-repeat: no-repeat;
  background-size: contain;
  position: absolute;
  background-position: center;
  z-index: 0;
`;
const EditorFields = styled.div`
  font-size: 2em;
  display: flex;
  flex-wrap: no-wrap;
  justify-content: center;
  align-items: center;
  padding: 2em;
  width: 100%;
  z-index: 1;
  svg {
    margin-right: 10px;
  }
`;

const Input = styled.input<{ hasValue: boolean }>`
  border: 1px solid #dedede;
  background-color: #fff;
  border-radius: 0.2em;
  flex-grow: 1;
  opacity: ${({ hasValue }) => (hasValue ? 0.6 : 1)};
`;
const HiddenImageLoader = styled.img`
  display: none;
`;

const ImageEditorView: FC<ImageEditorProps & FileUploadContextProps> = ({
  initialValue,
  field,
  disabled,
  isUnsaved,
  onUpdate,
  onUpload,
}) => {
  const [value, setValue] = useState(initialValue || "");
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [shouldUpdate, setShouldUpdate] = useState(false);
  const onChangeInput = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        setUploadMode(false);
        setUploading(true);
        try {
          const url = await onUpload(e.target.files[0]);
          setUploading(false);
          setValue(url);
          onUpdate(url);
        } catch (e) {
          console.error(e);
          setUploading(false);
          setUploadMode(true);
        }
      } else {
        setValue(e.target.value);
        setShouldUpdate(true);
      }
    },
    [uploadMode, onUpdate]
  );
  const onImageLoaded = useCallback(() => {
    if (shouldUpdate) {
      onUpdate(value);
      setShouldUpdate(false);
    }
  }, [shouldUpdate, onUpdate, value]);
  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);
  return (
    <ImageEditorContainer isUnsaved={isUnsaved}>
      {value && IMG_SRC_RE.test(value) ? (
        <>
          <HiddenImageLoader src={value} onLoad={onImageLoaded} />
          <ImagePreview imageURL={value} />
        </>
      ) : null}
      <EditorFields>
        {!uploadMode ? (
          <UploadCloud onClick={() => setUploadMode(true)} />
        ) : (
          <Link2 onClick={() => setUploadMode(false)} />
        )}
        {uploadMode ? (
          <Input
            hasValue={!!value}
            disabled={disabled}
            type="file"
            onChange={onChangeInput}
          />
        ) : null}
        {!uploadMode && !uploading ? (
          <Input
            hasValue={!!value}
            disabled={disabled}
            value={value}
            placeholder="paste an image URL here"
            onChange={onChangeInput}
          />
        ) : null}
        {uploading ? <Loader /> : null}
      </EditorFields>
    </ImageEditorContainer>
  );
};

export const ImageEditor: FC<ImageEditorProps> = (props: ImageEditorProps) => (
  <FileUploadContext.Consumer>
    {(fuProps: FileUploadContextProps) => (
      <ImageEditorView {...props} {...fuProps} />
    )}
  </FileUploadContext.Consumer>
);
