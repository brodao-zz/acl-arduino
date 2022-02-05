import { Server } from ".";
import { ACLCache } from "./cache";
import { Github } from "./github";

export namespace ArduinoGithub {
  export async function getReleases(): Promise<Server.IArduinoRelease[]> {
    const cacheId: string = ACLCache.getCacheId("getReleases");
    let releases: Server.IArduinoRelease[] = ACLCache.load(cacheId);

    if (!releases) {
      const result: any = await Github.getReleases("arduino", "arduino-cli");
      releases = [];

      result.data.forEach((element: any) => {
        releases.push({
          name: element["name"],
          tag_name: element["tag_name"],
          //tarball_url: element["tarball_url"],
          //zipball_url: element["zipball_url"],
          html_url: element["html_url"],
          prerelease: element["prerelease"],
          published_at: element["published_at"],
          author: element["author"]["login"],
          //assets: element["assets"],
        });
      });

      ACLCache.write(cacheId, releases);
    }

    return releases;
  }
}
