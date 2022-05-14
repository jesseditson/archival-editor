import { FC, useCallback } from "react";
import pluralize from "pluralize";
import { ObjectData, ObjectDefinition, Objects, ObjectTypes } from "./types";
import {
  PageHeader,
  PageHeaderAccessory,
  RoundedList,
  RoundedListNavContainer,
  RoundedListRow,
} from "./lib/styled";
import { ArrowLeft, ArrowRight, PlusCircle } from "react-feather";

interface ObjectsViewProps {
  type: string;
  objects?: ObjectData[];
  onShowObject: (object: ObjectData) => void;
  onDismiss: () => void;
}

export const ObjectsView: FC<ObjectsViewProps> = ({
  type,
  objects,
  onDismiss,
  onShowObject,
}) => {
  return (
    <>
      <PageHeader>
        <ArrowLeft onClick={onDismiss} />
        <h2>{pluralize(type)}</h2>
        <PlusCircle />
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
