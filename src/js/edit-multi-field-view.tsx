import styled from "@emotion/styled";
import { FC } from "react";
import { EditFieldView } from "./edit-field-view";
import { EditList, EditListField } from "./lib/styled";
import { childId } from "./lib/util";
import {
  Change,
  ObjectChildData,
  ObjectData,
  ObjectDefinition,
  ObjectValue,
  ScalarType,
  ValidationError,
} from "./types";

interface EditMultiFieldProps {
  definition: ObjectDefinition;
  object: ObjectData;
  field: string;
  disabled: boolean;
  type: ObjectDefinition[];
  values: ObjectChildData[];
  changedFields: Map<string, Change>;
  onUpdate: (
    field: string,
    index: number,
    value: ObjectValue
  ) => Promise<ValidationError | void>;
}

const FieldContainer = styled.div`
  border-radius: 1em;
  background-color: #f2f2f2;
  padding: 0.5em;
`;
const FieldLabel = styled.label`
  font-weight: 700;
`;

export const EditMultiFieldView: FC<EditMultiFieldProps> = ({
  definition,
  object,
  field,
  disabled,
  type,
  changedFields,
  values,
  onUpdate,
}) => {
  const childDefinition = (idx: number): ObjectDefinition => {
    // TODO: shouldn't use 0, not sure what's up with this def being an array.
    return definition[field][0] as ObjectDefinition;
  };
  return (
    <FieldContainer>
      <EditList>
        <FieldLabel>{field}:</FieldLabel>
        {values.map((value, idx) => (
          <li key={`child-${idx}`}>
            {Object.keys(childDefinition(idx)).map((childField) => (
              <EditListField key={childField}>
                <EditFieldView
                  definition={type[0]}
                  object={object}
                  field={childField}
                  disabled={disabled}
                  changedFields={changedFields}
                  type={childDefinition(idx)[childField] as ScalarType}
                  value={value[childField] as ObjectValue}
                  onUpdate={(val) => onUpdate(childField, idx, val)}
                  fieldId={childId(field, idx, childField)}
                />
              </EditListField>
            ))}
          </li>
        ))}
      </EditList>
    </FieldContainer>
  );
};
