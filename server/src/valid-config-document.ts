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

  if (diagnostics.length === 0) {
    diagnosticsAux = doValidBoard(
      jsonLanguageService,
      textDocument,
      jsonDocument
    );
    diagnostics.push(...diagnosticsAux);

    diagnosticsAux = doValidPort(
      jsonLanguageService,
      textDocument,
      jsonDocument
    );
    diagnostics.push(...diagnosticsAux);
  }

  return diagnostics;
}

async function doValidCliVersion(
  jsonLanguageService: JsonLanguageService,
  textDocument: TextDocument,
  jsonDocument: JSONDocument
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const cliVersionSymbol: DocumentSymbol | undefined = jsonLanguageService
    .findDocumentSymbols2(textDocument, jsonDocument)
    .find((symbol: DocumentSymbol) => symbol.name === "cliVersion");

  if (cliVersionSymbol) {
    const releases: Server.IArduinoRelease[] =
      await ArduinoGithub.getReleases();
    const release: Server.IArduinoRelease | undefined = releases.find(
      (release: Server.IArduinoRelease | undefined) => {
        if (release && release.name === cliVersionSymbol.detail) {
          return release;
        }

        return undefined;
      }
    );

    if (release) {
      ArduinoCli.instance()
        .checkEnvironment(cliVersionSymbol.detail || "")
        .then((diagnostic: ShowMessageRequestParams | undefined) => {
          if (diagnostic) {
            doSendShowMessageRequest(diagnostic);
          }
        });
    } else {
      diagnostics.push(
        ArduinoDiagnostic.createDiagnostic(
          textDocument,
          cliVersionSymbol,
          ArduinoDiagnostic.Error.E001_INVALID_CLI_VERSION
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
  const boardSymbol: DocumentSymbol | undefined = jsonLanguageService
    .findDocumentSymbols2(textDocument, jsonDocument)
    .find((symbol: DocumentSymbol) => symbol.name === "board");

  const boardNameSymbol: DocumentSymbol | undefined = jsonLanguageService
    .findDocumentSymbols2(textDocument, jsonDocument)
    .find((symbol: DocumentSymbol) => symbol.name === "board_name");

  if (boardSymbol) {
    const platforms: Server.IArduinoPlatform[] =
      ArduinoCli.instance().coreList("").data;
    const parts: string[] = (boardSymbol.detail || "").split(":");
    const platformId: string = parts.slice(0, -1).join(":");

    if (parts.length > 2) {
      const platform: Server.IArduinoPlatform | undefined = platforms
        .filter((value: Server.IArduinoPlatform) => value.id === platformId)
        .pop();

      if (platform) {
        const board: Server.IArduinoBoard | undefined = platform.boards
          .filter(
            (value: Server.IArduinoBoard) => value.fqbn === boardSymbol.detail
          )
          .pop();

        if (board) {
          if (
            boardNameSymbol &&
            boardNameSymbol.detail?.toLowerCase() === board.name.toLowerCase()
          ) {
            // ok
          } else if (boardNameSymbol) {
            diagnostics.push(
              ArduinoDiagnostic.createDiagnostic(
                textDocument,
                boardNameSymbol,
                ArduinoDiagnostic.Information.I002_INVALID_BOARD_NAME_UPDATE
              )
            );
          } else {
            diagnostics.push(
              ArduinoDiagnostic.createDiagnostic(
                textDocument,
                boardSymbol,
                ArduinoDiagnostic.Information.I003_INVALID_BOARD_NAME_INSERT
              )
            );
          }
        } else {
          diagnostics.push(
            ArduinoDiagnostic.createDiagnostic(
              textDocument,
              boardSymbol,
              ArduinoDiagnostic.Error.E002_INVALID_BOARD
            )
          );
        }
      } else {
        diagnostics.push(
          ArduinoDiagnostic.createDiagnostic(
            textDocument,
            boardSymbol,
            ArduinoDiagnostic.Error.E003_INVALID_PLATFORM_VERSION
          )
        );
      }
    }
  }

  return diagnostics;
}

function doValidPort(
  jsonLanguageService: JsonLanguageService,
  textDocument: TextDocument,
  jsonDocument: any
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const portSymbol: DocumentSymbol | undefined = jsonLanguageService
    .findDocumentSymbols2(textDocument, jsonDocument)
    .find((symbol: DocumentSymbol) => symbol.name === "port");

  if (portSymbol) {
    const port: string = portSymbol.detail || "";
    if (port.trim().length === 0) {
      diagnostics.push(
        ArduinoDiagnostic.createDiagnostic(
          textDocument,
          portSymbol,
          ArduinoDiagnostic.Error.E004_INVALID_PORT
        )
      );
    }
  }

  return diagnostics;
}
