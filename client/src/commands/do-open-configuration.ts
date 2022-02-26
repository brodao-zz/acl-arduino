import * as vscode from "vscode";

export function doOpenConfiguration(workspace: vscode.WorkspaceFolder) {
  vscode.workspace
    .openTextDocument(
      vscode.Uri.joinPath(workspace.uri, ".vscode", "aclabarduino.json")
    )
    .then(
      (value: vscode.TextDocument) => {
        vscode.window.showTextDocument(value);
      },
      (reason: any) => {
        console.error(reason);
        vscode.window.showErrorMessage(reason.message);
      }
    );
}
