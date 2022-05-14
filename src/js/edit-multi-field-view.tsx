import { FC } from "react";
import { EditFieldView } from "./edit-field-view";
import {
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
  type: ScalarType;
  values: ObjectValue[];
  onUpdate: (
    value: ObjectValue,
    index: number
  ) => Promise<ValidationError | void>;
}

export const EditMultiFieldView: FC<EditMultiFieldProps> = ({
  definition,
  object,
  field,
  disabled,
  type,
  values,
  onUpdate,
}) => {
  return (
    <ol className="multi-field">
      {values.map((value, idx) => (
        <div className={`field-${idx}`}>
          <EditFieldView
            definition={definition}
            object={object}
            field={field}
            disabled={disabled}
            type={type}
            value={value}
            onUpdate={(val) => onUpdate(val, idx)}
          />
        </div>
      ))}
    </ol>
  );
};
