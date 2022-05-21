import styled from "@emotion/styled";
import { toJS } from "mobx";
import { FC, useMemo } from "react";
import { PlusCircle } from "react-feather";
import { EditFieldView } from "./edit-field-view";
import { EditList, EditListField } from "./lib/styled";
import { childChangeId, childFieldFromChangeId } from "./lib/util";
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
  const valuesWithChanges = useMemo<ObjectChildData[]>(() => {
    const mergedValues = toJS(values);
    for (const change of changedFields.values()) {
      const {
        id,
        field: parentField,
        index,
      } = childFieldFromChangeId(change.id);
      if (id === object._id && parentField === field && index !== null) {
        mergedValues[index] = mergedValues[index] || {};
        mergedValues[index][change.field] = change.value;
      }
    }
    return mergedValues;
  }, [values, changedFields]);
  return (
    <FieldContainer>
      <EditList>
        <FieldHeader>
          <FieldLabel>{field}:</FieldLabel>
          <PlusCircle
            onClick={() => onAddChild(object._id, values.length, field)}
          />
        </FieldHeader>
        {valuesWithChanges.map((value, idx) => (
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
                  onUpdate={(val) => onUpdate(field, idx, val)}
                  fieldId={childChangeId(object._id, field, idx, childField)}
                />
              </EditListField>
            ))}
          </li>
        ))}
      </EditList>
    </FieldContainer>
  );
};
