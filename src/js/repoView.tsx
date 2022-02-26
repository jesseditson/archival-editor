import { FC, useCallback } from "react";
import pluralize from "pluralize";
import {
  ObjectData,
  ObjectDefinition,
  Objects,
  ObjectTypes,
  ObjectValue,
  ScalarType,
  ValidationError,
} from "./types";
import editors from "./editors";

interface RepoViewProps {
  repoURL: string;
  branch: string;
  objectTypes?: ObjectTypes;
  objects?: Objects;
  onUpdate: (
    field: string,
    value: ObjectValue,
    index?: number
  ) => Promise<ValidationError>;
}

interface ObjectViewProps {
  type: ObjectDefinition;
  object: ObjectData;
  onUpdate: (
    field: string,
    value: ObjectValue,
    index?: number
  ) => Promise<ValidationError>;
}

interface EditFieldViewProps {
  definition: ObjectDefinition;
  object: ObjectData;
  field: string;
  type: ScalarType;
  value: ObjectValue;
  onUpdate: (value: ObjectValue) => Promise<ValidationError>;
}

interface EditMultiFieldProps {
  definition: ObjectDefinition;
  object: ObjectData;
  field: string;
  type: ScalarType;
  values: ObjectValue[];
  onUpdate: (value: ObjectValue, index: number) => Promise<ValidationError>;
}

const EditFieldView: FC<EditFieldViewProps> = ({
  definition,
  object,
  field,
  type,
  value,
  onUpdate,
}) => {
  const Editor = editors[type];
  if (Editor) {
    return (
      <Editor
        definition={definition}
        object={object}
        field={field}
        type={type}
        initialValue={value}
        onUpdate={onUpdate}
      />
    );
  } else {
    return <span className="no-editor">No editor for type {type}.</span>;
  }
};

const EditMultiFieldView: FC<EditMultiFieldProps> = ({
  definition,
  object,
  field,
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
            type={type}
            value={value}
            onUpdate={(val) => onUpdate(val, idx)}
          />
        </div>
      ))}
    </ol>
  );
};

const ObjectView: FC<ObjectViewProps> = ({ type, object, onUpdate }) => {
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
              type={type[field]}
              values={object[field] as ObjectValue[]}
              onUpdate={(val) => onUpdate(field, val)}
            />
          ) : (
            <EditFieldView
              definition={type}
              object={object}
              field={field}
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

const RepoView: FC<RepoViewProps> = ({
  repoURL,
  objectTypes,
  objects,
  onUpdate,
}) => {
  return (
    <>
      {Object.keys(objectTypes || {}).map((name) => {
        return (
          <div key={name}>
            <h2>{pluralize(name)}</h2>
            {objects ? (
              <ol>
                {objects[name].map((object) => (
                  <li key={object._name}>
                    <ObjectView
                      type={objectTypes![name]}
                      object={object}
                      onUpdate={onUpdate}
                    />
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

export default RepoView;
