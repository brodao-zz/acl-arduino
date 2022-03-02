import * as Ajv from "ajv";
import {
  CodeAction,
  CodeActionParams,
  CodeActionKind,
  Command,
  CodeActionOptions,
  TextEdit,
  Diagnostic,
} from "vscode-languageserver/node";
import { ArduinoDiagnostic } from "./arduino-diagnostic";
import { COMMAND_INSTALL_CLI } from "./commands/do-install-cli";
import { ACLLogger } from "./logger";

export function getCodeActionProvider(): CodeActionOptions {
  return {
    codeActionKinds: [CodeActionKind.QuickFix],
  };
}

export function _provideCodeActions(params: CodeActionParams): CodeAction[] {
  ACLLogger.instance().debug("provideCodeActions");

  if (!params.context.diagnostics.length) {
    return [];
  }

  const codeActions: CodeAction[] = [];
  const diagnostics: Diagnostic[] = params.context.diagnostics;

  diagnostics.forEach((diag) => {
    if (diag.message === 'Missing property "board".') {
      codeActions.push({
        title: `Run Configuration Board`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        //isPreferred: true,
        command: Command.create(
          "Select Board",
          "aclabExplorer.selectBoard",
          params.textDocument.uri.toString()
        ),
      });
    } else if (diag.code === ArduinoDiagnostic.Error.E001_INVALID_CLI_VERSION) {
      const data: any = diag.data || {};

      codeActions.push({
        title: `"Set [${data.name}] to most recent version"`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        edit: {
          changes: {
            [params.textDocument.uri]: [
              {
                range: diag.range,
                newText: `"${data.value}"`,
              },
            ],
          },
        },
      });

      return;
    } else if (
      diag.code === ArduinoDiagnostic.Information.I002_INVALID_BOARD_NAME_UPDATE
    ) {
      const data: any = diag.data || {};

      codeActions.push({
        title: "Update 'Board Name' property",
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        edit: {
          changes: {
            [params.textDocument.uri]: [
              {
                range: diag.range,
                newText: `"board_name": "${data.value}"`,
              },
            ],
          },
        },
      });
    } else if (
      diag.code === ArduinoDiagnostic.Information.I003_INVALID_BOARD_NAME_INSERT
    ) {
      const data: any = diag.data || {};

      codeActions.push({
        title: `Add '${data.name}' property`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        edit: {
          changes: {
            [params.textDocument.uri]: [
              TextEdit.insert(
                {
                  line: diag.range.end.line + 1,
                  character: diag.range.start.character,
                },
                `"${data.name}": "${data.value}",\n${" ".repeat(
                  diag.range.start.character
                )}`
              ),
            ],
          },
        },
      });
    } else if (diag.code === ArduinoDiagnostic.Error.E004_INVALID_PORT) {
      const data: any = diag.data || {};

      codeActions.push({
        title: "Select port",
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        command: Command.create(
          "Select Port",
          "arduinoExplorer.selectPort",
          data.source
        ),
      });

      return;
    } else if (diag.code === ArduinoDiagnostic.Error.E005_INVALID_CONTENT) {
      const data: any = diag.data;
      const error = data.error as Ajv.ErrorObject;

      if (error.keyword === "required") {
        const property: string = error.params.missingProperty;
        codeActions.push({
          title: `Insert '${property}' property`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diag],
          edit: {
            changes: {
              [params.textDocument.uri]: [
                TextEdit.insert(
                  {
                    line: diag.range.end.line + 1,
                    character: diag.range.start.character,
                  },
                  `"${property}": "${
                    error.parentSchema?.properties[property].const ||
                    error.parentSchema?.properties[property].default ||
                    ""
                  }",\n${" ".repeat(diag.range.start.character)}`
                ),
              ],
            },
          },
        });
      } else {
        codeActions.push({
          title: `Change '${data.instancePath}' property`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diag],
          edit: {
            changes: {
              [params.textDocument.uri]: [
                TextEdit.insert(
                  {
                    line: diag.range.end.line + 1,
                    character: diag.range.start.character,
                  },
                  `"${data.params[0]}": "${data.params[1]}",\n${" ".repeat(
                    diag.range.start.character
                  )}`
                ),
              ],
            },
          },
        });
      }
    } else if (diag.code === ArduinoDiagnostic.Error.E007_CLI_NOT_INSTALLED) {
      const data: any = diag.data || {};

      codeActions.push({
        title: `Install Arduino-CLI ${data.version}`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        command: Command.create(
          "Install Arduino-CLI",
          COMMAND_INSTALL_CLI,
          data.version
        ),
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
