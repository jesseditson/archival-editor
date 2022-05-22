import { FC } from "react";
import { ArrowLeft } from "react-feather";
import { EditFieldView } from "./edit-field-view";
import { EditMultiFieldView } from "./edit-multi-field-view";
import { DeleteIcon, PageHeader } from "./lib/styled";
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
    index?: number,
    path?: string
  ) => Promise<ValidationError | void>;
  onAddChild: (
    parentId: string,
    index: number,
    field: string
  ) => Promise<(ValidationError | void)[]>;
  onDelete: (id: string, field?: string, index?: number) => void;
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
  onDelete,
}) => {
  return (
    <div className="object">
      <PageHeader>
        <ArrowLeft onClick={onDismiss} />
        <h2>{object._name}</h2>
        <DeleteIcon
          onClick={() => {
            onDelete(object._id);
            onDismiss();
          }}
        />
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
            onUpdate={(path, index, val) => onUpdate(field, val, index, path)}
            onDelete={(field, index) => onDelete(object._id, field, index)}
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
