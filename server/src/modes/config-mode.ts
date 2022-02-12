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
        jsonDocument,
        {
          comments: "ignore",
          trailingCommas: "ignore",
          schemaValidation: "warning",
          schemaRequest: "warning",
        }
      );

      if (diagnostics.length === 0) {
        let diagnosticsAux: Diagnostic[] = await doValidConfigDocument(
          jsonLanguageService,
          textDocument,
          jsonDocument
        );

        diagnostics.push(...diagnosticsAux);
      }

      return diagnostics;
    },
    doComplete(
      textDocument: TextDocument,
      position: Position
    ): Thenable<CompletionList> {
      const jsonDocument = jsonLanguageService.parseJSONDocument(textDocument);
      let completionList: Thenable<CompletionList | null> =
        jsonLanguageService.doComplete(textDocument, position, jsonDocument);

      if (!completionList) {
        completionList = Promise.resolve(CompletionList.create());
      }

      return completionList as Thenable<CompletionList>;
    },
    onDocumentRemoved(_document: TextDocument) {
      /* nothing to do */
    },
    dispose() {
      /* nothing to do */
    },
  };
}
