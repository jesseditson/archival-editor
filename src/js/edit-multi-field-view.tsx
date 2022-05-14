import styled from "@emotion/styled";
import { toJS } from "mobx";
import { FC } from "react";
import { EditFieldView } from "./edit-field-view";
import { EditList, EditListField } from "./lib/styled";
import {
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
  onUpdate: (
    value: ObjectValue,
    index: number
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
  values,
  onUpdate,
}) => {
  const childDefinition = (idx: number): ObjectDefinition => {
    return definition[field][idx] as ObjectDefinition;
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
                  definition={type[idx]}
                  object={object}
                  field={childField}
                  disabled={disabled}
                  type={childDefinition(idx)[childField] as ScalarType}
                  value={value[childField] as ObjectValue}
                  onUpdate={(val) => onUpdate(val, idx)}
                />
              </EditListField>
            ))}
          </li>
        ))}
      </EditList>
    </FieldContainer>
  );
};
