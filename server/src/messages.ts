import { _, _Connection } from "vscode-languageserver/node";
import { ArduinoCli } from "./arduino-cli";
import { ArduinoGithub } from "./arduino-github";

export function registerMessages(
  connection: _Connection<_, _, _, _, _, _, _>,
  arduinoCli: ArduinoCli
) {
  connection.onRequest("$aclab/getReleases", () => {
    return ArduinoGithub.getReleases();
  });

  connection.onRequest("$aclab/coreList", (param: string) => {
    return arduinoCli.coreList(param);
  });

  connection.onRequest("$aclab/coreInstall", (params: string[]) => {
    return arduinoCli.coreInstall(params[0], params[1]);
  });

  connection.onRequest("$aclab/coreUpdateIndex", () => {
    return arduinoCli.coreUpdateIndex();
  });

  connection.onRequest("$aclab/configAdd3rdPartyUrl", (param: string) => {
    return arduinoCli.configAdd3rdPartyUrl(param);
  });

  connection.onRequest("$aclab/validate3rdPartyUrl", (param: string) => {
    return arduinoCli.validate3rdPartyUrl(param);
  });

  connection.onRequest("$aclab/configRemove3thPartyUrl", (param: string) => {
    return arduinoCli.configRemove3thPartyUrl(param);
  });

  connection.onRequest("$aclab/boardList", () => {
    return arduinoCli.boardList();
  });

  ////////////////////////////////////////////////////////////////////
  // connection.onRequest("$aclab/boardList", (params: any[]) => {
  //   return arduinoCli.getBoardList();
  // });

  // connection.onRequest("$aclab/getConfig", (params: any[]) => {
  //   return arduinoCli.getConfigDump();
  // });

  // connection.onRequest("$aclab/getPorts", (params: any[]) => {
  //   return arduinoCli.getPorts();
  // });

  // connection.onRequest("$aclab/getOutdated", (params: any[]) => {
  //   return arduinoCli.getOutdated();
  //});
}

//Internal Functions

// function getClientConfig(context: ExtensionContext) {
//   function resolveVariablesInString(value: string) {
//     let rootPath: string = vscode.workspace.rootPath || process.cwd();
//     return value.replace("${workspaceFolder}", rootPath);
//   }

//   function resolveVariablesInArray(value: any[]) {
//     return value.map((v) => resolveVariables(v));
//   }

//   function resolveVariables(value: any) {
//     if (typeof value === "string") {
//       return resolveVariablesInString(value);
//     }
//     if (Array.isArray(value)) {
//       return resolveVariablesInArray(value);
//     }
//     return value;
//   }

//   let configMapping = [["launchArgs", "launch.args"]];
//   let clientConfig = {};
//   let config = workspace.getConfiguration("totvsLanguageServer");

//   for (let prop of configMapping) {
//     let value = config.get(prop[1]);

//     if (value !== undefined && value !== null) {
//       //if(prop[1] === 'launch.command') {
//       //	if (process.platform ==== "win32"){
//       //		value = dir + "/node_modules/@totvs/tds-ls/bin/windows/" + value + ".exe";
//       //	}
//       //	else if (process.platform ==== "linux"){
//       //		value = dir + "/node_modules/@totvs/tds-ls/bin/linux/" + value;
//       //		chmodSync(value.toString(),'755');
//       //	}
//       //}
//       let subprops = prop[0].split(".");
//       let subconfig = clientConfig;
//       for (let subprop of subprops.slice(0, subprops.length - 1)) {
//         if (!subconfig.hasOwnProperty(subprop)) {
//           subconfig[subprop] = {};
//         }
//         subconfig = subconfig[subprop];
//       }
//       subconfig[subprops[subprops.length - 1]] = resolveVariables(value);
//     }
//   }

//   // Provide a default cache directory if it is not present. Insert next to
//   // the project since if the user has an SSD they most likely have their
//   // source files on the SSD as well.
//   //let cacheDir = '${workspaceFolder}/.vscode/cquery_cached_index/';

//   //Processo de cache desabilitado até que seja corretamente implementado pelo LS
//   //let cacheDir = '${workspaceFolder}/.vscode/totvs_cached_index/';
//   //clientConfig.cacheDirectory = resolveVariables(cacheDir);
//   //config.update(kCacheDirPrefName, cacheDir, false /*global*/);

//   return clientConfig;
// }

// function displayCodeLens(
//   document: TextDocument,
//   allCodeLens: CodeLens[],
//   codeLensDecoration: TextEditorDecorationType
// ) {
//   for (let editor of window.visibleTextEditors) {
//     if (editor.document !== document) {
//       continue;
//     }

//     let opts: DecorationOptions[] = [];

//     for (let codeLens of allCodeLens) {
//       // FIXME: show a real warning or disable on-the-side code lens.
//       if (!codeLens.isResolved) {
//         console.error(
//           localize(
//             "tds.webview.totvsLanguegeClient.codeLensNotResolved",
//             "Code lens is not resolved"
//           )
//         );
//       }

//       // Default to after the content.
//       let position = codeLens.range.end;

//       // If multiline push to the end of the first line - works better for
//       // functions.
//       if (codeLens.range.start.line !== codeLens.range.end.line) {
//         position = new Position(codeLens.range.start.line, 1000000);
//       }

//       let range = new Range(position, position);
//       let title = codeLens.command === undefined ? "" : codeLens.command.title;
//       let opt: DecorationOptions = {
//         range: range,
//         renderOptions: { after: { contentText: " " + title + " " } },
//       };

//       opts.push(opt);
//     }

//     editor.setDecorations(codeLensDecoration, opts);
//   }
// }

// function provideDocumentRangeFormattingEdits(
//   this: void,
//   document: TextDocument,
//   range: Range,
//   options: FormattingOptions,
//   token: CancellationToken,
//   next: ProvideDocumentRangeFormattingEditsSignature
// ): ProviderResult<TextEdit[]> {
//   return next(document, range, options, token);
// }

// function provideDocumentFormattingEdits(
//   this: void,
//   document: TextDocument,
//   options: FormattingOptions,
//   token: CancellationToken,
//   next: ProvideDocumentFormattingEditsSignature
// ): ProviderResult<TextEdit[]> {
//   return next(document, options, token);
// }

// function provideOnTypeFormatting(
//   document: TextDocument,
//   position: Position,
//   ch: string,
//   options: FormattingOptions,
//   token: CancellationToken,
//   next: ProvideOnTypeFormattingEditsSignature
// ): ProviderResult<TextEdit[]> {
//   //const result: vscode.TextEdit[] = [];

//   return next(document, position, ch, options, token);
// }
