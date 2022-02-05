import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from "vscode-languageserver/node";

export namespace ArduinoDiagnostic {
  export const E001_INVALID_CLI_VERSION: string = "E001";
  export const E002_INVALID_BOARD: string = "E002";
  export const E003_INVALID_PLATFORM_VERSION: string = "E003";

  //const NO_RANGE: Range = Range.create(0, 0, 0, 0);

  export function INVALID_ARDUINO_CLI(
    resource: string,
    range: Range,
    last: string
  ): Diagnostic {
    return createDiagnostic(
      DiagnosticSeverity.Error,
      E001_INVALID_CLI_VERSION,
      "Invalid Arduino-CLI version.",
      resource,
      range,
      last
    );
  }

  export function INVALID_BOARD(
    resource: string,
    range: Range,
    reason: string
  ): Diagnostic {
    return createDiagnostic(
      DiagnosticSeverity.Error,
      E002_INVALID_BOARD,
      `Invalid board. ${reason}`,
      resource,
      range
    );
  }

  export function INVALID_PLATFORM_VERSION(
    resource: string,
    range: Range,
    versions: string[]
  ): Diagnostic {
    return createDiagnostic(
      DiagnosticSeverity.Error,
      E003_INVALID_PLATFORM_VERSION,
      "Invalid platform version.",
      resource,
      range,
      versions
    );
  }
}

function createDiagnostic(
  severity: DiagnosticSeverity,
  code: string,
  message: string,
  source: string,
  range: Range,
  data?: any
): Diagnostic {
  return {
    range: range,
    severity: severity,
    code: code,
    message: message,
    source: source,
    //codeDescription: CodeDescription;
    //tags?: DiagnosticTag[];
    //relatedInformation?: DiagnosticRelatedInformation[];
    data: data,
  };
}
