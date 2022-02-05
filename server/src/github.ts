import { request } from "@octokit/request";

export namespace Github {
  export async function getReleases(owner: string, repo: string): Promise<any> {
    const result = await request("GET /repos/{owner}/{repo}/releases", {
      owner: owner,
      repo: repo,
      per_page: 10,
      page: 1,
    });

    return result;
  }

  export async function getReleaseFile(
    owner: string,
    repo: string,
    assetId: string
  ): Promise<any> {
    const result = await request(
      "/repos/{owner}/{repo}/releases/assets/{asset_id}",
      {
        owner: owner,
        repo: repo,
        asset_id: assetId,
      }
    );

    return result;
  }
}
