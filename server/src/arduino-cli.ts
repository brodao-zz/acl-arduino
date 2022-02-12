import path = require("path");
import fse = require("fs-extra");
import {
  DocumentUri,
  ShowMessageRequestParams,
  WorkspaceFolder,
} from "vscode-languageserver/node";
import { ArduinoAction } from "./arduino-action";
import { spawnSync } from "child_process";
import { ACL_HOME, connection } from "./server";
import {
  IConfigServerModel,
  CONFIG_SERVER_DEFAULT,
} from "./model/config-model";
import { registerMessages } from "./messages";
import { ACLCache } from "./cache";
import { ACLLogger } from "./logger";

export interface ArduinoCliOptions {
  config?: IConfigServerModel;
  workspaceFolder?: WorkspaceFolder;
  configFile?: DocumentUri;
  debug: boolean;
  verbose: boolean;
  logFile?: boolean | string;
  arduinCliBin?: string;
}

const FORMAT_JSON: string[] = ["--format", "json"];
const FORMAT_TEXT: string[] = ["--format", "text"];

interface IArduinoExec {
  status: boolean;
  data: any;
  reason: string;
}

export class ArduinoCli {
  static _instance: ArduinoCli;

  private runArguments: string[];
  readonly runOptions: ArduinoCliOptions;
  static _initializationOptions: Partial<ArduinoCliOptions>;

  private static normalizeOptions(
    args: Partial<ArduinoCliOptions>
  ): ArduinoCliOptions {
    const values: ArduinoCliOptions = {
      workspaceFolder: undefined,
      debug: false,
      verbose: false,
      configFile: undefined,
      logFile: undefined,
      config: undefined,
      ...args,
    };

    if (values.workspaceFolder && !values.configFile) {
      values.configFile = path.join(
        values.workspaceFolder.uri,
        ".vscode",
        "aclabarduino.json"
      );
    }

    if (values.workspaceFolder && values.debug) {
      if (typeof values.logFile === "string") {
        values.logFile = path.join(values.workspaceFolder.uri, values.logFile);
      } else if (values.logFile) {
        values.logFile = path.join(
          values.workspaceFolder.uri,
          `arduino-cli-${values.workspaceFolder.name}.log`
        );
      }
    }

    if (values.configFile && fse.existsSync(values.configFile)) {
      values.config = fse.readJsonSync(values.configFile);
    } else {
      values.config = CONFIG_SERVER_DEFAULT;
    }

    return values;
  }

  private static normalizeArguments(runOptions: ArduinoCliOptions): string[] {
    const args: string[] = [];

    if (runOptions.configFile) {
      args.push("--config-file");
      args.push(
        `${path.join(path.dirname(runOptions.configFile), "arduino-cli.yaml")}`
      );
    }

    if (runOptions.debug) {
      args.push("--log-file");
      args.push(`${runOptions.logFile as string}`);
      args.push("--log-level");
      args.push("debug");
    }

    if (runOptions.verbose) {
      args.push("--verbose");
    }

    return args;
  }

  private _logger: ACLLogger.ILogger = ACLLogger.instance();

  static instance(
    initializationOptions: Partial<ArduinoCliOptions> = this
      ._initializationOptions
  ): ArduinoCli {
    if (!this._instance) {
      const runOptions = ArduinoCli.normalizeOptions(initializationOptions);
      const runArguments = ArduinoCli.normalizeArguments(runOptions);

      this._instance = new ArduinoCli(runOptions, runArguments);
      this._initializationOptions = initializationOptions;

      registerMessages(connection, this._instance);
    }

    return this._instance;
  }

  private constructor(runOptions: ArduinoCliOptions, runArguments: string[]) {
    this._logger.debug(
      ">>>>> ardino-cli constructor",
      JSON.stringify({
        runOptions: runOptions,
        runArguments: runArguments,
      })
    );

    this.runOptions = runOptions;
    this.runArguments = runArguments;

    if (this.runOptions.config) {
      this.runOptions.arduinCliBin = this.findExecutable(
        this.runOptions.config.cliVersion
      );
    }
  }

  private _executeCommand(
    commandCli: string,
    args: string[] = [],
    extra: string[] = FORMAT_JSON
  ): IArduinoExec {
    if (!this.runOptions.arduinCliBin) {
      throw new Error("Arduino-CLI not informed.");
    }

    const params = [
      commandCli,
      ...args.filter((value: string) => value.length > 0),
      ...this.runArguments,
      ...extra,
    ];
    this._logger.debug(params.toString().replaceAll(",", " "));

    const command = spawnSync(this.runOptions.arduinCliBin, params, {
      cwd: path.dirname(this.runOptions.arduinCliBin),
      shell: false,
      //stdio: [0, 1, 2],
      env: process.env,
    });

    if (command.status !== 0) {
      this._logger.error(command.stderr);
    }

    const error: string = command.stderr.toString();
    const stdout: string = command.stdout.toString();

    this._logger.debug(error);
    this._logger.debug(stdout);

    return {
      status: error.length === 0,
      data:
        stdout.length === 0
          ? undefined
          : extra[1] === "text"
          ? { text: stdout.split("\r") }
          : JSON.parse(stdout),
      reason: error,
    };
  }

  checkEnvironment(
    release: string
  ): Promise<ShowMessageRequestParams | undefined> {
    let result: ShowMessageRequestParams | undefined = undefined;

    if (this.runOptions.configFile) {
      if (!fse.existsSync(this.runOptions.configFile)) {
        result =
          this.runOptions.workspaceFolder &&
          ArduinoAction.configFileNotFound(
            this.runOptions.workspaceFolder.name,
            this.runOptions.configFile
          );
      } else {
        this.runOptions.arduinCliBin = this.findExecutable(release);

        if (release !== this.getCurrentVersion()) {
          result =
            this.runOptions.workspaceFolder &&
            ArduinoAction.installArduinoCli(
              release,
              this.runOptions.workspaceFolder.uri
            );
        } else {
          const cliConfig: string = `${path.join(
            path.dirname(this.runOptions.configFile),
            "arduino-cli.yaml"
          )}`;

          if (!fse.existsSync(cliConfig)) {
            this.configInitFile(cliConfig);
          }
        }
      }
    }

    return Promise.resolve(result);
  }

  /**
   * Find binary
   */
  findExecutable(release: string): string | undefined {
    let cliPath = "";

    switch (process.platform) {
      case "win32":
        cliPath = path.join(
          ACL_HOME,
          "arduino-cli",
          release,
          "arduino-cli.exe"
        );
        break;
      case "linux":
        cliPath = path.join(ACL_HOME, "arduino-cli", release, "arduino-cli");
        break;
    }

    return fse.existsSync(cliPath) ? cliPath : undefined;
  }

  /**
   * Check what Arduino CLI version is present in the testing folder
   */
  getCurrentVersion(): string {
    let version: string = "";

    try {
      const result: IArduinoExec = this._executeCommand("version");
      if (result.status) {
        version = result.data["VersionString"];
      }
    } catch (e) {
      this._logger.error(e);
    }

    return version;
  }

  configInitDir(destFolder: string): IArduinoExec {
    return this._executeCommand("config", ["init", "--dest-dir", destFolder]);
  }

  configInitFile(destFile: string): IArduinoExec {
    return this._executeCommand("config", ["init", "--dest-file", destFile]);
  }

  coreDownload(): any {
    return this._executeCommand("core", ["download"]);
  }

  coreList(params: string): IArduinoExec {
    const cacheId: string = ACLCache.getCacheId("coreList", params);
    let result = ACLCache.load(cacheId);

    if (!result) {
      result = this._executeCommand("core", ["list", params]);
      ACLCache.write(cacheId, result);
    }

    return result;
  }

  coreUpdateIndex(): IArduinoExec {
    ACLCache.clear();

    return this._executeCommand("core", ["update-index"], FORMAT_TEXT);
  }

  validate3rdPartyUrl(url: string): IArduinoExec[] {
    const result: IArduinoExec[] = [];

    result.push(this.configAdd3rdPartyUrl(url));
    result.push(this.coreUpdateIndex());
    result.push(this.configRemove3thPartyUrl(url));

    return result;
  }

  // getConfigDump(): any {
  //   return this._executeCommand("config", ["dump"]);
  // }

  configAdd3rdPartyUrl(url: string): IArduinoExec {
    return this._executeCommand(
      "config",
      ["add", "board_manager.additional_urls", url],
      FORMAT_TEXT
    );
  }

  configRemove3thPartyUrl(url: string): IArduinoExec {
    return this._executeCommand(
      "config",
      ["remove", "board_manager.additional_urls", url],
      FORMAT_TEXT
    );
  }

  coreInstall(platform: string, version: string): any {
    return this._executeCommand(
      "core",
      ["install", `${platform}@${version}`],
      FORMAT_TEXT
    );
  }

  boardList(): any {
    const cacheId: string = ACLCache.getCacheId("boardList");
    let result = ACLCache.load(cacheId);

    if (!result) {
      result = this._executeCommand("board", ["list"], FORMAT_JSON);
      ACLCache.write(cacheId, result);
    }

    return result;
  }

  ///////////////////////////////////////////
  ///////////////////////////////////////////
  ///////////////////////////////////////////
  ///////////////////////////////////////////
  ///////////////////////////////////////////
  ///////////////////////////////////////////
  ///////////////////////////////////////////
  ///////////////////////////////////////////
  /*

  getBoardList(): any {
    return this._executeCommand("board", ["listall"]);
  }

  getPorts(): any {
    return this._executeCommand("board", ["list"]);
  }

  getOutdated(): any {
    return this._executeCommand("outdated");
  }
  */
}
