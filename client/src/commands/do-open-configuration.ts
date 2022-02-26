import * as vscode from "vscode";

export function doOpenConfiguration(
  workspace: vscode.WorkspaceFolder,
  show: boolean
) {
  vscode.workspace
    .openTextDocument(
      vscode.Uri.joinPath(workspace.uri, ".vscode", "aclabarduino.json")
    )
    .then(
      (value: vscode.TextDocument) => {
        if (show) {
          vscode.window.showTextDocument(value);
        }
      },
      (reason: any) => {
        console.error(reason);
        vscode.window.showErrorMessage(reason.message);
      }
    );
}
