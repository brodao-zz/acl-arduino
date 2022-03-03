import * as Ajv from "ajv";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CodeAction,
  CodeActionParams,
  CodeActionKind,
  Command,
  CodeActionOptions,
  TextEdit,
  Diagnostic,
  ExecuteCommandOptions,
} from "vscode-languageserver/node";
import { ArduinoDiagnostic } from "./arduino-diagnostic";
import { COMMAND_INSTALL_CLI } from "./commands/do-install-cli";
import { ACLLogger } from "./logger";

export function getCodeActionProvider(): CodeActionOptions {
  return {
    codeActionKinds: [CodeActionKind.QuickFix, CodeActionKind.SourceFixAll],
  };
}

export function getExecuteCommandProvider(): ExecuteCommandOptions {
  return {
    commands: ["sample.fixMe"],
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

  const codeActions: CodeAction[] = [];
  const diagnostics: Diagnostic[] = params.context.diagnostics;
  const documentUri: string = params.textDocument.uri;

  const missingPropertyDiags: Diagnostic[] = diagnostics.filter(
    (diag: Diagnostic) => {
      return diag.message.startsWith("Missing property");
    }
  );

  if (missingPropertyDiags.length > 1) {
    codeActions.push(missingAllProperty(documentUri, missingPropertyDiags));
  }

  diagnostics.forEach((diag) => {
    const start: number = document.offsetAt(diag.range.start);
    const end: number = document.offsetAt(diag.range.end) - start;
    const text: string = document.getText().substring(start, end);

    if (diag.message.startsWith("Missing property")) {
      codeActions.push(
        missingProperty(documentUri, diag, diag.range.start.line)
      );
    } else if (diag.code === 1) {
      codeActions.push(...valueMust(documentUri, diag));
    } else if (diag.code === 516) {
    } else if (diag.code === 516) {
      console.log(text);
    }
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

function missingAllProperty(
  documentUri: string,
  diagnostics: Diagnostic[]
): CodeAction {
  let line: number = 1;
  const changes: { [uri: string]: TextEdit[] } = {};
  changes[documentUri] = [];

  diagnostics.forEach((diagnostic: Diagnostic) => {
    const action: CodeAction = missingProperty(documentUri, diagnostic, line);
    if (action.edit && action.edit.changes) {
      changes[documentUri].push(...action.edit.changes[documentUri]);
      //line++;
    }
  });

  return {
    title: `Fix all missing properties`,
    kind: CodeActionKind.QuickFix,
    diagnostics: diagnostics,
    edit: {
      changes: changes,
    },
  };
}

function missingProperty(
  documentUri: string,
  diagnostic: Diagnostic,
  line: number
): CodeAction {
  const groups: string[] = /.*"(.*)"/.exec(diagnostic.message) || [];
  const property: string = groups[1];

  return {
    title: `Add '${property}' property`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [documentUri]: [
          TextEdit.insert(
            { line: line, character: diagnostic.range.end.character },
            `\n${" ".repeat(
              diagnostic.range.end.character
            )}"${property}": "${""}",`
          ),
        ],
      },
    },
  };
}

function valueMust(documentUri: string, diagnostic: Diagnostic): CodeAction[] {
  const codeAction: CodeAction[] = [];
  const block: string[] = diagnostic.message.match(/(".*")/g) || [];

  if (block.length) {
    const groups: string[] = block[0].split(",");
    groups.forEach((value: string) => {
      codeAction.push({
        title: `${groups.length === 1 ? "Set " : ""}${value}`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
          changes: {
            [documentUri]: [TextEdit.replace(diagnostic.range, `${value}`)],
          },
        },
      });
    });
  }

  return codeAction;
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
