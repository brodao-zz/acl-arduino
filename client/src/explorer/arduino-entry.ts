import * as vscode from "vscode";
import { acLabArduino } from "../extension";
import { IConfigModel } from "../model/config-model";

export interface IArduinoEntry {
  readonly project: vscode.WorkspaceFolder;
  readonly model: IConfigModel;
}

export class ArduinoEntry implements IArduinoEntry {
  private readonly _project: vscode.WorkspaceFolder;

  constructor(project: vscode.WorkspaceFolder) {
    this._project = project;
  }

  get project(): vscode.WorkspaceFolder {
    return this._project;
  }

  get model(): IConfigModel {
    return acLabArduino.getModel(this._project);
  }
}
