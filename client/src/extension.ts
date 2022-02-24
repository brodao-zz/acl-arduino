import * as vscode from "vscode";
import { Client } from "./client";
import { ArduinoExplorer } from "./explorer/arduino-explorer";

//
// this method is called when your extension is activated
//
export let acLabArduino: Client;
export let arduinoExplorer: ArduinoExplorer;

export function activate(context: vscode.ExtensionContext) {
  console.log('"ACLab Arduino" being activated.');

  acLabArduino = new Client(context);
  context.subscriptions.push(acLabArduino);

  //
  // Global commands
  //

  //
  // Inicializa LS padrão
  //
  acLabArduino
    .getDefaultProtocol()
    .languageClient.onReady()
    .then(
      () => {
        arduinoExplorer.checkAllProjects();
      },
      (reason: any) => {
        console.error(`LC error [checkAllProjects]`);
        console.error(reason);
      }
    );

  //
  // Arduino Explorer View
  //
  arduinoExplorer = new ArduinoExplorer(context);

  //
  // Workspace events
  //
  vscode.workspace.onDidOpenTextDocument(didOpenTextDocument);
  vscode.workspace.textDocuments.forEach(didOpenTextDocument);
  vscode.workspace.onDidChangeWorkspaceFolders((event) => {
    for (const folder of event.added) {
      acLabArduino.getModel(folder);
    }

    for (const folder of event.removed) {
      acLabArduino.removeModel(folder);
    }

    console.log("arduinoExplorer.reveal()");
  });
}

//
// this method is called when your extension is deactivated
//
export async function deactivate(): Promise<void> {
  return acLabArduino.stopAllClient().then(() => undefined);
}

function didOpenTextDocument(document: vscode.TextDocument): void {
  if (
    document.languageId !== "ino" &&
    document.languageId !== "json" &&
    document.uri.scheme !== "file" &&
    document.uri.scheme !== "untitled"
  ) {
    return;
  }

  const uri = document.uri;
  let folder = vscode.workspace.getWorkspaceFolder(uri);
  if (!folder) {
    return;
  }

  if (!acLabArduino.hasProtocol(folder.uri)) {
    acLabArduino.getProtocol(folder.uri);
  }
}
