import styled from "@emotion/styled";
import { uniqueId } from "lodash";
import React, { FC, useCallback, useState } from "react";
import { ArrowLeft } from "react-feather";
import { Button } from "./lib/styled";
import {
    ProgressInfo,
} from "./types";

const NETLIFY_CLIENT_ID = process.env.NETLIFY_CLIENT_ID!
const NETLIFY_REDIRECT_URI = process.env.NETLIFY_REDIRECT_URI!

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
    onNetlifyLogout,
    onDismiss,
}) => {
    const [branch, updateBranch] = useState(initialBranch);
    const netlifyLogin = useCallback(() => {
        const state = uniqueId()
        localStorage.setItem('NETLIFY_LOGIN_STATE', state);
        window.location.href = 'https://app.netlify.com/authorize?' +
            'client_id=' + NETLIFY_CLIENT_ID +
            '&response_type=token' +
            '&redirect_uri=' + NETLIFY_REDIRECT_URI +
            '&state=' + state
    }, [])
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
            {netlifyConnected ? <Button onClick={onNetlifyLogout}>Sign out of Netlify</Button> : <Button onClick={netlifyLogin}>Sign in to Netlify</Button>}
            <ResetButton onClick={onReset}>Reset Repository</ResetButton>
        </SettingsViewContainer>
    );
};
