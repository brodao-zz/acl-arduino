import * as path from "path";
import * as fse from "fs-extra";
import { Server } from "./server-interf";
import download = require("download");
import { IncomingMessage } from "http";
import targz from "targz";
import unzip from "unzip-stream";
import { ACLLogger } from "./logger";

/**
 * Handles the VS Code instance used for testing.
 * Includes downloading, unpacking, launching, and version checks.
 */
export class DownloadUtil {
  private _downloadFolder: string;
  private _arduinoCliFolder!: string;
  private _logger: ACLLogger.ILogger = ACLLogger.instance();

  /**
   * Create an instance of code handler
   * @param folder Path to folder where all the artifacts will be stored.
   */
  constructor(aclHome: string) {
    this._arduinoCliFolder = path.join(aclHome, "arduino-cli");
    this._downloadFolder = path.join(this._arduinoCliFolder, "download");
  }

  get downloadPlatform(): string {
    let platform: string = process.platform;

    if (platform === "linux") {
      platform = "Linux";
    } else if (platform === "win32") {
      platform = "Windows";
    }

    return platform;
  }

  get downloadArch(): string {
    return process.arch === "x64" ? "64" : "32";
  }

  async downloadFile(release: Server.IArduinoRelease): Promise<string> {
    let result: boolean = true;

    fse.mkdirpSync(this._downloadFolder);

    const isTarGz: boolean = this.downloadPlatform.indexOf("linux") > -1;
    const ext: string = isTarGz ? "tar.gz" : "zip";
    const version: string = release.tag_name;
    const url: string = `https://github.com/arduino/arduino-cli/releases/download/${version}/arduino-cli_${version}_${this.downloadPlatform}_${this.downloadArch}bit.${ext}`;
    const fileName: string = path.basename(url);
    const target: string = path.join(this._downloadFolder, fileName);

    if (fse.existsSync(target)) {
      this._logger.info(
        `Using Arduino-CLI from cache [${this._downloadFolder}]`
      );
    } else {
      this._logger.info(
        `Downloading Arduino-CLI from [${url}] to [${this._downloadFolder}]`
      );

      await download(url, this._downloadFolder)
        .on("redirect", (res: IncomingMessage, nextOptions: any) => {
          this._logger.debug("-**** redirect ***");
          this._logger.debug(nextOptions);
        })
        .on("downloadProgress", (progress: any) => {
          this._logger.info(
            `Download ${progress.transferred}/${progress.total}`
          );
        })
        .on("error", (error: any) => {
          this._logger.error(error);
          result = false;
        });
    }

    return Promise.resolve(result ? target : null);
  }

  unpack(input: string, target: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (input.endsWith(".tar.gz")) {
        targz.decompress(
          {
            src: input,
            dest: target,
          },
          (err: any) => {
            err ? reject(err) : resolve();
          }
        );
      } else if (input.endsWith(".zip")) {
        // if (process.platform === "darwin") {
        //   fs.mkdirpSync(target.toString());
        //   exec(`cd ${target} && unzip -qo ${input.toString()}`, (err) => {
        //     if (err) {
        //       reject(err);
        //     } else {
        //       resolve();
        //     }
        //   });
        // } else {
        fse
          .createReadStream(input)
          .pipe(unzip.Extract({ path: target }))
          .on("error", reject)
          .on("close", resolve);
        //        }
      } else {
        reject(`Unsupported extension for '${input}'`);
      }
    });
  }
}

// /**
//  * Check what Arduino CLI version is present in the testing folder
//  */
// getOutdatedPacks(): any {
//   let outdated: any = {};

//   try {
//     const command = [this.executablePath, "outdated", "--format json"].join(
//       " "
//     );
//     const buffer: Buffer = child_process.execSync(command);
//     const result: string = buffer.toString();
//     const json: any = JSON.parse(result);
//     outdated = json;
//   } catch (error) {
//     this._logger.error(error);
//   }

//   return outdated;
// }

// getFilename
// let arch = "";
// let platform = "";
// let ext = "";
// switch (osPlat) {
//   case "win32":
//     platform = "Windows";
//     ext = "zip";
//     break;
//   case "linux":
//     platform = "Linux";
//     ext = "tar.gz";
//     break;
//   case "darwin":
//     platform = "macOS";
//     ext = "tar.gz";
//     break;
// }

// switch (osArch) {
//   case "x32":
//     arch = "32bit";
//     break;
//   case "x64":
//     arch = "64bit";
//     break;
//   case "arm":
//     arch = "ARMv7";
//     break;
//   case "arm64":
//     arch = "ARM64";
//     break;
// }

// return util.format("arduino-cli_%s_%s_%s.%s", version, platform, arch, ext);
