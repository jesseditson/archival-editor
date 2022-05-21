import { FC } from "react";
import { ArrowLeft } from "react-feather";
import { EditFieldView } from "./edit-field-view";
import { EditMultiFieldView } from "./edit-multi-field-view";
import { PageHeader } from "./lib/styled";
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

interface ObjectViewProps {
  definition: ObjectDefinition;
  object: ObjectData;
  syncing: boolean;
  changedFields: Map<string, Change>;
  onUpdate: (
    field: string,
    value: ObjectValue,
    index?: number
  ) => Promise<ValidationError | void>;
  onAddChild: (
    parentId: string,
    index: number,
    field: string
  ) => Promise<(ValidationError | void)[]>;
  onDismiss: () => void;
}

export const ObjectView: FC<ObjectViewProps> = ({
  definition,
  object,
  syncing,
  changedFields,
  onUpdate,
  onDismiss,
  onAddChild,
}) => {
  return (
    <div className="object">
      <PageHeader>
        <ArrowLeft onClick={onDismiss} />
        <h2>{object._name}</h2>
      </PageHeader>
      {Object.keys(definition).map((field) =>
        Array.isArray(definition[field]) ? (
          <EditMultiFieldView
            key={field}
            definition={definition}
            object={object}
            field={field}
            changedFields={changedFields}
            disabled={syncing}
            type={definition[field] as ObjectDefinition[]}
            values={object[field] as ObjectChildData[]}
            onAddChild={onAddChild}
            onUpdate={(childField, index, val) =>
              onUpdate(childChangeId(object._id, field, index, childField), val)
            }
          />
        ) : (
          <EditFieldView
            key={field}
            definition={definition}
            object={object}
            field={field}
            changedFields={changedFields}
            disabled={syncing}
            type={definition[field] as ScalarType}
            value={object[field] as ObjectValue}
            onUpdate={(val) => onUpdate(field, val)}
          />
        )
      )}
    </div>
  );
};
