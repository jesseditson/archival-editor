interface NetlifySite {
  id: string;
  name: string;
  published_deploy: {
    url: string;
  };
  build_settings: {
    repo_path: string;
    repo_branch: string;
    repo_url: string;
  };
}
interface NetlifyBuild {
  deploy_id: string;
  sha: string;
  done: boolean;
  error?: string;
  created_at: string;
}
export class NetlifyAPI {
  constructor(accessToken: string);
  listSites(): Promise<NetlifySite[]>;
  listSiteBuilds({ site_id: string }): Promise<NetlifyBuild[]>;
}
