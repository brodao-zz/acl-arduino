import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CodeDescription,
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticTag,
  DocumentSymbol,
} from "vscode-languageserver/node";

export namespace ArduinoDiagnostic {
  export enum Error {
    E001_INVALID_CLI_VERSION = "E001",
    E002_INVALID_BOARD = "E002",
    E003_INVALID_PLATFORM_VERSION = "E003",
  }

  export enum Information {
    I002_INVALID_BOARD_NAME = "I002",
  }

  //const NO_RANGE: Range = Range.create(0, 0, 0, 0);

  export function createDiagnostic(
    textDocument: TextDocument,
    documentSymbol: DocumentSymbol,
    code: Error | Information
  ): Diagnostic {
    return {
      severity: codeToSeverity(code),
      code: code,
      source: textDocument.uri,
      range: documentSymbol.range,
      // {
      //   start: textDocument.positionAt(node.range.offset),
      //   end: textDocument.positionAt(node.offset + node.length),
      // },
      message: codeToMessage(code),
      codeDescription: codeToDescription(code),
      tags: codeToTags(code),
      //relatedInformation?: DiagnosticRelatedInformation[];
      data: documentSymbol.detail,
    };
  }

  function codeToSeverity(
    code: Error | Information
  ): DiagnosticSeverity | undefined {
    switch (code.charAt(0)) {
      case "E":
        return DiagnosticSeverity.Error;

      case "W":
        return DiagnosticSeverity.Warning;

      case "I":
        return DiagnosticSeverity.Information;

      case "H":
        return DiagnosticSeverity.Hint;

      default:
        break;
    }

    return undefined;
  }

  function codeToMessage(code: Error | Information): string {
    switch (code) {
      case Error.E001_INVALID_CLI_VERSION:
        return "Invalid CLI version.";
      case Error.E002_INVALID_BOARD:
        return "Invalid board (FQBN).";
      case Error.E003_INVALID_PLATFORM_VERSION:
        return "Invalid platform version.";
      //
      //
      case Information.I002_INVALID_BOARD_NAME:
        return "Board name is not equal FQBN name.";

      default:
        break;
    }

    return "Unknown error";
  }

  // @ts-ignore
  function codeToTags(code: Error | Information): DiagnosticTag[] | undefined {
    switch (code) {
      case Error.E001_INVALID_CLI_VERSION:
        return [DiagnosticTag.Deprecated];

      default:
        break;
    }

    return undefined;
  }

  function codeToDescription(
    code: ArduinoDiagnostic.Error | ArduinoDiagnostic.Information
  ): CodeDescription | undefined {
    switch (code) {
      case Error.E001_INVALID_CLI_VERSION:
        return { href: "http://teste" };

      default:
        break;
    }

    return undefined;
  }
}
