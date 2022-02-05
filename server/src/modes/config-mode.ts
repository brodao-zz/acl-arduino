import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionList,
  Diagnostic,
} from "vscode-languageserver/node";
import {
  LanguageService as JsonLanguageService,
  JSONDocument,
} from "vscode-json-languageservice";
import { LanguageMode } from "./language-modes";
import { doValidConfigDocument } from "../valid-config-document";

export interface IConfigMode {}

export function getConfigMode(
  jsonLanguageService: JsonLanguageService
): LanguageMode {
  return {
    getId: () => {
      return "json";
    },
    doResolve(item: CompletionItem): Thenable<CompletionItem> {
      const completionItem: Thenable<CompletionItem> =
        jsonLanguageService.doResolve(item);

      return completionItem;
    },
    async doValidation(textDocument: TextDocument): Promise<Diagnostic[]> {
      const jsonDocument: JSONDocument =
        jsonLanguageService.parseJSONDocument(textDocument);
      const diagnostics: Diagnostic[] = await jsonLanguageService.doValidation(
        textDocument,
        jsonDocument
      );

      let diagnosticsAux: Diagnostic[] = await doValidConfigDocument(
        jsonLanguageService,
        textDocument,
        jsonDocument
      );

      diagnostics.push(...diagnosticsAux);

      // , {a
      //   comments: "error",
      //   trailingCommas: "error",
      //   schemaValidation: "error",
      //   schemaRequest: "error",
      // });

      return diagnostics;
    },
    doComplete(
      textDocument: TextDocument,
      position: Position
    ): Thenable<CompletionList> {
      const jsonDocument = jsonLanguageService.parseJSONDocument(textDocument);
      const completionList: Thenable<CompletionList> =
        jsonLanguageService.doComplete(textDocument, position, jsonDocument);

      return completionList;
    },
    onDocumentRemoved(_document: TextDocument) {
      /* nothing to do */
    },
    dispose() {
      /* nothing to do */
    },
  };
}
