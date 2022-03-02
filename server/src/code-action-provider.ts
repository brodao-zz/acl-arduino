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

export function provideCodeActions(params: CodeActionParams): CodeAction[] {
  ACLLogger.instance().debug("provideCodeActions");

  if (!params.context.diagnostics.length) {
    return [];
  }

  const codeActions: CodeAction[] = [];
  const diagnostics: Diagnostic[] = params.context.diagnostics;

  diagnostics.forEach((diag) => {
    // if (diag.message === 'Missing property "board".') {
    //   codeActions.push({
    //     title: `Run Configuration Board`,
    //     kind: CodeActionKind.QuickFix,
    //     diagnostics: [diag],
    //     //isPreferred: true,
    //     command: Command.create(
    //       "Select Board",
    //       "aclabExplorer.selectBoard",
    //       params.textDocument.uri.toString()
    //     ),
    //   });
    //} else
    if (diag.code === ArduinoDiagnostic.Error.E001_INVALID_CLI_VERSION) {
      codeActions.push(processE001(params.textDocument.uri, diag));
    } else if (
      diag.code === ArduinoDiagnostic.Information.I002_INVALID_BOARD_NAME_UPDATE
    ) {
      codeActions.push(processI002(params.textDocument.uri, diag));
    } else if (
      diag.code === ArduinoDiagnostic.Information.I003_INVALID_BOARD_NAME_INSERT
    ) {
      codeActions.push(processI003(params.textDocument.uri, diag));
    } else if (diag.code === ArduinoDiagnostic.Error.E004_INVALID_PORT) {
      codeActions.push(processE004(diag));
    } else if (diag.code === ArduinoDiagnostic.Error.E005_INVALID_CONTENT) {
      codeActions.push(processE005(params.textDocument.uri, diag));
    } else if (diag.code === ArduinoDiagnostic.Error.E007_CLI_NOT_INSTALLED) {
      codeActions.push(processE007(diag));
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

function processE001(documentUri: string, diag: Diagnostic): CodeAction {
  const data: any = diag.data || {};

  return {
    title: `"Set [${data.name}] to most recent version"`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit: {
      changes: {
        [documentUri]: [
          {
            range: diag.range,
            newText: `"${data.value}"`,
          },
        ],
      },
    },
  };
}

function processI002(documentUri: string, diag: Diagnostic): CodeAction {
  const data: any = diag.data || {};

  return {
    title: "Update 'Board Name' property",
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit: {
      changes: {
        [documentUri]: [
          {
            range: diag.range,
            newText: `"board_name": "${data.value}"`,
          },
        ],
      },
    },
  };
}

function processI003(documentUri: string, diag: Diagnostic): CodeAction {
  const data: any = diag.data || {};

  return {
    title: `Add '${data.name}' property`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit: {
      changes: {
        [documentUri]: [
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
  };
}

function processE004(diag: Diagnostic): CodeAction {
  const data: any = diag.data || {};

  return {
    title: "Select port",
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    command: Command.create(
      "Select Port",
      "arduinoExplorer.selectPort",
      data.source
    ),
  };
}

function processE005(documentUri: string, diag: Diagnostic): CodeAction {
  const data: any = diag.data;
  const error = data.error as Ajv.ErrorObject;

  if (error.keyword === "required") {
    return processE005required(documentUri, diag);
  }

  return processE005change(documentUri, diag);
}

function processE005required(
  documentUri: string,
  diag: Diagnostic
): CodeAction {
  const data: any = diag.data;
  const error = data.error as Ajv.ErrorObject;
  const property: string = error.params.missingProperty;

  return {
    title: `Insert '${property}' property`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit: {
      changes: {
        [documentUri]: [
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
  };
}

function processE005change(documentUri: string, diag: Diagnostic): CodeAction {
  const data: any = diag.data;
  const error = data.error as Ajv.ErrorObject;
  const property: string = error.params.missingProperty;

  return {
    title: `Change '${property}' property`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit: {
      changes: {
        [documentUri]: [
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
  };
}

function processE007(diag: Diagnostic): CodeAction {
  const data: any = diag.data || {};

  return {
    title: `Install Arduino-CLI ${data.version}`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    command: Command.create(
      "Install Arduino-CLI",
      COMMAND_INSTALL_CLI,
      data.version
    ),
  };
}
