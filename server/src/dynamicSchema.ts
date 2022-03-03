export namespace DynamicSchema {
  export const SCHEMA_ACLABARDUINO: string =
    "aclab://server/aclabarduino.schema.json";
  export const SCHEMA_CLI_VERSION = "aclab://server/defs.json";

  export function acLabArduino(): any {
    return {
      $id: "aclab://server/aclabarduino.schema.json",
      title: "AC Lab Configuration File",
      description: "AC Lab Configuration file for MCU projects.",
      type: "object",
      properties: {
        version: {
          description: "Version this file schema.",
          type: "string",
          const: "0.0.1",
        },
        cliVersion: {
          description: "Arduino-CLI version.",
          type: "string",
          $ref: "aclab://server/defs.json#/definitions/cliVersion",
        },
        board: {
          description: "Fully Qualified Board Name (FQBN).",
          type: "string",
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        board_name: {
          description: "Human readable board name (FQBN). Automatic filling.",
          type: "string",
          readOnly: true,
        },
        port: {
          description: "Serial port for connecting to device.",
          type: "string",
        },
        alias: {
          description: "Alias for the project and board.",
          type: "string",
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        additional_urls: {
          type: "array",
          items: {
            type: "string",
          },
          minItems: 1,
        },
      },
      additionalProperties: false,
      required: ["version", "cliVersion", "board", "port"],
    };
  }

  export function cliVersion(): any {
    return {
      $id: SCHEMA_CLI_VERSION,
      definitions: {
        cliVersion: { enum: ["a", "b"] },
      },
    };
  }
}
