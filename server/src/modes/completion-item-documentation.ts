import { MarkupContent, MarkupKind } from "vscode-languageserver/node";
import { Server } from "../server-interf";

function createMarkdown(...lines: string[]): MarkupContent {
  return {
    kind: MarkupKind.Markdown,
    value: lines.filter((line: string) => line).join("\n"),
  };
}

export function createReleaseDocumentation(
  release: Server.IArduinoRelease
): MarkupContent {
  return createMarkdown(
    `## Arduino-CLI ${release.tag_name}`,
    `- Published at **${release.published_at}** by **${release.author}**`,
    release.prerelease ? "- It´s prerelease" : "",
    "\n",
    `See [more info...](${release.html_url})`
  );
}

export function createPlatformDocumentation(
  platform: Server.IArduinoPlatform
): MarkupContent {
  return createMarkdown(
    `### ${platform.name} Version ${platform.latest}`,
    // `${
    //   platform.versions.length ? ` and ${platform.versions.length} olders` : ""
    // } by **${platform.maintainer}**`,
    "\n",
    "Supported boards:\n",
    `${platform.boards.join(", ")}`,
    "\n",
    `[Contact](${platform.email}) or `,
    `see [more info...](${platform.website})`
  );
}

export function createBoardDocumentation(
  platform: Server.IArduinoPlatform,
  board: Server.IArduinoBoard
): MarkupContent {
  return createMarkdown(
    `### ${board.name}\n`,
    `FQBN: ${board.fqbn}\n`,
    `${platform.name} version ${platform.latest} by **${platform.maintainer}**\n`,
    `[Contact](${platform.email}) or `,
    `see [more info...](${platform.website})`
  );
}

export function createPlatformVersionDocumentation(
  platform: Server.IArduinoPlatform,
  version: string
): MarkupContent {
  return createMarkdown(
    `### ${platform.name} Version ${version}`,
    `by **${platform.maintainer}**`
  );
}

function makeList(label: string, keyvalueList: any): string[] {
  const result: string[] = [];

  if (keyvalueList) {
    result.push(`**${label}**`);
    Object.keys(keyvalueList).forEach((key: string) => {
      result.push(`- ${key}: ${keyvalueList[key]}`);
    });
  }

  return result;
}

export function createPortDocumentation(
  port: Server.IDetectedPort
): MarkupContent {
  return createMarkdown(
    `### ${port.address}`,
    `${port.label}`,
    `${port.protocol_label}, ${port.protocol}`,
    ...makeList("Properties", port.properties)
  );
}
