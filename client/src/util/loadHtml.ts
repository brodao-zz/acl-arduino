import * as vscode from "vscode";
import { getNonce } from "./nonce";

export function loadHtmlForWebview(
  webview: vscode.Webview,
  reactApp: string
): string {
  const reactAppUri: vscode.Uri = webview.asWebviewUri(
    vscode.Uri.file(reactApp)
  );
  const nonce = getNonce();

  return `
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy"
				content="default-src 'none'; img-src https:; script-src 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}' vscode-resource:; style-src vscode-resource: 'unsafe-inline';">    
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${reactApp}}</title>
		</head>
		<body>
			<div id="root"></div>
			<script nonce="${nonce}" src="${reactAppUri}"></script>
		</body>
	</html>`;
}
