import { MessageType, ShowMessageRequestParams } from "vscode-languageserver";
import { ArduinoCli } from "./arduino-cli";
import { doInitializeConfig } from "./commands/initialize-config";

export namespace ArduinoAction {
  export const ACT_NOT_TO_DO = "0x00";
  export const ACT_INITIALIZE = "0x01";
  export const ACT_DONT_ASK_MORE = "0x02";
  export const ACT_INSTALL_ARDUINO_CLI = "0x03";

  export interface IActionParams {
    code: string;
    [key: string]: string;
  }

  export function configFileNotFound(
    workspaceFolder: string,
    configFile: string
  ): ShowMessageRequestParams {
    return {
      type: MessageType.Info,
      message: `Configuration not found for project [${workspaceFolder}].`,
      actions: [
        {
          title: "Create",
          //context: 15,
          returnParams: {
            code: ACT_INITIALIZE,
            workspaceFolder: workspaceFolder,
            configFile: configFile,
          },
        },
        { title: "Don't ask more", code: ACT_DONT_ASK_MORE },
      ],
    };
  }

  export function installArduinoCli(
    version: string,
    workspace: string
  ): ShowMessageRequestParams {
    return {
      type: MessageType.Warning,
      message: `Install Arduino-CLI version [${version}]?`,
      actions: [
        {
          title: "Yes",
          //context: 15,
          returnParams: {
            code: ACT_INSTALL_ARDUINO_CLI,
            version: version,
            workspace: workspace,
          },
        },
        { title: "No" },
      ],
    };
  }

  export async function processResult(
    arduinoCli: ArduinoCli,
    params: IActionParams
  ): Promise<string> {
    if (params.code === ACT_INITIALIZE) {
      return doInitializeConfig(params.configFile);
    }

    const json: any = JSON.stringify({
      arduinoCli: arduinoCli,
      params: params,
    });

    throw new Error(`FATAL: Process result failed.\n${json}`);
  }
}
