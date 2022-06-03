import styled from "@emotion/styled";
import React, { FC, useState } from "react";
import { ArrowLeft } from "react-feather";
import { Button } from "./lib/styled";
import {
    ProgressInfo,
} from "./types";


const SettingsViewContainer = styled.div`
display: flex;
flex-direction: column;
font-size: 1.2em;
& > * {
  margin-bottom: 1em;
}
`;
const SettingsHeader = styled.div`
display: flex;
align-items: center;
h2 {
  flex-grow: 1;
  font-size: 1em;
}
`;

interface SettingsViewProps {
    cloning: boolean;
    branch: string;
    onReset: () => void;
    onDismiss: () => void;
    netlifyConnected: boolean;
    onNetlifyLogin: () => void;
    onNetlifyLogout: () => void;
    cloneRepo: (branch: string) => void;
    progress: ProgressInfo | null;
}

const ResetButton = styled(Button)`
background-color: red;
color: white;
`;

const ProgressContainer = styled.div`
height: 1em;
`

export const SettingsView: FC<SettingsViewProps> = ({
    branch: initialBranch,
    cloning,
    cloneRepo,
    progress,
    onReset,
    netlifyConnected,
    onNetlifyLogin,
    onNetlifyLogout,
    onDismiss,
}) => {
    const [branch, updateBranch] = useState(initialBranch);
    return (
        <SettingsViewContainer>
            <SettingsHeader>
                <ArrowLeft onClick={onDismiss} />
                <h2>Settings</h2>
            </SettingsHeader>
            <ProgressContainer>
                {progress ? (
                    <span>
                        {progress.task}: {Math.round(progress.progress * 100)}%
                    </span>
                ) : null}
            </ProgressContainer>
            <div>
                {cloning ? null : (
                    <input
                        value={branch}
                        onChange={(e) => updateBranch(e.target.value)}
                        placeholder="branch"
                    />
                )}
                {cloning ? null : (
                    <Button onClick={() => cloneRepo(branch)}>Checkout Branch</Button>
                )}
            </div>
            {netlifyConnected ? <Button onClick={onNetlifyLogout}>Sign out of Netlify</Button> : <Button onClick={onNetlifyLogin}>Sign in to Netlify</Button>}
            <ResetButton onClick={onReset}>Reset Repository</ResetButton>
        </SettingsViewContainer>
    );
};
