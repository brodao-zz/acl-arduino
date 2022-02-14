import path = require("path");
import jsonMerger = require("json-merger");
import { IScenarioData } from "./page-objects/interface-po";

const TEST_RESOURCE = path.join(__dirname, "..", "..");
const scenarioDefault: string = path.join(
  TEST_RESOURCE,
  "scenario",
  "default.scenario.json"
);
let values: any;
let valuesFile: any;
let scenarioFile: string = scenarioDefault;

if (process.env.SCENARIO) {
  scenarioFile = path.join(
    TEST_RESOURCE,
    "scenario",
    process.env.SCENARIO.trim() + ".scenario.json"
  );

  const valuesDefault = jsonMerger.mergeFiles([scenarioDefault]);
  valuesFile = jsonMerger.mergeFiles([scenarioFile]);
  values = jsonMerger.mergeObjects([valuesDefault, valuesFile]);
  values.description = valuesFile.description;
} else {
  values = jsonMerger.mergeFiles([scenarioFile]);
}

console.log("--------------------------------------");
console.log(`Scenario: ${values.name} (${path.basename(scenarioFile)})`);
console.log(`\t${values.description.join("\n\t")}`);

if (valuesFile) {
  // Processa variáveis de substitução
  //procSubstitutionVariable(valuesFile);

  console.log(JSON.stringify(valuesFile, null, "  "));
}
console.log("--------------------------------------");

// Processa variáveis de substitução
//procSubstitutionVariable(values);

export const SCENARIO: IScenarioData = values;

// Processa variáveis de substitução
// function procSubstitutionVariable(object: any) {
//   Object.keys(values.variables).forEach((variable: string) => {
//     const value: string = valueByOS(variable);

//     Object.keys(object).forEach((key: string) => {
//       const element = object[key];

//       if (typeof element !== "string") {
//         procSubstitutionVariable(object[key]);
//       } else {
//         object[key] = object[key].replaceAll(`\${${variable}}`, value);
//       }
//     });
//   });
// }

// function valueByOS(name: string): string {
//   let result: string = name;

//   if (process.platform === "win32") {
//     result = values.variables[name].windows;
//   } else if (process.platform === "linux") {
//     result = values.variables[name].linux;
//   } else if (process.platform === "darwin") {
//     result = values.variables[name].mac;
//   }

//   return result;
// }
