import fse = require("fs-extra");
import { Diagnostic } from "vscode-languageserver/node";
import Ajv, { ErrorObject, JSONSchemaType } from "ajv";
import { configSchema } from "../modes/language-modes";
import { IConfigServerModel } from "..";
import { ArduinoDiagnostic } from "../arduino-diagnostic";

export const COMMAND_VALID_MODEL: string = "arduinoExplorer.validModel";

export function doValidModel(workspace: string): Diagnostic[] {
  const filename: string = `${workspace}/.vscode/aclabarduino.json`;
  const content: string = fse.readFileSync(filename).toString();
  const result: Diagnostic[] = [];

  const ajv = new Ajv();
  //const ajv = new Ajv2019();
  const schema: JSONSchemaType<IConfigServerModel> = JSON.parse(configSchema);
  const validate = ajv.compile(schema);
  const data = JSON.parse(content);

  if (!validate(data)) {
    console.log(validate.errors);
    validate.errors?.forEach((value: ErrorObject) => {
      result.push(
        ArduinoDiagnostic.createProjectDiagnostic(
          workspace,
          ArduinoDiagnostic.Error.E005_INVALID_CONTENT,
          `${value.keyword}: ${value.message} [${JSON.stringify(value.params)}]`
        )
      );
    });
  }

  return result;
}
