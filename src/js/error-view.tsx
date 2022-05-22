import { FC } from "react";
import styled from "@emotion/styled";

interface ErrorViewProps {
  error: Error;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
const ErrorTitle = styled.h3`
  color: red;
`;
const ErrorStack = styled.pre`
  max-height: 300px;
  overflow-y: scroll;
  background-color: #f2f2f2;
`;

export const ErrorView: FC<ErrorViewProps> = ({ error }) => {
  return (
    <ErrorContainer>
      <ErrorTitle>Error: {error.message}</ErrorTitle>
      <ErrorStack>{error.stack}</ErrorStack>
      <a onClick={() => (window.location.href = window.location.href)}>
        Try Reloading
      </a>
    </ErrorContainer>
  );
};
