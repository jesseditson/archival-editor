import styled from "@emotion/styled";
import { toJS } from "mobx";
import { FC } from "react";
import { ArrowLeft } from "react-feather";
import { EditFieldView } from "./edit-field-view";
import { EditMultiFieldView } from "./edit-multi-field-view";
import { PageHeader } from "./lib/styled";
import {
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
  onUpdate: (
    field: string,
    value: ObjectValue,
    index?: number
  ) => Promise<ValidationError | void>;
  onDismiss: () => void;
}

export const ObjectView: FC<ObjectViewProps> = ({
  definition,
  object,
  syncing,
  onUpdate,
  onDismiss,
}) => {
  console.log(Array.isArray(definition["links"]));
  return (
    <div className="object">
      <PageHeader>
        <ArrowLeft onClick={onDismiss} />
        <h2>{object._name}</h2>
      </PageHeader>
      {Object.keys(definition).map((field) =>
        Array.isArray(definition[field]) ? (
          <EditMultiFieldView
            definition={definition}
            object={object}
            field={field}
            disabled={syncing}
            type={definition[field] as ObjectDefinition[]}
            values={object[field] as ObjectChildData[]}
            onUpdate={(val) => onUpdate(field, val)}
          />
        ) : (
          <EditFieldView
            definition={definition}
            object={object}
            field={field}
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
