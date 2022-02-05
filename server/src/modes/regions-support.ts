import { Diagnostic } from "vscode";
import { JSONDocument, LanguageService } from "vscode-json-languageservice";
import {
  Range,
  Position,
  TextDocument,
} from "vscode-languageserver-textdocument";

export interface LanguageRange extends Range {
  languageId: string | undefined;
}

export interface JsonDocumentRegions {
  getDocument(languageId: string): TextDocument;
  getLanguageRanges(range: Range): LanguageRange[];
  getLanguageAtPosition(position: Position): string | undefined;
  getLanguagesInDocument(): string[];
}

interface EmbeddedRegion {
  languageId: string | undefined;
  start: number;
  end: number;
}

export function getDocumentRegions(
  languageService: LanguageService,
  document: TextDocument
): JsonDocumentRegions {
  const parsed: JSONDocument = languageService.parseJSONDocument(document);
  const regions: EmbeddedRegion[] = [];

  regions.push({
    languageId: "json",
    start: parsed.root.offset,
    end: parsed.root.offset + parsed.root.length,
  });

  return {
    getLanguageRanges: (range: Range) =>
      getLanguageRanges(document, regions, range),
    getDocument: (languageId: string) =>
      getDocument(document, regions, languageId),
    getLanguageAtPosition: (position: Position) =>
      getLanguageAtPosition(document, regions, position),
    getLanguagesInDocument: () => getLanguagesInDocument(document, regions),
  };
}

function getLanguageRanges(
  document: TextDocument,
  regions: EmbeddedRegion[],
  range: Range
): LanguageRange[] {
  const result: LanguageRange[] = [];
  let currentPos: number = range ? document.offsetAt(range.start) : 0;
  let currentOffset: number = range ? document.offsetAt(range.start) : 0;
  const endOffset: number = range
    ? document.offsetAt(range.end)
    : document.getText().length;

  result.push({
    languageId: "json",
    start: { line: currentPos, character: 0 },
    end: { line: currentPos, character: 0 },
  });

  return result;
}

function getLanguagesInDocument(
  _document: TextDocument,
  regions: EmbeddedRegion[]
): string[] {
  const result = [];
  for (const region of regions) {
    if (region.languageId && result.indexOf(region.languageId) === -1) {
      result.push(region.languageId);
      if (result.length === 3) {
        return result;
      }
    }
  }

  return result;
}

function getLanguageAtPosition(
  document: TextDocument,
  regions: EmbeddedRegion[],
  position: Position
): string | undefined {
  const offset = document.offsetAt(position);
  for (const region of regions) {
    if (region.start <= offset) {
      if (offset <= region.end) {
        return region.languageId;
      }
    } else {
      break;
    }
  }
  return "html";
}

function getDocument(
  document: TextDocument,
  contents: EmbeddedRegion[],
  languageId: string
): TextDocument {
  let currentPos = 0;
  const oldContent = document.getText();
  let result = "";
  let lastSuffix = "";
  for (const c of contents) {
    if (c.languageId === languageId) {
      result = substituteWithWhitespace(
        result,
        currentPos,
        c.start,
        oldContent,
        lastSuffix,
        ""
      );
      result += oldContent.substring(c.start, c.end);
      currentPos = c.end;
      lastSuffix = "";
    }
  }
  result = substituteWithWhitespace(
    result,
    currentPos,
    oldContent.length,
    oldContent,
    lastSuffix,
    ""
  );
  return TextDocument.create(
    document.uri,
    languageId,
    document.version,
    result
  );
}

function substituteWithWhitespace(
  result: string,
  start: number,
  end: number,
  oldContent: string,
  before: string,
  after: string
) {
  let accumulatedWS = 0;
  result += before;
  for (let i = start + before.length; i < end; i++) {
    const ch = oldContent[i];
    if (ch === "\n" || ch === "\r") {
      // only write new lines, skip the whitespace
      accumulatedWS = 0;
      result += ch;
    } else {
      accumulatedWS++;
    }
  }
  result = append(result, " ", accumulatedWS - after.length);
  result += after;
  return result;
}

function append(result: string, str: string, n: number): string {
  while (n > 0) {
    if (n & 1) {
      result += str;
    }
    n >>= 1;
    str += str;
  }
  return result;
}
