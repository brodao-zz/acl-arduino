import * as vscode from "vscode";
import { acLabArduino } from "../extension";
import { IConfigModel } from "../model/config-model";
import { Protocol } from "../protocol-interf";

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

  checkProject(treeView: vscode.TreeView<any>): void;
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

  checkProject(treeView: vscode.TreeView<any>): void {
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
          //this._status = data.diagnostics;
          treeView.reveal(this);
        },
        (reason: any) => {
          console.error(reason);
          vscode.window.showErrorMessage(reason.message);
        }
      );
  }
}
