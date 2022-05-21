import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { EditorProps } from "./types";
import throttle from "lodash.throttle";
import styled from "@emotion/styled";

interface StringEditorProps extends EditorProps<string> {}

const StringEditorContainer = styled.div<{ isUnsaved: boolean }>`
  background-color: ${({ isUnsaved }) => (isUnsaved ? "yellow" : "initial")};
  padding: 5px;
`;

const StringInput = styled.input`
  width: 100%;
  font-size: 1.2em;
`;

export const StringEditor: FC<StringEditorProps> = ({
  initialValue,
  field,
  disabled,
  isUnsaved,
  onUpdate,
}) => {
  const [value, setValue] = useState(initialValue);
  const updateValue = useMemo(
    () =>
      throttle((value) => {
        onUpdate(value);
      }, 400),
    [onUpdate]
  );
  const onType = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }
      setValue(e.target.value);
      updateValue(e.target.value);
    },
    [updateValue, disabled]
  );
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  return (
    <StringEditorContainer isUnsaved={isUnsaved}>
      <StringInput
        value={value}
        disabled={disabled}
        onChange={onType}
        placeholder={field}
      />
    </StringEditorContainer>
  );
};
