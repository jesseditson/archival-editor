import styled from "@emotion/styled";
import { FC } from "react";
import { PlusCircle } from "react-feather";
import { EditFieldView } from "./edit-field-view";
import { EditList, EditListField } from "./lib/styled";
import { childChangeId } from "./lib/util";
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
  onAddChild: (
    parentId: string,
    index: number,
    field: string
  ) => Promise<(ValidationError | void)[]>;
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
  flex-grow: 1;
`;
const FieldHeader = styled.div`
  display: flex;
`;

export const EditMultiFieldView: FC<EditMultiFieldProps> = ({
  definition,
  object,
  field,
  disabled,
  type,
  changedFields,
  values,
  onAddChild,
  onUpdate,
}) => {
  const childDefinition = (idx: number): ObjectDefinition => {
    // TODO: shouldn't use 0, not sure what's up with this def being an array.
    return definition[field][0] as ObjectDefinition;
  };
  return (
    <FieldContainer>
      <EditList>
        <FieldHeader>
          <FieldLabel>{field}:</FieldLabel>
          <PlusCircle
            onClick={() => onAddChild(object._id, values.length, field)}
          />
        </FieldHeader>
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
                  fieldId={childChangeId(field, idx, childField)}
                />
              </EditListField>
            ))}
          </li>
        ))}
      </EditList>
    </FieldContainer>
  );
};
