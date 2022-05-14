import { FC } from "react";
import {
  ObjectData,
  ObjectDefinition,
  ObjectValue,
  ScalarType,
  ValidationError,
} from "./types";
import editors from "./editors";
import { toJS } from "mobx";

interface EditFieldViewProps {
  definition: ObjectDefinition;
  object: ObjectData;
  field: string;
  disabled: boolean;
  type: ScalarType;
  value: ObjectValue;
  onUpdate: (value: ObjectValue) => Promise<ValidationError | void>;
}

export const EditFieldView: FC<EditFieldViewProps> = ({
  definition,
  object,
  field,
  disabled,
  type,
  value,
  onUpdate,
}) => {
  const Editor = editors[toJS(type)];
  if (Editor) {
    return (
      <Editor
        definition={definition}
        object={object}
        field={field}
        disabled={disabled}
        type={type}
        initialValue={value}
        onUpdate={onUpdate}
      />
    );
  } else {
    return <span className="no-editor">No editor for type {toJS(type)}.</span>;
  }
};
