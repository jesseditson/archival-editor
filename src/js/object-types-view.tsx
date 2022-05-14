import { FC } from "react";
import pluralize from "pluralize";
import { ObjectDefinition, Objects, ObjectTypes } from "./types";
import styled from "@emotion/styled";
import { ArrowRight } from "react-feather";
import {
  RoundedList,
  RoundedListNavContainer,
  RoundedListRow,
} from "./lib/styled";

interface ObjectTypesViewProps {
  types?: ObjectTypes;
  objects?: Objects;
  onShowType: (name: string) => void;
}

const Count = styled.span`
  color: #bbb;
`;

export const ObjectTypesView: FC<ObjectTypesViewProps> = ({
  types,
  objects,
  onShowType,
}) => {
  return (
    <>
      <h2>Objects</h2>
      <RoundedList>
        {Object.keys(types || {}).map((name) => {
          return (
            <RoundedListRow key={name} onClick={() => onShowType(name)}>
              <h2>{pluralize(name)}</h2>
              <RoundedListNavContainer>
                <Count>
                  {objects && objects[name] ? objects[name].length : 0}
                </Count>
                <ArrowRight />
              </RoundedListNavContainer>
            </RoundedListRow>
          );
        })}
      </RoundedList>
    </>
  );
};
