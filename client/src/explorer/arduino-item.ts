import * as path from "path";
import * as vscode from "vscode";
import { Diagnostic } from "vscode-languageclient";
import { ArduinoEntryStatus, IArduinoEntry } from "./arduino-entry";
import { IInformationEntry } from "./information-entry";

const iconFolder: string[] = [__dirname, "..", "..", "fileicons"];
const resourceFolder: string[] = [__dirname, "..", "..", "resources"];
const iconFolderLight: string[][] = [
  [...iconFolder, "light"],
  [...resourceFolder, "light"],
];
const iconFolderDark: string[][] = [
  [...iconFolder, "dark"],
  [...resourceFolder, "dark"],
];
const iconFileLight: string = path.join(
  ...iconFolderLight[0],
  "aclabarduino{1}_file.svg"
);
const iconFileDark: string = path.resolve(
  ...iconFolderDark[0],
  "aclabarduino{1}_file.svg"
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
      entry.status === ArduinoEntryStatus.ok
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
  }

  description = `${this.entry.model.port} ${statusToString(
    this.entry.status
  )} [${this.entry.status}]`;
  tooltip = statusToTooltip(this.entry);
  //resourceUri = this.entry.project.uri;
  command = statusToCommand(this.entry);
  iconPath = statusToIcon(this.entry);

  contextValue = statusToContext(this.entry);
}

export class InformationTreeItem extends vscode.TreeItem {
  constructor(public readonly entry: IInformationEntry) {
    super(entry.label, vscode.TreeItemCollapsibleState.None);
  }

  label = `${this.entry.label}: ${this.entry.value}`;
  //tooltip = this.entry.tooltip;

  iconPath = {
    light: this.entry.value ? iconInformationLight : iconIncompleteLight,
    dark: this.entry.value ? iconInformationDark : iconIncompleteDark,
  };

  contextValue = "information";
}

function statusToString(status: ArduinoEntryStatus): string {
  switch (status) {
    case ArduinoEntryStatus.ok:
      return "";
    case ArduinoEntryStatus.candidate:
      return "<candidate>";
    case ArduinoEntryStatus.error:
      return "<error>";

    default:
      break;
  }

  return `<checking>`;
}

function statusToCommand(entry: IArduinoEntry): vscode.Command | undefined {
  switch (entry.status) {
    case ArduinoEntryStatus.ok:
      return undefined;
    case ArduinoEntryStatus.error:
      return {
        command: "arduinoExplorer.openConfiguration",
        title: "Open",
        arguments: [entry.project],
      };
    case ArduinoEntryStatus.candidate:
      return undefined;

    default:
      break;
  }

  return {
    command: "arduinoExplorer.checkProject",
    title: "Check",
    arguments: [entry.project],
  };
}

function statusToTooltip(entry: IArduinoEntry): string {
  let tooltip: string = "";

  switch (entry.status) {
    case ArduinoEntryStatus.ok:
      tooltip = `${entry.model.board_name} <${entry.project.uri.fsPath}>`;
      break;
    case ArduinoEntryStatus.candidate:
      tooltip = `<candidate> <${entry.project.uri.fsPath}>`;
      break;
    case ArduinoEntryStatus.error:
      tooltip = entry.errors
        .map((value: Diagnostic) => value.message)
        .join("\n");
      break;

    default:
      tooltip = `<checking> <${entry.project.uri.fsPath}>`;
      break;
  }

  return tooltip;
}

function statusToContext(entry: IArduinoEntry): string | undefined {
  switch (entry.status) {
    case ArduinoEntryStatus.ok:
      return "aclProject";
    case ArduinoEntryStatus.candidate:
      return "candidateProject";

    default:
      break;
  }

  return undefined;
}

function statusToIcon(entry: IArduinoEntry): any {
  let sufix: string = "";

  switch (entry.status) {
    case ArduinoEntryStatus.ok:
      sufix = "";
      break;
    case ArduinoEntryStatus.candidate:
      sufix = "_candidate";
      break;
    case ArduinoEntryStatus.error:
      sufix = "_error";
      break;

    default:
      sufix = "_checking";
      break;
  }

  return {
    light: `${iconFileLight.replace("{1}", sufix)}`,
    dark: `${iconFileDark.replace("{1}", sufix)}`,
  };
}
