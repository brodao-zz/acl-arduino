import path = require("path");
import fse = require("fs-extra");
import {
  CompletionList,
  createConnection,
  Diagnostic,
  InitializeParams,
  MessageType,
  ProposedFeatures,
  ShowDocumentParams,
  ShowMessageParams,
  ShowMessageRequestParams,
  TextDocuments,
  TextDocumentSyncKind,
  WorkspaceFolder,
  CodeActionParams,
  CodeAction,
  CompletionItem,
  DidChangeConfigurationNotification,
  ExecuteCommandOptions,
  ExecuteCommandParams,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ArduinoCli } from "./arduino-cli";
import { ArduinoAction } from "./arduino-action";
import { getLanguageModes, LanguageModes } from "./modes/language-modes";
import { fileURLToPath } from "url";
import {
  getCodeActionProvider,
  provideCodeActions,
} from "./code-action-provider";
import { ACLLogger } from "./logger";
import { ACLCache } from "./cache";
import { getExecuteCommandProvider } from "./command-provider";

const homedir: string = require("os").homedir();
export const ACL_HOME: string = path.join(homedir, ".aclabarduino");

const packageJSON: any = fse.readJSONSync(
  path.resolve(__dirname, "..", "package.json")
);

const appInfo: ACLLogger.IAppInfo = {
  name: packageJSON.name,
  displayName: packageJSON.displayName,
  version: packageJSON.version,
  description: packageJSON.description,
  url: packageJSON.repository.url,
  getShortName: () => {
    return packageJSON.name.split("/").reverse()[0];
  },
};

const config: Partial<ACLLogger.ILoggerConfig> = {
  appInfo: appInfo,
};

process.argv.forEach((element: string, index: number, argv: string[]) => {
  if (element == "--log-level") {
    config.logLevel = argv[index + 1] as ACLLogger.LogLevel;
  } else if (element == "--log-to-file") {
    config.logToFile = true; //argv[index + 1] === "true";
  } else if (element == "--no-show-banner") {
    config.showBanner = false; //argv[index + 1] === "true";
  } else if (element == "--trace-level") {
    //config. = true; //argv[index + 1] === "true";
  }
});
const _logger = ACLLogger.createLogger(appInfo.name, config);

export const connection = createConnection(ProposedFeatures.all);
_logger.addConnection(connection);

let workspaceFolder: WorkspaceFolder | null;

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let languageModes: LanguageModes;
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((_params: InitializeParams) => {
  _logger.debug("onInitialize", _params);
  const capabilities = _params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );

  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  languageModes = getLanguageModes();

  documents.onDidOpen((e) => {
    _logger.debug("documents.onDidOpen");

    validateTextDocument(e.document);
  });

  documents.onDidClose((e) => {
    _logger.debug("documents.onDidClose");
    languageModes.onDocumentRemoved(e.document);
  });

  connection.onShutdown(() => {
    _logger.debug("onShutdown");
    languageModes.dispose();
  });

  workspaceFolder = toUri(
    _params.workspaceFolders
      .filter((value: WorkspaceFolder) => {
        return value.uri == _params.initializationOptions.workspaceFolder;
      })
      .pop()
  );
  ACLCache.cacheDir = path.join(workspaceFolder.uri, ".vscode", ".acl-cache");
  _logger.setConfig({ label: workspaceFolder.name });

  ArduinoCli.instance({
    workspaceFolder: workspaceFolder,
    debug: config.logLevel === "debug",
    verbose: config.logLevel === "verbose",
    logFile: config.logLevel === "debug",
  });

  _logger.info(
    `Started and initialize received. WS Count: ${_params.workspaceFolders.length}`
  );

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // 			textDocumentSync: {
      // 	openClose: true,
      // 	change: TextDocumentSyncKind.None
      // }

      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: false,
      },
      codeActionProvider: getCodeActionProvider(),
      executeCommandProvider: getExecuteCommandProvider(),

      // signatureHelpProvider: {
      //   triggerCharacters: ["@"],
      // },
    },
  };
});

connection.onInitialized(() => {
  const release: string = ArduinoCli.instance().getCurrentVersion();
  ArduinoCli.instance()
    .checkEnvironment(release)
    .then((diagnostics: ShowMessageRequestParams) => {
      if (diagnostics) {
        doSendShowMessageRequest(diagnostics);
      }
    });

  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});

connection.onDidChangeWatchedFiles((_change) => {
  _logger.debug("We received an file change event");
  // this._watchFile = fse.watchFile(runOptions.configFile, (curr, prev) => {
  //   console.debug(">>>>>", [runOptions.configFile, curr, prev]);

  //   if (curr.uid == 0 && curr.mtimeMs == 0) {
  //     //deletado
  //     this._watchFile.unref();
  //     this._instance = undefined;
  //   } else if (curr.mtimeMs > prev.mtimeMs) {
  //     //novo ou modificado
  //     this._instance = undefined;
  //   }
  // });
});

connection.onDidChangeConfiguration((_change) => {
  // Revalidate all open text documents
  _logger.debug("onDidChangeConfiguration");
  _logger.debug(_change);

  documents.all().forEach(validateTextDocument);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  _logger.debug("onDidChangeContent");

  validateTextDocument(change.document);
});

// connection.onSignatureHelp((signatureHelpParms) => {
//   _logger.debug("onSignatureHelp");
//   let document = documents.get(signatureHelpParms.textDocument.uri);
//   let mode = languageModes.getModeAtPosition(
//     document,
//     signatureHelpParms.position
//   );
//   // if (mode && mode.doSignatureHelp) {
//   //   return mode.doSignatureHelp(document, signatureHelpParms.position);
//   // }
//   return null;
// });

connection.onCompletion((textDocumentPosition, token) => {
  _logger.debug("onCompletion");

  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) {
    return null;
  }

  const mode = languageModes.getModeAtPosition(
    document,
    textDocumentPosition.position
  );
  if (!mode || !mode.doComplete) {
    return CompletionList.create();
  }
  const doComplete = mode.doComplete!;

  return doComplete(document, textDocumentPosition.position);
});

connection.onCodeAction((params: CodeActionParams) => {
  _logger.debug("onCodeAction", JSON.stringify(params));

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  return provideCodeActions(document, params);
});

connection.onExecuteCommand((params: ExecuteCommandParams) => {
  _logger.debug("onExecuteCommand", JSON.stringify(params));
});

connection.onShutdown(() => {
  _logger.debug("onShutdown");
});

connection.onExit(() => {
  _logger.debug("onExit");
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  _logger.debug("onCompletionResolve => " + JSON.stringify(item));

  //   if (item.data === 1) {
  //     (item.detail = "TypeScript details"),
  //       (item.documentation = "TypeScript documentation");
  //   } else if (item.data === 2) {
  //     (item.detail = "JavaScript details"),
  //       (item.documentation = "JavaScript documentation");
  //   } else if (item.kind === 10) {
  //     (item.detail = "Versão do Arduino-CLI"),
  //       // (item.command = Command.create(
  //       //   "Selecionar",
  //       //   "aclabarduino.initialize",
  //       //   1,
  //       //   2,
  //       //   3
  //       // )),
  //       (item.documentation = "Arduino-CLI documentation");
  //   }

  return item;
});

//connection.onCodeLens((item: any /*CodeLensParams*/, codeLens: CodeLens[]): CodeLens[] => {
//   _logger.debug("onCodeLens");

//   return [];
// })

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

function _doSendShowMessage(request: ShowMessageParams) {
  _logger.debug(request.type, request.message);
  connection.sendNotification("window/showMessage", request);
}

function doSendInfoMessage(message: string) {
  _doSendShowMessage({ type: MessageType.Info, message: message });
}

function doSendErrorMessage(message: string) {
  _doSendShowMessage({ type: MessageType.Error, message: message });
}

function doSendWarningMessage(message: string) {
  _doSendShowMessage({ type: MessageType.Warning, message: message });
}

function doSendLogMessage(message: string) {
  _doSendShowMessage({ type: MessageType.Log, message: message });
}

export function doSendShowMessageRequest(request: ShowMessageRequestParams) {
  connection
    .sendRequest("window/showMessageRequest", request)
    .then((resp: any) => {
      if (resp && resp.returnParams) {
        ArduinoAction.processResult(
          ArduinoCli.instance(),
          resp.returnParams
        ).then(
          (message: string) => {
            doSendInfoMessage(message);
          },
          (message: string) => {
            doSendErrorMessage(message);
          }
        );
      }
    })
    .catch((reason: any) => {
      doSendErrorMessage(reason);
    });
}

function doSendShowDocumentRequest(request: ShowDocumentParams) {
  connection
    .sendRequest("window/showDocument", request)
    .then((resp: any) => {
      if (resp && resp.success) {
        _logger.info("Document open");
      } else {
        _logger.error("Document not open");
      }
    })
    .catch((reason: any) => {
      _logger.error(reason);
    });
}

function toUri(workspace: WorkspaceFolder): WorkspaceFolder {
  return {
    name: workspace.name,
    uri: fileURLToPath(workspace.uri),
  };
}

function validateTextDocument(textDocument: TextDocument) {
  try {
    const version: number = textDocument.version;

    if (textDocument.languageId === "json") {
      const modes = languageModes.getAllModesInDocument(textDocument);
      const latestTextDocument: TextDocument = documents.get(textDocument.uri);
      if (latestTextDocument && latestTextDocument.version === version) {
        // check no new version has come in after in after the async op
        modes.forEach(async (mode) => {
          if (mode.doValidation) {
            mode
              .doValidation(latestTextDocument)
              .then((diagnostics: Diagnostic[]) => {
                connection.sendDiagnostics({
                  uri: latestTextDocument.uri,
                  diagnostics,
                });
              });
          }
        });
      }
    }
  } catch (e: any) {
    _logger.error(`Error while validating ${textDocument.uri}`, String(e));
  }
}
