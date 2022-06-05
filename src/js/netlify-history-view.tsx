import { FC } from "react";
import styled from "@emotion/styled";
import { NetlifyBuild, NetlifySite } from "netlify";

interface NetlifyHistoryViewProps {
  site: NetlifySite;
  builds: NetlifyBuild[]
}

const NetlifyHistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const NetlifyHistoryView: FC<NetlifyHistoryViewProps> = ({ site, builds }) => {
  return <NetlifyHistoryContainer>
    <h3>site.name</h3>
    <span><a href={site.published_deploy.url} target="_blank">site.published_deploy.url</a></span>
    <ol>
      {builds.map(build => (
        <li key={build.deploy_id}>
          {JSON.stringify(build, null, 4)}
        </li>
      ))}
    </ol>
  </NetlifyHistoryContainer>
};
