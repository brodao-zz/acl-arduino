import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CodeAction,
  CodeActionParams,
  CodeActionKind,
  Command,
  CodeActionOptions,
} from "vscode-languageserver/node";
import { ArduinoDiagnostic } from "./arduino-diagnostic";
import { ACLLogger } from "./logger";

export function getCodeActionProvider(): CodeActionOptions {
  return {
    codeActionKinds: [CodeActionKind.QuickFix],
  };
}

export function provideCodeActions(
  document: TextDocument,
  params: CodeActionParams
): CodeAction[] {
  ACLLogger.instance().debug("provideCodeActions");

  if (!params.context.diagnostics.length) {
    return [];
  }

  return quickfix(document, params);
}

function quickfix(
  textDocument: TextDocument,
  params: CodeActionParams
): CodeAction[] {
  const diagnostics = params.context.diagnostics;
  if (!diagnostics || diagnostics.length === 0) {
    return [];
  }

  const codeActions: CodeAction[] = [];

  diagnostics.forEach((diag) => {
    if (diag.message === 'Missing property "board".') {
      codeActions.push({
        title: `Run Configuration Board`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        isPreferred: true,
        command: Command.create(
          "Select Board",
          "aclabExplorer.selectBoard",
          textDocument.uri.toString()
        ),
      });
    }
    if (diag.code === ArduinoDiagnostic.Error.E001_INVALID_CLI_VERSION) {
      codeActions.push({
        title: `"Set to [${diag.data}] (most recent) version"`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        edit: {
          changes: {
            [params.textDocument.uri]: [
              {
                range: diag.range,
                newText: `"${diag.data}"`,
              },
            ],
          },
        },
      });

      return;
    }

    // if (
    //   diag.severity === DiagnosticSeverity.Error &&
    //   diag.message.includes(QUICKFIX_SPACE_BEFORE_EOS_MSG)
    // ) {
    //   codeActions.push({
    //     title: "Adding space between value and end of statement operator",
    //     kind: CodeActionKind.QuickFix,
    //     diagnostics: [diag],
    //     edit: {
    //       changes: {
    //         [params.textDocument.uri]: [
    //           {
    //             range: diag.range,
    //             newText: " " + textDocument.getText(diag.range),
    //           },
    //         ],
    //       },
    //     },
    //   });
    //   return;
    // }

    // if (
    //   diag.severity === DiagnosticSeverity.Error &&
    //   diag.message.includes(QUICKFIX_NO_EOS_MSG)
    // ) {
    //   codeActions.push({
    //     title: "Adding end of statement operator",
    //     kind: CodeActionKind.QuickFix,
    //     diagnostics: [diag],
    //     edit: {
    //       changes: {
    //         [params.textDocument.uri]: [
    //           {
    //             range: diag.range,
    //             newText: textDocument.getText(diag.range) + " . ",
    //           },
    //         ],
    //       },
    //     },
    //   });
    //   return;
    // }

    // if (
    //   diag.severity === DiagnosticSeverity.Error &&
    //   !diag.relatedInformation &&
    //   diag.relatedInformation[0].message.includes(QUICKFIX_CHOICE_MSG)
    // ) {
    //   const actions = diag.relatedInformation[0].message
    //     .substring(QUICKFIX_CHOICE_MSG.length)
    //     .split(",");
    //   codeActions.push({
    //     title: `Change to a possible valid value: ${actions[0].trim()}`,
    //     kind: CodeActionKind.QuickFix,
    //     diagnostics: [diag],
    //     edit: {
    //       changes: {
    //         [params.textDocument.uri]: [
    //           {
    //             range: diag.range,
    //             newText: actions[0].trim(),
    //           },
    //         ],
    //       },
    //     },
    //   });
    //   return;
    // }
  });

  return codeActions;
}
