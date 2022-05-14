import styled from "@emotion/styled";
import { FC } from "react";

interface SignInViewProps {
  openSignIn: () => void;
}

const SignInContainer = styled.div``;
const Headline = styled.h1``;
const SignInContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`;
const GithubButton = styled.button``;

export const SignInView: FC<SignInViewProps> = (props: SignInViewProps) => {
  const { openSignIn } = props;
  return (
    <SignInContainer>
      <Headline>Archival Editor</Headline>
      <SignInContent>
        <GithubButton className="github-button" onClick={openSignIn}>
          Sign in with Github
        </GithubButton>
      </SignInContent>
    </SignInContainer>
  );
};
