import { FC } from "react";
import {
  Change,
  ObjectData,
  ObjectDefinition,
  ObjectValue,
  ScalarType,
  ValidationError,
} from "./types";
import editors from "./editors";
import styled from "@emotion/styled";
import { changeId } from "./lib/util";

interface EditFieldViewProps {
  definition: ObjectDefinition;
  object: ObjectData;
  field: string;
  disabled: boolean;
  type: ScalarType;
  value: ObjectValue;
  changedFields: Map<string, Change>;
  onUpdate: (value: ObjectValue) => Promise<ValidationError | void>;
  fieldId?: string;
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
  changedFields,
  onUpdate,
  fieldId,
}) => {
  const Editor = editors[type];
  const cid = fieldId || changeId(object._id, field);
  const change = changedFields.get(cid);
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
          isUnsaved={changedFields.has(cid)}
          initialValue={change ? change.value : value}
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
