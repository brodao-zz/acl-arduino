//import fse = require("fs-extra");
//import path = require("path");
//import { CONFIG_SERVER_DEFAULT } from "../model/config-model";

import { Diagnostic } from "vscode-languageserver/node";
import { ArduinoDiagnostic } from "../arduino-diagnostic";

export const COMMAND_CHECK_PROJECT: string = "arduinoExplorer.checkProject";

export function doCheckProject(
  workspace: string
): Promise<Diagnostic[] | undefined> {
  //arduinoCli.checkProject(param);
  const diagnostics: Diagnostic[] = [];

  diagnostics.push(
    ArduinoDiagnostic.createProjectDiagnostic(
      workspace,
      ArduinoDiagnostic.Information.I004_INVALID_PROJECT
    )
  );

  return Promise.resolve(diagnostics);
}
