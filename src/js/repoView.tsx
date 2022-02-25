import { FC } from "react";
import pluralize from "pluralize";
import { ObjectData, ObjectDefinition, Objects, ObjectTypes } from "./types";

interface RepoViewProps {
  repoURL: string;
  branch: string;
  objectTypes?: ObjectTypes;
  objects?: Objects;
}

interface ObjectViewProps {
  type: ObjectDefinition;
  object: ObjectData;
}

const ObjectView: FC<ObjectViewProps> = ({ type, object }) => {
  return (
    <div className="object">
      <h3>{object._name}</h3>
      {Object.keys(type).map((field) => (
        <div key={field}>
          <label>{field}:</label>
          {/* {object[field]} */}
        </div>
      ))}
    </div>
  );
};

const RepoView: FC<RepoViewProps> = ({ repoURL, objectTypes, objects }) => {
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
                    <ObjectView type={objectTypes![name]} object={object} />
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
