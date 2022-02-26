import * as vscode from "vscode";

export function doOpenConfiguration(workspace: vscode.WorkspaceFolder) {
  vscode.workspace.openTextDocument(
    vscode.Uri.file(`${workspace.uri.fsPath}/.vscode/aclabarduino.json`)
  );
}
