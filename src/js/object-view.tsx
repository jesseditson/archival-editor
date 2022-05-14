import { FC } from "react";
import { EditFieldView } from "./edit-field-view";
import { EditMultiFieldView } from "./edit-multi-field-view";
import {
  ObjectData,
  ObjectDefinition,
  ObjectValue,
  ValidationError,
} from "./types";

interface ObjectViewProps {
  type: ObjectDefinition;
  object: ObjectData;
  syncing: boolean;
  onUpdate: (
    field: string,
    value: ObjectValue,
    index?: number
  ) => Promise<ValidationError | void>;
}

export const ObjectView: FC<ObjectViewProps> = ({
  type,
  object,
  syncing,
  onUpdate,
}) => {
  return (
    <div className="object">
      <h3>{object._name}</h3>
      {Object.keys(type).map((field) => (
        <div key={field}>
          <label>{field}:</label>
          {Array.isArray(object[field]) ? (
            <EditMultiFieldView
              definition={type}
              object={object}
              field={field}
              disabled={syncing}
              type={type[field]}
              values={object[field] as ObjectValue[]}
              onUpdate={(val) => onUpdate(field, val)}
            />
          ) : (
            <EditFieldView
              definition={type}
              object={object}
              field={field}
              disabled={syncing}
              type={type[field]}
              value={object[field] as ObjectValue}
              onUpdate={(val) => onUpdate(field, val)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
