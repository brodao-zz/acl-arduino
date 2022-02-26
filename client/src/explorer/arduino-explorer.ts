import * as vscode from "vscode";
import { ArduinoProvider } from "./arduino-provider";
import { doSelectPort } from "../commands/do-select-port";
import { Disposable } from "vscode-jsonrpc";
import { IArduinoEntry } from "./arduino-entry";
import { doInitialize } from "../commands/do-initialize";
import { doSelectBoard } from "../commands/do-select-board";
import { State } from "../commands/command-interf";
import { acLabArduino } from "../extension";
import { doSelectPlatform } from "../commands/do-select-platform";
import { doAdd3rdPartyUrl } from "../commands/do-add-3rd-party";
import { IInformationEntry } from "./information-entry";
import { doOpenConfiguration } from "../commands/do-open-configuration";

export class ArduinoExplorer {
  private treeView: vscode.TreeView<IArduinoEntry | IInformationEntry>;
  private treeDataProvider: ArduinoProvider;

  constructor(context: vscode.ExtensionContext) {
    this.treeDataProvider = new ArduinoProvider();

    this.treeView = vscode.window.createTreeView("arduinoExplorer", {
      treeDataProvider: this.treeDataProvider,
      canSelectMany: false,
    });

    const disposes: Disposable[] = [];

    disposes.push(
      this.treeView,
      vscode.window.registerTreeDataProvider(
        "arduinoExplorer",
        this.treeDataProvider
      )
    );

    disposes.push(
      vscode.commands.registerCommand(
        "arduinoExplorer.initialize",
        (resource: IArduinoEntry) => {
          doInitialize(resource.project);
        }
      )
    );

    disposes.push(
      vscode.commands.registerCommand(
        "arduinoExplorer.openConfiguration",
        (resource: IArduinoEntry) => {
          doOpenConfiguration(resource.project, true);
        }
      )
    );

    disposes.push(
      vscode.commands.registerCommand(
        "arduinoExplorer.selectPort",
        (resource: IArduinoEntry | undefined, _state: State) => {
          if (typeof resource === "string") {
            const url: vscode.Uri = vscode.Uri.parse(resource);

            resource = this.treeDataProvider.entries.find(
              (entry: IArduinoEntry) => {
                return url.fsPath.startsWith(entry.project.uri.fsPath);
              }
            );
          }

          if (resource) {
            const state: State = _state || {
              nextOper: "selectPort",
              workspace: resource.project,
              pickItem: null,
              board: null,
              platforms: null,
              platform: null,
              url: null,
              protocol: acLabArduino.getProtocol(resource.project.uri),
              port: null,
              ports: null,
            };

            doSelectPort(state);
          }
        }
      )
    );

    disposes.push(
      vscode.commands.registerCommand(
        "aclabExplorer.selectBoard",
        (resource: IArduinoEntry, _state: State) => {
          const state: State = _state || {
            nextOper: "selectBoard",
            workspace: resource.project,
            pickItem: null,
            board: null,
            platforms: null,
            platform: null,
            url: null,
            protocol: acLabArduino.getProtocol(resource.project.uri),
            port: null,
            ports: null,
          };

          doSelectBoard(state).then((state: State) => {
            if (state.nextOper === "selectPlatform") {
              vscode.commands.executeCommand(
                "aclabExplorer.selectPlatform",
                resource,
                state
              );
            }
          });
        }
      )
    );

    disposes.push(
      vscode.commands.registerCommand(
        "aclabExplorer.selectPlatform",
        (resource: IArduinoEntry, _state: State) => {
          const state: State = _state || {
            nextOper: "selectPlatform",
            workspace: resource.project,
            pickItem: null,
            board: null,
            platforms: null,
            platform: null,
            url: null,
            protocol: acLabArduino.getProtocol(resource.project.uri),
            port: null,
            ports: null,
          };

          doSelectPlatform(state).then((state: State) => {
            if (state.nextOper === "selectBoard") {
              vscode.commands.executeCommand(
                "aclabExplorer.selectBoard",
                resource,
                state
              );
            }

            if (state.nextOper === "add3rdPartyUrl") {
              vscode.commands.executeCommand(
                "aclabExplorer.add3rdPartyUrl",
                resource,
                state
              );
            }
          });
        }
      )
    );

    disposes.push(
      vscode.commands.registerCommand(
        "aclabExplorer.add3rdPartyUrl",
        (resource: IArduinoEntry, _state: State) => {
          const state: State = _state || {
            nextOper: "add3rdPartyUrl",
            workspace: resource.project,
            pickItem: null,
            board: null,
            platforms: null,
            platform: null,
            url: null,
            protocol: acLabArduino.getProtocol(resource.project.uri),
            port: null,
            ports: null,
          };

          doAdd3rdPartyUrl(state).then((state: State) => {
            if (state.nextOper === "selectPlatform") {
              vscode.commands.executeCommand(
                "aclabExplorer.selectPlatform",
                resource,
                state
              );
            }
          });
        }
      )
    );

    context.subscriptions.push(...disposes);
  }

  checkAllProjects() {
    this.treeDataProvider.entries.forEach((entry: IArduinoEntry) => {
      entry.checkProject(this.treeDataProvider);
    });
  }
}
