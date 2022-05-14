import { FC } from "react";
import {
  ObjectData,
  ObjectDefinition,
  ObjectValue,
  ScalarType,
  ValidationError,
} from "./types";
import editors from "./editors";
import styled from "@emotion/styled";

interface EditFieldViewProps {
  definition: ObjectDefinition;
  object: ObjectData;
  field: string;
  disabled: boolean;
  type: ScalarType;
  value: ObjectValue;
  onUpdate: (value: ObjectValue) => Promise<ValidationError | void>;
}

const Field = styled.div`
  margin-bottom: 0.5em;
`;

export const EditFieldView: FC<EditFieldViewProps> = ({
  definition,
  object,
  field,
  disabled,
  type,
  value,
  onUpdate,
}) => {
  const Editor = editors[type];
  return (
    <Field>
      <label>{field}:</label>
      {Editor ? (
        <Editor
          definition={definition}
          object={object}
          field={field}
          disabled={disabled}
          type={type}
          initialValue={value}
          onUpdate={onUpdate}
        />
      ) : (
        <span className="no-editor">
          No editor for type {type || "undefined"}.
        </span>
      )}
    </Field>
  );
};
