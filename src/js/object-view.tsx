import { FC } from "react";
import { ArrowLeft } from "react-feather";
import { EditFieldView } from "./edit-field-view";
import { EditMultiFieldView } from "./edit-multi-field-view";
import { PageHeader } from "./lib/styled";
import {
  ObjectData,
  ObjectDefinition,
  ObjectValue,
  ValidationError,
} from "./types";

interface ObjectViewProps {
  type: string;
  definition: ObjectDefinition;
  object: ObjectData;
  syncing: boolean;
  onUpdate: (
    field: string,
    value: ObjectValue,
    index?: number
  ) => Promise<ValidationError | void>;
  onDismiss: () => void;
}

export const ObjectView: FC<ObjectViewProps> = ({
  type,
  definition,
  object,
  syncing,
  onUpdate,
  onDismiss,
}) => {
  return (
    <div className="object">
      <PageHeader>
        <ArrowLeft onClick={onDismiss} />
        <h3>{object._name}</h3>
      </PageHeader>
      {Object.keys(type).map((field) => (
        <div key={field}>
          <label>{field}:</label>
          {Array.isArray(object[field]) ? (
            <EditMultiFieldView
              definition={definition}
              object={object}
              field={field}
              disabled={syncing}
              type={definition[field]}
              values={object[field] as ObjectValue[]}
              onUpdate={(val) => onUpdate(field, val)}
            />
          ) : (
            <EditFieldView
              definition={definition}
              object={object}
              field={field}
              disabled={syncing}
              type={definition[field]}
              value={object[field] as ObjectValue}
              onUpdate={(val) => onUpdate(field, val)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
