import glob = require("glob");
import * as vscode from "vscode";
import { ArduinoTreeItem, InformationTreeItem } from "./arduino-item";
import { ArduinoEntry, IArduinoEntry } from "./arduino-entry";
import { IConfigModel } from "../model/config-model";
import { IInformationEntry, InformationEntry } from "./information-entry";

export class ArduinoProvider
  implements vscode.TreeDataProvider<IArduinoEntry | IInformationEntry>
{
  private _onDidChangeTreeData: vscode.EventEmitter<IArduinoEntry> =
    new vscode.EventEmitter<IArduinoEntry | null>();

  readonly onDidChangeTreeData: vscode.Event<IArduinoEntry> =
    this._onDidChangeTreeData.event;

  constructor() {}

  reveal(element: IArduinoEntry = null): void {
    this._onDidChangeTreeData.fire(element);
  }

  getParent(element: IArduinoEntry | IInformationEntry): IArduinoEntry {
    if (element instanceof InformationEntry) {
      return element.parent;
    }

    return null;
  }

  getChildren(
    element?: IArduinoEntry
  ): Promise<IArduinoEntry[]> | Promise<IInformationEntry[]> {
    if (element) {
      const additional_urls: string[] = element.model.additional_urls
        ? element.model.additional_urls
        : [];
      const children: IInformationEntry[] = [];

      children.push(new InformationEntry(element, "Port", element.model.port));
      children.push(
        new InformationEntry(element, "Board", element.model.board)
      );
      children.push(
        new InformationEntry(element, "Name", element.model.board_name)
      );
      children.push(
        new InformationEntry(element, "Path", element.project.uri.fsPath)
      );
      if (additional_urls.length) {
        children.push(
          new InformationEntry(
            element,
            "3th URL",
            `${additional_urls.length} URL's`,
            additional_urls.join("\n")
          )
        );
      }

      return Promise.resolve(children);
    }

    const children: IArduinoEntry[] = [];
    vscode.workspace.workspaceFolders.forEach(
      async (folder: vscode.WorkspaceFolder) => {
        const inoFiles: string[] = glob.sync(`${folder.uri.fsPath}/**/*.ino`);
        const addEntry: boolean = inoFiles.length > 0;

        if (addEntry) {
          const arduinoEntry: IArduinoEntry = new ArduinoEntry(folder);
          arduinoEntry.model.onDidChangeConfig((event: IConfigModel) => {
            this.reveal();
          });

          children.push(arduinoEntry);
        }
      }
    );

    return Promise.resolve(
      children.sort((a: IArduinoEntry, b: IArduinoEntry) => {
        return a.project.name.localeCompare(b.project.name);
      })
    );
  }

  getTreeItem(element: IArduinoEntry | IInformationEntry): vscode.TreeItem {
    if (element instanceof InformationEntry) {
      return new InformationTreeItem(element as IInformationEntry);
    }

    return new ArduinoTreeItem(element as IArduinoEntry);
  }
}
