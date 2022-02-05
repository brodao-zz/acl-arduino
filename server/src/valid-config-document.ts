import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Diagnostic,
  DocumentSymbol,
  ShowMessageRequestParams,
} from "vscode-languageserver/node";
import {
  LanguageService as JsonLanguageService,
  JSONDocument,
} from "vscode-json-languageservice";
import { doSendShowMessageRequest } from "./server";
import { ArduinoGithub } from "./arduino-github";
import { ArduinoDiagnostic } from "./arduino-diagnostic";
import { Server } from "./server-interf";
import { ArduinoCli } from "./arduino-cli";
import { IBoardServerModel } from "./model/config-model";

export async function doValidConfigDocument(
  jsonLanguageService: JsonLanguageService,
  textDocument: TextDocument,
  jsonDocument: JSONDocument
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let diagnosticsAux: Diagnostic[] = await doValidCliVersion(
    jsonLanguageService,
    textDocument,
    jsonDocument
  );
  diagnostics.push(...diagnosticsAux);

  diagnosticsAux = doValidBoard(
    jsonLanguageService,
    textDocument,
    jsonDocument
  );
  diagnostics.push(...diagnosticsAux);

  return Promise.resolve(diagnostics);
}

async function doValidCliVersion(
  jsonLanguageService: JsonLanguageService,
  textDocument: TextDocument,
  jsonDocument: JSONDocument
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const resultSymbol: DocumentSymbol = jsonLanguageService
    .findDocumentSymbols2(textDocument, jsonDocument)
    .find((symbol: DocumentSymbol) => symbol.name == "cliVersion");

  if (resultSymbol) {
    const releases: Server.IArduinoRelease[] =
      await ArduinoGithub.getReleases();
    const release: Server.IArduinoRelease = releases.find(
      (release: Server.IArduinoRelease) => {
        if (release.name == resultSymbol.detail) {
          return release;
        }
      }
    );

    if (release) {
      ArduinoCli.instance()
        .checkEnvironment(resultSymbol.detail)
        .then((diagnostic: ShowMessageRequestParams) => {
          if (diagnostic) {
            doSendShowMessageRequest(diagnostic);
          }
        });
    } else {
      const offset: number = textDocument.offsetAt(
        resultSymbol.selectionRange.end
      );
      const valueNode = (jsonDocument.getNodeFromOffset(offset) as any)[
        "valueNode"
      ];

      diagnostics.push(
        ArduinoDiagnostic.INVALID_ARDUINO_CLI(
          textDocument.uri,
          {
            start: textDocument.positionAt(valueNode.offset),
            end: textDocument.positionAt(valueNode.offset + valueNode.length),
          },
          releases.shift().name
        )
      );
    }
  }

  return Promise.resolve(diagnostics);
}

function doValidBoard(
  jsonLanguageService: JsonLanguageService,
  textDocument: TextDocument,
  jsonDocument: any
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const resultSymbol: DocumentSymbol = jsonLanguageService
    .findDocumentSymbols2(textDocument, jsonDocument)
    .find((symbol: DocumentSymbol) => symbol.name == "board");

  const error = (node: any, message: string) => {
    diagnostics.push(
      ArduinoDiagnostic.INVALID_BOARD(
        textDocument.uri,
        {
          start: textDocument.positionAt(node.offset),
          end: textDocument.positionAt(node.offset + node.length),
        },
        message
      )
    );
  };

  if (resultSymbol) {
    const platforms: Server.IArduinoPlatform[] =
      ArduinoCli.instance().coreList("").data;
    const parts: string[] = resultSymbol.detail.split(":");
    const platformId: string = parts.slice(0, -1).join(":");

    if (parts.length > 2) {
      const platform: Server.IArduinoPlatform = platforms
        .filter((value: Server.IArduinoPlatform) => value.id == platformId)
        .pop();

      if (platform) {
        const board: Server.IArduinoBoard = platform.boards
          .filter(
            (value: Server.IArduinoBoard) => value.fqbn == resultSymbol.detail
          )
          .pop();

        if (!board) {
          error(resultSymbol, "Invalid board (FQBN) value");
        }
      } else {
        error(resultSymbol, `Invalid or not installed platform ${platformId}`);
      }
    }
  }

  return diagnostics;
}
