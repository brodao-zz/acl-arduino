import fse = require("fs-extra");
import * as Ajv from "ajv";
import { Diagnostic } from "vscode-languageserver/node";
import { ArduinoDiagnostic } from "../arduino-diagnostic";
import { IConfigServerModel, Server } from "..";
import { ArduinoGithub } from "../arduino-github";
import { ArduinoCli } from "../arduino-cli";
import { configSchema } from "../modes/language-modes";

export const COMMAND_VALID_MODEL: string = "arduinoExplorer.validModel";

export function doValidModel(workspace: string): Promise<Diagnostic[]> {
  const filename: string = `${workspace}/.vscode/aclabarduino.json`;
  const content: any = fse.readJSONSync(filename);

  return doValidContentModel(workspace, content);
}

export async function doValidContentModel(
  workspace: string,
  data: IConfigServerModel
): Promise<Diagnostic[]> {
  const result: Diagnostic[] = [];

  const ajv = new Ajv.default({ allErrors: true, verbose: true });
  const schema: Ajv.JSONSchemaType<IConfigServerModel> =
    JSON.parse(configSchema);
  const validate = ajv.compile(schema);

  if (!validate(data)) {
    console.log(validate.errors);
    validate.errors?.forEach((value: Ajv.ErrorObject) => {
      result.push(
        ArduinoDiagnostic.createProjectDiagnostic(
          workspace,
          ArduinoDiagnostic.Error.E005_INVALID_CONTENT,
          `${value.keyword.charAt(0).toUpperCase()}${value.keyword.substring(
            1
          )}: ${value.message}` //[${JSON.stringify(value.params)}]
        )
      );
    });
  } else {
    result.push(...(await doValidCliVersion(workspace, data)));
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
        ArduinoDiagnostic.Error.E001_INVALID_CLI_VERSION,
        "cliVersion invalid or unsupported."
      )
    );
  }

  return Promise.resolve(diagnostics);
}
