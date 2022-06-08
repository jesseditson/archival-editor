import { FC } from "react";
import styled from "@emotion/styled";
import { NetlifyBuild, NetlifySite } from "./lib/netlify";
import { ArrowLeft } from "react-feather";
import { CommitData, CommitsData } from "./types";
import { format, formatDistanceToNow, parseISO } from "date-fns";

interface NetlifyHistoryViewProps {
  site: NetlifySite;
  builds: NetlifyBuild[];
  commits: CommitsData;
  onDismiss: () => void;
}

const NetlifyHistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
const Header = styled.div`
display: flex;
align-items: center;
h2 {
  flex-grow: 1;
  font-size: 1em;
}
`;
const SiteLink = styled.a``

export const NetlifyHistoryView: FC<NetlifyHistoryViewProps> = ({ site, builds, commits, onDismiss }) => {
  return <NetlifyHistoryContainer>
    <Header>
      <ArrowLeft onClick={onDismiss} />
      <h2>Netlify Builds</h2>
    </Header>
    <h3>Builds for {site.name}</h3>
    <SiteLink href={site.published_deploy.url} target="_blank">{site.published_deploy.url}</SiteLink>
    <ol>
      {builds.map(build => (
        <li key={build.deploy_id}>
          <BuildHistoryRowView build={build} commit={commits[build.sha]} githubURL={site.build_settings.repo_url} team={site.account_slug} />
        </li>
      ))}
    </ol>
  </NetlifyHistoryContainer>
};

interface BuildHistoryRowProps {
  build: NetlifyBuild
  team: string;
  githubURL: string;
  commit: CommitData
}

const BuildHistoryRow = styled.div`
  display: flex;
  flex-direction: row;
`

const BuildDate = styled.a``
const BuildSha = styled.a``
const CommitMessage = styled.span``
const Author = styled.span``
const Status = styled.span``

const BuildHistoryRowView: FC<BuildHistoryRowProps> = ({ build, team, githubURL, commit }) => {
  const date = parseISO(build.created_at)
  const buildLink = `https://app.netlify.com/teams/${team}/builds/${build.deploy_id}`
  const shaLink = `${githubURL}/commit/${build.sha}`
  return <BuildHistoryRow>
    <BuildDate title={format(date, "H:mm:ss MM/dd/yyyy")} target="_blank" href={buildLink}>{formatDistanceToNow(date, { addSuffix: true })}</BuildDate>
    <BuildSha href={shaLink} target="_blank">{build.sha}</BuildSha>
    <CommitMessage>{commit?.message}</CommitMessage>
    <Author>{commit?.author.name} ({commit?.author.email})</Author>
    <Status>{build.done ? "Deployed" : "Building"}</Status>
  </BuildHistoryRow>
}
