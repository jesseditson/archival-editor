type METHOD = "GET" | "POST";

export interface NetlifySite {
  id: string;
  name: string;
  account_slug: string;
  published_deploy: {
    url: string;
  };
  build_settings: {
    repo_path: string;
    repo_branch: string;
    repo_url: string;
  };
}
export interface NetlifyBuild {
  deploy_id: string;
  sha: string;
  done: boolean;
  error?: string;
  created_at: string;
}
export class NetlifyAPI {
  private accessToken: string;
  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("accessToken is required");
    }
    this.accessToken = accessToken;
  }
  listSites(): Promise<NetlifySite[]> {
    return this.callAPI<NetlifySite[]>("/sites");
  }
  listSiteBuilds(siteId: string): Promise<NetlifyBuild[]> {
    return this.callAPI<NetlifyBuild[]>(`/sites/${siteId}/builds`);
  }
  private async callAPI<T>(
    endpoint: string,
    params?: { [key: string]: string | boolean | number },
    method?: METHOD
  ): Promise<T> {
    const args: RequestInit = {
      method: method || "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "User-Agent": "Archival Editor (jesse@archival.dev)",
        "Content-Type": "application/json",
      },
    };
    if (method === "POST" && params) {
      args.body = JSON.stringify(params);
    } else if (params) {
      const qs = Object.keys(params)
        .map((k) => `${k}=${encodeURIComponent(params[k])}`)
        .join("&");
      endpoint = `${endpoint}?${qs}`;
    }
    const res = await fetch(`https://api.netlify.com/api/v1${endpoint}`, args);
    let data: T;
    try {
      data = await res.json();
    } catch (e) {
      console.error(`Got non-json response: ${res.text}`);
    }
    if (!res.ok) {
      throw new Error(`Request failed: ${res.statusText}`);
    }
    return data;
  }
}
