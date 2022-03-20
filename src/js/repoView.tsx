import { FC, useCallback } from "react";
import pluralize from "pluralize";
import {
  Change,
  Github,
  ObjectData,
  ObjectDefinition,
  Objects,
  ObjectTypes,
  ObjectValue,
  ScalarType,
  ValidationError,
} from "./types";
import editors from "./editors";
import { toJS } from "mobx";

interface RepoViewProps {
  repo: Github.Repo;
  branch: string;
  syncing: boolean;
  objectTypes?: ObjectTypes;
  objects?: Objects;
  onUpdate: (change: Change) => Promise<ValidationError | void>;
}

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

interface EditFieldViewProps {
  definition: ObjectDefinition;
  object: ObjectData;
  field: string;
  disabled: boolean;
  type: ScalarType;
  value: ObjectValue;
  onUpdate: (value: ObjectValue) => Promise<ValidationError | void>;
}

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

const EditFieldView: FC<EditFieldViewProps> = ({
  definition,
  object,
  field,
  disabled,
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
        disabled={disabled}
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

const ObjectView: FC<ObjectViewProps> = ({
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

const RepoView: FC<RepoViewProps> = ({
  repo,
  syncing,
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
                {(objects[name] || []).map((object) => (
                  <li key={object._name}>
                    <ObjectView
                      type={objectTypes![name]}
                      object={object}
                      syncing={syncing}
                      onUpdate={(field, value, index) =>
                        onUpdate({
                          objectType: name,
                          id: object._id,
                          field,
                          value,
                          index,
                        })
                      }
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
