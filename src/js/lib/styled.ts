import styled from "@emotion/styled";

export const EditorContainer = styled.div`
  padding: 1em;
  margin-bottom: 200px;
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  & > div:first-of-type {
    margin-right: 0.5em;
  }
  & > h2 {
    flex-grow: 1;
  }
`;

export const RoundedList = styled.ol`
  display: flex;
  flex-direction: column;
  list-style-type: none;
  padding: 0;
  border: 1px solid #969696;
  border-radius: 1.5em;
`;

export const RoundedListRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1em;
  &:not(:last-child) {
    border-bottom: 1px solid #969696;
  }
`;

export const RoundedListNavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 3em;
`;

export const EditList = styled.ol`
  display: flex;
  flex-direction: column;
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

export const EditListField = styled.div`
  & label {
  }
`;
