import * as vscode from "vscode";
import { acLabArduino } from "../extension";
import { IConfigModel } from "../model/config-model";
import { Protocol } from "../protocol-interf";
import { ArduinoProvider } from "./arduino-provider";

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
  readonly status: ArduinoEntryStatus;

  checkProject(provider: ArduinoProvider): void;
}

export class ArduinoEntry implements IArduinoEntry {
  private readonly _project: vscode.WorkspaceFolder;
  private _status: ArduinoEntryStatus = ArduinoEntryStatus.none;

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

  checkProject(provider: ArduinoProvider): void {
    console.log("checkProject %s", this._project.name);
    vscode.commands
      .executeCommand<Protocol.IServerResult>(
        "arduinoExplorer.checkProject",
        this._project.uri.fsPath
      )
      .then(
        (value: Protocol.IServerResult) => {
          const data: Protocol.ICheckProject =
            Protocol.getResult<Protocol.ICheckProject>(value);
          console.error(data);
          this._status = data.status;
          //this._status = data.diagnostics;
          provider.reveal(this);
        },
        (reason: any) => {
          console.error(reason);
          vscode.window.showErrorMessage(reason.message);
        }
      );
  }
}
