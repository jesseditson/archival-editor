import qs from "query-string";
import { Github } from "../types";

const GITHUB_BASE_URL = "https://api.github.com";

export interface GithubAuth {
  accessToken: string;
  tokenType: string;
  scopes: string[];
}

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

type HTTPMethod = "GET";

export class GithubClient {
  private auth: GithubAuth;

  public allUserRepos = async () => {
    return this.fetchUserRepos();
  };

  public userInfo = async () => {
    const response = this.request<Github.User>("GET", "user");
    return response;
  };

  constructor(auth: GithubAuth) {
    this.auth = auth;
  }

  private fetchUserRepos = async (
    page: number = 1,
    existingRepos: Github.Repo[] = []
  ): Promise<Github.Repo[]> => {
    const repos = await this.request<Github.Repo[]>("GET", "user/repos", {
      per_page: 100,
      page: page,
    });
    if (repos.length === 0) {
      return existingRepos;
    } else {
      return this.fetchUserRepos(page + 1, existingRepos.concat(repos));
    }
  };

  private request = async <
    R extends any,
    P extends Record<string, string | number> = Record<string, number>
  >(
    method: HTTPMethod,
    path: string,
    params?: P
  ): Promise<R> => {
    const request = await fetch(
      `${GITHUB_BASE_URL}/${path}?${params ? qs.stringify(params) : ""}`,
      {
        method,
        headers: {
          Authorization: `token ${this.auth.accessToken}`,
          "User-Agent": "Archival Editor",
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (request.ok) {
      const data = await request.json();
      return data as R;
    }
    throw new Error(request.statusText);
  };
}
