import fse = require("fs-extra");
import * as Ajv from "ajv";
import { Diagnostic } from "vscode-languageserver/node";
import { ArduinoDiagnostic } from "../arduino-diagnostic";
import { IConfigServerModel, Server } from "..";
import { ArduinoGithub } from "../arduino-github";
import { ArduinoCli, IArduinoExec } from "../arduino-cli";
import { configSchema } from "../modes/language-modes";

const jsonMap = require("json-source-map");

export const COMMAND_VALID_MODEL: string = "arduinoExplorer.validModel";

export function doValidModel(filename: string): Promise<Diagnostic[]> {
  const content: string = fse.readFileSync(filename).toString();

  return doValidContentModel(filename, JSON.parse(content), content);
}

export async function doValidContentModel(
  workspace: string,
  data: IConfigServerModel,
  content: string
): Promise<Diagnostic[]> {
  const result: Diagnostic[] = [];

  const ajv = new Ajv.default({
    allErrors: true,
    //jsPropertySyntax: true,
    //jsonPointers: true,
    verbose: true,
  });
  const schema: Ajv.JSONSchemaType<IConfigServerModel> =
    JSON.parse(configSchema);
  const validate = ajv.compile(schema);

  if (!validate(data)) {
    const sourceMap = jsonMap.parse(content);

    validate.errors?.forEach((value: Ajv.ErrorObject) => {
      const errorPointer = sourceMap.pointers[value.instancePath];

      result.push(
        ArduinoDiagnostic.createProjectDiagnostic(
          workspace,
          {
            start: {
              line: errorPointer.key?.line | 0,
              character: errorPointer.key?.column | 0,
            },
            end: {
              line: errorPointer.value?.line | 0,
              character: errorPointer.value?.column | 0,
            },
          },
          ArduinoDiagnostic.Error.E005_INVALID_CONTENT,
          `${value.keyword.charAt(0).toUpperCase()}${value.keyword.substring(
            1
          )}: ${value.message}`,
          {
            errorPointer: errorPointer,
            error: value,
          }
        )
      );
    });
  } else {
    result.push(...(await doValidCliVersion(workspace, data)));
    result.push(...(await doValidPort(workspace, data)));
    result.push(...(await doValidPlatformAndBoard(workspace, data)));
  }

  return result;
}

async function doValidCliVersion(
  workspace: string,
  data: IConfigServerModel
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const releases: Server.IArduinoRelease[] = await ArduinoGithub.getReleases();
  const release: Server.IArduinoRelease | undefined = releases.find(
    (release: Server.IArduinoRelease | undefined) => {
      if (release && release.name === data.cliVersion) {
        return release;
      }

      return undefined;
    }
  );

  if (release) {
    await ArduinoCli.instance()
      .checkEnvironment(data.cliVersion)
      .then((diagnostic: Diagnostic | undefined) => {
        if (diagnostic) {
          diagnostics.push(diagnostic);
        }
      });
  } else {
    diagnostics.push(
      ArduinoDiagnostic.createProjectDiagnostic(
        workspace,
        undefined,
        ArduinoDiagnostic.Error.E001_INVALID_CLI_VERSION,
        "cliVersion invalid or unsupported.",
        {}
      )
    );
  }

  return Promise.resolve(diagnostics);
}

async function doValidPort(
  workspace: string,
  data: IConfigServerModel
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  data.port = data.port.trim();

  if (!data.port.startsWith("com")) {
    diagnostics.push(
      ArduinoDiagnostic.createProjectDiagnostic(
        workspace,
        undefined,
        ArduinoDiagnostic.Error.E004_INVALID_PORT,
        data.port,
        {}
      )
    );
  }

  return Promise.resolve(diagnostics);
}

async function doValidPlatformAndBoard(
  workspace: string,
  data: IConfigServerModel
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const createDiag = (
    code: ArduinoDiagnostic.Error | ArduinoDiagnostic.Information,
    message: string
  ) => {
    diagnostics.push(
      ArduinoDiagnostic.createProjectDiagnostic(
        workspace,
        undefined,
        code,
        message,
        {}
      )
    );
  };
  let exec: IArduinoExec = ArduinoCli.instance().coreList("--all");

  if (exec.status) {
    let boardFoud: Server.IArduinoBoard | undefined;
    const platforms: Server.IArduinoPlatform[] = exec.data;
    const platform: Server.IArduinoPlatform | undefined = platforms.find(
      (platform: Server.IArduinoPlatform | undefined) => {
        const board: Server.IArduinoBoard | undefined = platform?.boards.find(
          (board: Server.IArduinoBoard) => {
            return board.fqbn === data.board;
          }
        );
        if (board) {
          boardFoud = board;
        }

        return platform;
      }
    );

    if (!boardFoud) {
      createDiag(ArduinoDiagnostic.Error.E002_INVALID_BOARD, data.board);
    } else if (platform) {
      exec = ArduinoCli.instance().coreList("");
      const platforms: Server.IArduinoPlatform[] = exec.data;
      const target: Server.IArduinoPlatform | undefined = platforms.find(
        (platform: Server.IArduinoPlatform | undefined) => {
          return platform?.id === platform?.id;
        }
      );
      if (!target || !target.installed) {
        createDiag(
          ArduinoDiagnostic.Error.E0031_PLATFORM_NOT_INSTALED,
          platform.id
        );
      } else if (target.latest !== platform.installed) {
        createDiag(
          ArduinoDiagnostic.Information.I001_PLATFORM_VERSION_NOT_LATEST,
          `Installed: ${platform.installed} Latest: ${platform.latest}`
        );
      }
    }
  } else {
    diagnostics.push(
      ArduinoDiagnostic.createProjectDiagnostic(
        workspace,
        undefined,
        ArduinoDiagnostic.Error.E099_ARDUIONO_CLI,
        exec.reason,
        {}
      )
    );
  }
  // if (release) {
  //   await ArduinoCli.instance()
  //     .checkEnvironment(data.cliVersion)
  //     .then((diagnostic: Diagnostic | undefined) => {
  //       if (diagnostic) {
  //         diagnostics.push(diagnostic);
  //       }
  //     });
  // } else {
  //   );
  // }

  return Promise.resolve(diagnostics);
}
