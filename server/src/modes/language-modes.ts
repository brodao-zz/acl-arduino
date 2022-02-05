import fse = require("fs-extra");
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  Command,
  CompletionItem,
  CompletionItemTag,
  CompletionList,
  Diagnostic,
  InsertTextFormat,
  MarkedString,
} from "vscode-languageserver/node";
import {
  Range,
  getLanguageService as getJsonLanguageService,
  LanguageService as JsonLanguageService,
  JSONPath,
  CompletionsCollector,
} from "vscode-json-languageservice";
import {
  getLanguageModelCache,
  LanguageModelCache,
} from "./language-model-cache";
import { getDocumentRegions, JsonDocumentRegions } from "./regions-support";
import { getConfigMode } from "./config-mode";
const path = require("path");
import { debug } from "console";
import { ArduinoGithub } from "../arduino-github";
import { Server } from "../server-interf";
import {
  createBoardDocumentation,
  createPlatformDocumentation,
  createPlatformVersionDocumentation,
  createReleaseDocumentation,
} from "./completion-item-documentation";
import { ArduinoCli } from "../arduino-cli";

export interface LanguageMode {
  getId(): string;
  onDocumentRemoved(document: TextDocument): void;
  dispose(): void;
  doValidation?: (document: TextDocument) => Thenable<Diagnostic[]>;
  doComplete?: (
    document: TextDocument,
    position: Position
  ) => Thenable<CompletionList>;
  doResolve?(item: CompletionItem): Thenable<CompletionItem>;
  //doSignatureHelp(document: TextDocument, position: Position): any;
}

export interface LanguageModes {
  getModeAtPosition(
    document: TextDocument,
    position: Position
  ): LanguageMode | undefined;
  getModesInRange(document: TextDocument, range: Range): LanguageModeRange[];
  getAllModes(): LanguageMode[];
  getAllModesInDocument(document: TextDocument): LanguageMode[];
  getMode(languageId: string): LanguageMode | undefined;
  onDocumentRemoved(document: TextDocument): void;
  dispose(): void;
}

export interface LanguageModeRange extends Range {
  mode: LanguageMode | undefined;
}

const jsonSchemaUri = "aclab://server/aclabarduino.schema.json";
const jsonSchema = fse
  .readFileSync(path.join(__dirname, "../../schema/aclabarduino.schema.json"))
  .toString();

const jsonBoardSchemaUri = "aclab://server/board.schema.json";
const jsonBoardSchema = fse
  .readFileSync(path.join(__dirname, "../../schema/board.schema.json"))
  .toString();

export function getLanguageModes(): LanguageModes {
  const jsonLanguageService: JsonLanguageService = getJsonLanguageService({
    schemaRequestService: (uri) => {
      if (uri === jsonSchemaUri) {
        return Promise.resolve(jsonSchema);
      }
      if (uri === jsonBoardSchemaUri) {
        return Promise.resolve(jsonBoardSchema);
      }

      return Promise.reject(`Unabled to load schema at ${uri}`);
    },
    contributions: [
      {
        getInfoContribution: (
          uri: string,
          location: JSONPath
        ): Thenable<MarkedString[]> => {
          debug("contributions.getInfoContribution");
          return Promise.resolve([]);
        },
        collectPropertyCompletions: (
          uri: string,
          location: JSONPath,
          currentWord: string,
          addValue: boolean,
          isLast: boolean,
          result: CompletionsCollector
        ): Thenable<any> => {
          debug("contributions.collectPropertyCompletions %s", currentWord);
          return Promise.resolve([]);
        },
        collectValueCompletions: (
          uri: string,
          location: JSONPath,
          propertyKey: string,
          result: CompletionsCollector
        ): Thenable<any> => {
          debug("contributions.collectValueCompletions", propertyKey);

          if (propertyKey) {
            return Promise.resolve(
              doCollectValueCompletions(location, propertyKey, result)
            );
          }

          return Promise.resolve([]);
        },
        collectDefaultCompletions: (
          uri: string,
          result: CompletionsCollector
        ): Thenable<any> => {
          debug("contributions.collectDefaultCompletions ");
          return Promise.resolve([]);
        },
        resolveCompletion: (item: CompletionItem): Thenable<CompletionItem> => {
          debug(
            `"contributions.resolveCompletion " ${item.label} ${item.kind} `
          );

          return Promise.resolve(undefined);
        },
      },
    ],
  });

  // associate `*.data.json` with the `foo://server/data.schema.json` schema
  jsonLanguageService.configure({
    allowComments: true,
    schemas: [{ fileMatch: ["aclabarduino.json"], uri: jsonSchemaUri }],
  });

  const documentRegions = getLanguageModelCache<JsonDocumentRegions>(
    10,
    60,
    (document) => getDocumentRegions(jsonLanguageService, document)
  );

  let modelCaches: LanguageModelCache<any>[] = [];
  modelCaches.push(documentRegions);

  let modes = Object.create(null);
  modes["json"] = getConfigMode(jsonLanguageService);

  return {
    getModeAtPosition(
      document: TextDocument,
      position: Position
    ): LanguageMode | undefined {
      const languageId = documentRegions
        .get(document)
        .getLanguageAtPosition(position);
      if (languageId) {
        return modes[languageId];
      }
      return undefined;
    },
    getModesInRange(document: TextDocument, range: Range): LanguageModeRange[] {
      return documentRegions
        .get(document)
        .getLanguageRanges(range)
        .map((r: any) => {
          return <LanguageModeRange>{
            start: r.start,
            end: r.end,
            mode: r.languageId && modes[r.languageId],
          };
        });
    },
    getAllModesInDocument(document: TextDocument): LanguageMode[] {
      const result = [];
      for (const languageId of documentRegions
        .get(document)
        .getLanguagesInDocument()) {
        const mode = modes[languageId];
        if (mode) {
          result.push(mode);
        }
      }
      return result;
    },
    getAllModes(): LanguageMode[] {
      const result = [];
      for (const languageId in modes) {
        const mode = modes[languageId];
        if (mode) {
          result.push(mode);
        }
      }
      return result;
    },
    getMode(languageId: string): LanguageMode {
      return modes[languageId];
    },
    onDocumentRemoved(document: TextDocument) {
      modelCaches.forEach((mc) => {
        mc.onDocumentRemoved(document);
      });

      for (const mode in modes) {
        modes[mode].onDocumentRemoved(document);
      }
    },
    dispose(): void {
      modelCaches.forEach((mc) => mc.dispose());
      modelCaches = [];
      for (const mode in modes) {
        modes[mode].dispose();
      }
      modes = {};
    },
  };
}

async function doCollectValueCompletions(
  location: JSONPath,
  propertyKey: string,
  result: CompletionsCollector
): Promise<void> {
  let completionItems: CompletionItem[] = [];

  if (propertyKey == "cliVersion") {
    completionItems = await doCollectValuesCliVersion();
  } else if (propertyKey == "board") {
    completionItems = await doCollectValuesBoard();
    //} else if (propertyKey == "platform") {
    //   completionItems = await doCollectValuesPlatform();
    // } else if (propertyKey == "platformVersion") {
    //   //completionItems = await doCollectValuesPlatformVersion();
  }

  completionItems.forEach((completionItem: CompletionItem) => {
    result.add(completionItem);
  });

  return;
}

async function doCollectValuesCliVersion(): Promise<CompletionItem[]> {
  const completionItems: CompletionItem[] = [];
  let cnt: number = 0;
  debug("doCollectValuesCliVersion");

  const addItem = (item: Server.IArduinoRelease) => {
    const ci: CompletionItem = CompletionItem.create(item.name);
    ci.label = item.name;
    ci.insertText = `"${item.name}"`;
    ci.documentation = createReleaseDocumentation(item);
    ci.sortText = `${cnt.toString()}-${item.tag_name}`;

    cnt++;
    //ci.command = Command.create("Install", "aclabarduino.");
    //ci.textEdit =
    //ci.insertTextMode = InsertTextMode.asIs;

    return ci;
  };

  const releases: Server.IArduinoRelease[] = await ArduinoGithub.getReleases();
  releases.forEach((release: Server.IArduinoRelease) => {
    completionItems.push(addItem(release));
  });

  return completionItems;
}

async function _doCollectValuesBoard(): Promise<CompletionItem[]> {
  const completionItems: CompletionItem[] = [];

  const ci: CompletionItem = CompletionItem.create("Select board");
  //ci.label = item.name;
  ci.insertText = "{}";
  //ci.documentation = createReleaseDocumentation(item);
  //ci.sortText = `${cnt.toString()}-${item.tag_name}`;
  ci.command = Command.create("Install", "aclabExplorer.selectBoard");
  //ci.textEdit =
  //ci.insertTextMode = InsertTextMode.asIs;

  //const releases: Server.IArduinoRelease[] = await ArduinoGithub.getReleases();
  completionItems.push(ci);

  const ci2: CompletionItem = CompletionItem.create("Select default");
  //ci.label = item.name;
  ci2.insertText = "{ platform: ${1:platform} }";
  //ci.documentation = createReleaseDocumentation(item);
  //ci.sortText = `${cnt.toString()}-${item.tag_name}`;
  //ci.command = Command.create("Default", "aclabExplorer.selectBoard");
  //ci.textEdit =
  //ci.insertTextMode = InsertTextMode.asIs;
  completionItems.push(ci2);

  return completionItems;
}

async function doCollectValuesBoard(): Promise<CompletionItem[]> {
  const completionItems: CompletionItem[] = [];

  const addItem = (
    platform: Server.IArduinoPlatform,
    board: Server.IArduinoBoard
  ) => {
    const ci: CompletionItem = CompletionItem.create(platform.name);

    ci.label = board.name;
    ci.insertText = `"${board.fqbn}"`;
    ci.documentation = createBoardDocumentation(platform, board);
    ci.tags = [CompletionItemTag.Deprecated];
    //ci.sortText = `${platform.id}`;
    //ci.insertTextFormat = InsertTextFormat.
    return ci;
  };

  // ArduinoCli.instance()
  //   .coreList("")
  //   .data.forEach((platform: Server.IArduinoPlatform) => {
  //     completionItems.push(addItem(platform));
  //   });

  ArduinoCli.instance()
    .coreList("")
    .data.forEach((platform: Server.IArduinoPlatform) => {
      completionItems.push(
        ...platform.boards.map((board: Server.IArduinoBoard) =>
          addItem(platform, board)
        )
      );
    });

  return completionItems;
}

async function doCollectValuesPlatformVersion(
  platform: Server.IArduinoPlatform
): Promise<CompletionItem[]> {
  const completionItems: CompletionItem[] = [];

  const addItem = (item: string) => {
    const ci: CompletionItem = CompletionItem.create(item);
    ci.label = item;
    ci.insertText = `"${item}"`;
    ci.documentation = createPlatformVersionDocumentation(platform, item);
    ci.sortText = `${item}`;

    return ci;
  };

  platform.versions.forEach((version: string) => {
    completionItems.push(addItem(version));
  });

  return completionItems;
}
