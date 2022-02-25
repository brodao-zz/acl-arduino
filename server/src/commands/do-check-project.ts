import fse = require("fs-extra");
//import path = require("path");
//import { CONFIG_SERVER_DEFAULT } from "../model/config-model";
import glob = require("glob");
import { Diagnostic } from "vscode-languageserver/node";
import { doValidModel } from "./do-valid-model";

export const COMMAND_CHECK_PROJECT: string = "arduinoExplorer.checkProject";
export interface ICheckProjectResult {
  status: number;
  diagnostics: Diagnostic[];
}

export function doCheckProject(
  workspace: string
): Promise<ICheckProjectResult> {
  //arduinoCli.checkProject(param);
  const result: ICheckProjectResult = {
    status: 0,
    diagnostics: [],
  };
  const inoFiles: string[] = glob.sync(`${workspace}/**/*.ino`);
  const existsConfig: boolean = fse.existsSync(
    `${workspace}/.vscode/aclabarduino.json`
  );

  if (inoFiles.length > 0) {
    result.status = 2;
  }
  if (existsConfig) {
    result.status = 1;

    const diagnostics: Diagnostic[] = doValidModel(workspace);
    if (diagnostics.length > 0) {
      result.status = 4;
      result.diagnostics.push(...diagnostics);
    }
  }

  return Promise.resolve(result);
}
