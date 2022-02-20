import * as path from "path";
import * as vscode from "vscode";
import { IArduinoEntry } from "./arduino-entry";
import { IInformationEntry } from "./information-entry";

const iconFolder: string[] = [__dirname, "..", "..", "..", "fileicons"];
const resourceFolder: string[] = [__dirname, "..", "..", "..", "resources"];
const iconFolderLight: string[][] = [
  [...iconFolder, "light"],
  [...resourceFolder, "light"],
];
const iconFolderDark: string[][] = [
  [...iconFolder, "dark"],
  [...resourceFolder, "dark"],
];
const iconFileLight: string = path.resolve(
  ...iconFolderLight[0],
  "aclabarduino_file.svg"
);
const iconFileDark: string = path.resolve(
  ...iconFolderDark[0],
  "aclabarduino_file.svg"
);

const iconFileNotExistLight: string = path.resolve(
  ...iconFolderLight[0],
  "aclabarduino_file_not_exist.svg"
);
const iconFileNotExistDark: string = path.resolve(
  ...iconFolderDark[0],
  "aclabarduino_file_not_exist.svg"
);

const iconInformationLight: string = path.resolve(
  ...iconFolderLight[1],
  "information.svg"
);
const iconInformationDark: string = path.resolve(
  ...iconFolderDark[1],
  "information.svg"
);

const iconIncompleteLight: string = path.resolve(
  ...iconFolderLight[1],
  "incomplete.svg"
);
const iconIncompleteDark: string = path.resolve(
  ...iconFolderDark[1],
  "incomplete.svg"
);

export class ArduinoTreeItem extends vscode.TreeItem {
  constructor(public readonly entry: IArduinoEntry) {
    super(
      entry.model.alias ? entry.model.alias : entry.project.name,
      vscode.TreeItemCollapsibleState.Collapsed
    );

    this.description = this._existsFile ? `${entry.model.port}` : "<candidate>";
    this.tooltip = `${entry.model.board_name} <${entry.project.uri.fsPath}>`;
  }

  private _existsFile: Function = (): boolean => {
    return this.entry.model.existFile;
  };

  command = this._existsFile
    ? {
        command: "arduinoExplorer.openConfiguration",
        title: "Open",
        arguments: [this.entry.project],
      }
    : {
        command: "arduinoExplorer.initialize",
        title: "Initialize",
        arguments: [this.entry.project],
      };

  iconPath = {
    light: this._existsFile ? iconFileLight : iconFileNotExistLight,
    dark: this._existsFile ? iconFileDark : iconFileNotExistDark,
  };

  contextValue = this._existsFile ? "aclProject" : "candidateProject";
}

export class InformationTreeItem extends vscode.TreeItem {
  constructor(public readonly entry: IInformationEntry) {
    super(entry.label, vscode.TreeItemCollapsibleState.None);

    this.label = `${entry.label}: ${entry.value}`;
    this.tooltip = entry.tooltip;
  }

  iconPath = {
    light: this.entry.value ? iconInformationLight : iconIncompleteLight,
    dark: this.entry.value ? iconInformationDark : iconIncompleteDark,
  };

  contextValue = "information";
}
