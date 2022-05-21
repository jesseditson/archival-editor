import { FC, useCallback } from "react";
import pluralize from "pluralize";
import { ObjectData, ValidationError } from "./types";
import { PageHeader, RoundedList, RoundedListRow } from "./lib/styled";
import { ArrowLeft, ArrowRight, PlusCircle } from "react-feather";

interface ObjectsViewProps {
  type: string;
  objects?: ObjectData[];
  onShowObject: (object: ObjectData) => void;
  onAddObject: (name: string) => Promise<(ValidationError | void)[]>;
  onDismiss: () => void;
}

export const ObjectsView: FC<ObjectsViewProps> = ({
  type,
  objects,
  onDismiss,
  onShowObject,
  onAddObject,
}) => {
  const onAdd = useCallback(() => {
    const name = window.prompt("filename")?.trim().replace(/[^\w]/g, "-");
    if (name) {
      onAddObject(name);
    }
  }, [onAddObject]);
  return (
    <>
      <PageHeader>
        <ArrowLeft onClick={onDismiss} />
        <h2>{pluralize(type)}</h2>
        <PlusCircle onClick={onAdd} />
      </PageHeader>
      {objects ? (
        <RoundedList>
          {(objects || []).map((object) => (
            <RoundedListRow
              key={object._id}
              onClick={() => onShowObject(object)}
            >
              <h3>{object._name}</h3>
              <ArrowRight />
            </RoundedListRow>
          ))}
        </RoundedList>
      ) : null}
    </>
  );
};
