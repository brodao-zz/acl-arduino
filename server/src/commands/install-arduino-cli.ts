import * as fse from "fs-extra";
import path = require("path");
import { ArduinoGithub } from "../arduino-github";
import { DownloadUtil } from "../download-util";
import { ACLLogger } from "../logger";
import { ACL_HOME } from "../server";
import { Server } from "../server-interf";

export async function doInstallArduinoCli(version: string): Promise<string> {
  const _logger: ACLLogger.ILogger = ACLLogger.instance();

  const release: Server.IArduinoRelease = (await ArduinoGithub.getReleases())
    .filter((release: Server.IArduinoRelease) => {
      return release.tag_name == version;
    })
    .pop();

  if (release) {
    const download: DownloadUtil = new DownloadUtil(ACL_HOME);
    const targetFolder = await download.downloadFile(release).then(
      async (pack: string) => {
        if (pack) {
          const target: string = path.join(ACL_HOME, "arduino-cli", version);
          _logger.info(`Unpacking ${pack} into ${target}`);
          fse.ensureDirSync(target);
          await download.unpack(pack, target);

          return target;
        } else {
          throw new Error(`Release [${release}] don't download`);
        }
      },
      (reason: any) => {
        throw new Error(reason);
      }
    );

    return targetFolder;
  }

  throw new Error(`Release [${release}] unsupported`);
}
