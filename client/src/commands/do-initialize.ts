import * as vscode from "vscode";
import { acLabArduino } from "../extension";
import { Protocol } from "../protocol-interf";

export function doInitialize(workspace: vscode.WorkspaceFolder) {
  return getVersion().then(
    (version: Protocol.IArduinoCliVersion) => {
      if (!version) {
        vscode.window.showInformationMessage(
          "Initialize canceled by user request"
        );
      } else {
        vscode.window.showInformationMessage(
          `Select Arduino-CLI Version [${version.name}]`
        );
        acLabArduino.getModel(workspace).cliVersion = version.name;
      }
    },
    (reason: any) => {
      vscode.window.showErrorMessage(reason);
    }
  );
}

function getVersion(): Promise<Protocol.IArduinoCliVersion> {
  return acLabArduino
    .getDefaultProtocol()
    .getReleases()
    .then(async (releases: Map<string, Protocol.IArduinoCliVersion>) => {
      const pickItem: vscode.QuickPickItem = await vscode.window.showQuickPick(
        getItemsPick(releases),
        {
          placeHolder: "Select a version for Arduino-cli",
          title: "Arduino-CLI Version",
        }
      );

      return pickItem ? releases.get(pickItem.label) : undefined;
    });
}

function getItemsPick(
  releases: Map<string, Protocol.IArduinoCliVersion>
): vscode.QuickPickItem[] {
  const result: vscode.QuickPickItem[] = [];

  releases.forEach((entry: Protocol.IArduinoCliVersion) => {
    const date: Date = new Date(Date.parse(entry.published_at));

    result.push({
      label: entry.tag_name,
      description: `${
        entry.prerelease ? "prerelease" : "release"
      } in ${date.toLocaleDateString()} ${date.toLocaleTimeString()} by ${
        entry.author
      }`,
    });
  });

  return result;
}

// function prepateEnvironment() {
//   vscode.window.withProgress(
//     {
//       cancellable: true,
//       location: vscode.ProgressLocation.Notification,
//       title: "Setup Requirements",
//     },
//     async (progress, token) => {
//       token.onCancellationRequested((e: any) => {
//         vscode.window.showInformationMessage("Canceled by user request");
//         return;
//       });

//       progress.report({
//         message: "Setup Requirements (it may take a few minutes)",
//       });

//       await acLabArduino
//         .setupRequirements({
//           arduinoCliVersion: version.label,
//           //progress: progress,
//           //cancel: token,
//         })
//         .then((value: boolean) => {
//           if (value) {
//             progress.report({
//               message: "Setup finished.",
//               increment: 100,
//             });
//           } else {
//             progress.report({
//               message: "Setup failure.",
//               increment: 100,
//             });
//           }

//           return value;
//         });
//     }
//   );
// }
