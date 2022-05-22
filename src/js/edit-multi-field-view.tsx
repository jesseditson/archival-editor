import styled from "@emotion/styled";
import { toJS } from "mobx";
import { FC, useMemo } from "react";
import { PlusCircle } from "react-feather";
import { EditFieldView } from "./edit-field-view";
import { DeleteIcon, EditList, EditListField } from "./lib/styled";
import { changeId, parseChangeId } from "./lib/util";
import {
  Change,
  ObjectChildData,
  ObjectData,
  ObjectDefinition,
  ObjectValue,
  RootObjectDefinition,
  ScalarType,
  ValidationError,
} from "./types";

interface EditMultiFieldProps {
  definition: RootObjectDefinition;
  object: ObjectData;
  field: string;
  disabled: boolean;
  type: ObjectDefinition[];
  values: (ObjectChildData | undefined)[];
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
  onDelete: (field: string, index: number) => void;
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
const ItemHeader = styled.div`
  display: flex;
  justify-content: flex-end;
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
  onAddChild,
  onUpdate,
  onDelete,
}) => {
  const childDefinition = (idx: number): ObjectDefinition => {
    // TODO: shouldn't use 0, not sure what's up with this def being an array.
    return definition[field][0] as ObjectDefinition;
  };
  const valuesWithChanges = useMemo<(ObjectChildData | undefined)[]>(() => {
    const mergedValues = toJS(values);
    for (const change of changedFields.values()) {
      const { id, field: parentField, index } = parseChangeId(change.id);
      if (mergedValues[index!] === undefined) {
        continue;
      }
      if (id === object._id && parentField === field && index !== null) {
        mergedValues[index] = mergedValues[index] || {};
        mergedValues[index]![change.field] = change.value;
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
            onClick={() =>
              onAddChild(object._id, valuesWithChanges.length, field)
            }
          />
        </FieldHeader>
        {valuesWithChanges.map((value, idx) =>
          value ? (
            <li key={`child-${idx}`}>
              <ItemHeader>
                <DeleteIcon
                  onClick={() => {
                    onDelete(field, idx);
                  }}
                />
              </ItemHeader>
              {Object.keys(childDefinition(idx)).map((path) => (
                <EditListField key={path}>
                  <EditFieldView
                    definition={type[0]}
                    object={object}
                    field={path}
                    disabled={disabled}
                    changedFields={changedFields}
                    type={childDefinition(idx)[path] as ScalarType}
                    value={value[path] as ObjectValue}
                    onUpdate={(val) => onUpdate(path, idx, val)}
                    fieldId={changeId(object._id, field, idx, path)}
                  />
                </EditListField>
              ))}
            </li>
          ) : null
        )}
      </EditList>
    </FieldContainer>
  );
};
