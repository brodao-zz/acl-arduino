import * as vscode from "vscode";
import { Diagnostic } from "vscode-languageclient/node";
import { acLabArduino } from "../extension";
import { IConfigModel } from "../model/config-model";
import { Protocol } from "../protocol-interf";
import { ArduinoProvider } from "./arduino-provider";
import { doOpenConfiguration } from "./../commands/do-open-configuration";

export enum ArduinoEntryStatus {
  none,
  ok,
  candidate,
  ignore,
  error,
}

export interface IArduinoEntry {
  readonly project: vscode.WorkspaceFolder;
  readonly model: IConfigModel;
  status: ArduinoEntryStatus;
  errors: Diagnostic[];

  checkProject(provider: ArduinoProvider): void;
}

export class ArduinoEntry implements IArduinoEntry {
  private readonly _project: vscode.WorkspaceFolder;
  private _status: ArduinoEntryStatus = ArduinoEntryStatus.none;
  private _errors: Diagnostic[] = [];

  constructor(project: vscode.WorkspaceFolder) {
    this._project = project;
  }

  get project(): vscode.WorkspaceFolder {
    return this._project;
  }

  get model(): IConfigModel {
    return acLabArduino.getModel(this._project);
  }

  public get status(): ArduinoEntryStatus {
    return this._status;
  }

  public get errors(): Diagnostic[] {
    return this._errors;
  }

  checkProject(provider: ArduinoProvider): void {
    vscode.commands
      .executeCommand<Protocol.IServerResult>(
        "arduinoExplorer.checkProject",
        this._project.uri.fsPath
      )
      .then(
        (value: Protocol.IServerResult) => {
          const data: Protocol.ICheckProject =
            Protocol.getResult<Protocol.ICheckProject>(value);

          this._status = data.status;
          this._errors = data.diagnostics;
          //this._status = data.diagnostics;
          provider.reveal(this);

          if (this._errors.length > 0) {
            doOpenConfiguration(this._project, false);
          }
        },
        (reason: any) => {
          console.error(reason);
          vscode.window.showErrorMessage(reason.message);
        }
      );
  }
}
