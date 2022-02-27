import * as fse from "fs-extra";
import path = require("path");
import { ArduinoGithub } from "../arduino-github";
import { DownloadUtil } from "../download-util";
import { ACLLogger } from "../logger";
import { ACL_HOME } from "../server";
import { Server } from "../server-interf";

export const COMMAND_INSTALL_CLI: string = "arduinoExplorer.installCli";
export interface IInstalltCliResult {
  status: boolean;
  message: string;
  data: {
    execFile: string;
    version: string;
  };
}

export async function doInstallArduinoCli(
  version: string
): Promise<IInstalltCliResult> {
  const _logger: ACLLogger.ILogger = ACLLogger.instance();
  const result: IInstalltCliResult = {
    status: true,
    message: "",
    data: { execFile: "", version: "" },
  };

  const release: Server.IArduinoRelease | undefined = (
    await ArduinoGithub.getReleases()
  )
    .filter((release: Server.IArduinoRelease) => {
      return release.tag_name === version;
    })
    .pop();

  if (release) {
    const download: DownloadUtil = new DownloadUtil(ACL_HOME);
    result.data.version = release.name;
    result.data.execFile = await download.downloadFile(release).then(
      async (pack: string | undefined) => {
        if (pack) {
          const target: string = path.join(ACL_HOME, "arduino-cli", version);
          _logger.info(`Unpacking ${pack} into ${target}`);
          fse.ensureDirSync(target);
          await download.unpack(pack, target);

          return target;
        } else {
          result.status = false;
          result.message = `Release [${release}] don't download`;

          return "";
        }
      },
      (reason: any) => {
        result.status = false;
        result.message = reason.message;

        return "";
      }
    );
  } else {
    result.status = false;
    result.message = `Release [${version}] unsupported`;
  }

  return result;
}
