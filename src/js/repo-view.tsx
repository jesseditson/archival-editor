import { FC } from "react";
import pluralize from "pluralize";
import { Change, Github, Objects, ObjectTypes, ValidationError } from "./types";
import { ObjectView } from "./object-view";

interface RepoViewProps {
  repo: Github.Repo;
  branch: string;
  syncing: boolean;
  objectTypes?: ObjectTypes;
  objects?: Objects;
  onUpdate: (change: Change) => Promise<ValidationError | void>;
}

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
