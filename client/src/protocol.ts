//@ts-nocheck
import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { Protocol } from "./protocol-interf";

export class AclProtocol implements Protocol.Message {
  private _languageClient: LanguageClient;
  //private _workspace: vscode.WorkspaceFolder;

  public static initialize(
    workspace: vscode.WorkspaceFolder,
    languageClient: LanguageClient
  ): AclProtocol {
    if (!languageClient) {
      throw new Error("LanguageClient not initialize.");
    }

    return new AclProtocol(workspace, languageClient);
  }

  private constructor(
    workspace: vscode.WorkspaceFolder,
    languageClient: LanguageClient
  ) {
    this._languageClient = languageClient;
    //this._workspace = workspace;
  }

  get languageClient(): LanguageClient {
    return this._languageClient;
  }

  async getReleases(): Promise<Map<string, Protocol.IArduinoCliVersion>> {
    const versions: Map<string, Protocol.IArduinoCliVersion> = new Map<
      string,
      Protocol.IArduinoCliVersion
    >();
    const releases: any = await this._languageClient.sendRequest(
      "$aclab/getReleases"
    );

    Object.keys(releases).forEach((key: string, index: number) => {
      const element: any = releases[key];
      const name: string = element["name"];
      const data: Protocol.IArduinoCliVersion = {
        name: element["name"],
        tag_name: element["tag_name"],
        tarball_url: element["tarball_url"],
        zipball_url: element["zipball_url"],
        prerelease: element["prerelease"],
        published_at: element["published_at"],
        author: element["author"],
      };

      versions.set(name, data);
    });

    return versions;
  }

  private processResult(serverResult: Protocol.IServerResult): any {
    if (serverResult.status) {
      return serverResult.data;
    }

    throw new Error(serverResult.reason);
  }

  async getInstalledPlatforms(): Promise<
    Map<string, Protocol.IArduinoPlatform>
  > {
    const platforms: Map<string, Protocol.IArduinoPlatform> =
      await this._languageClient
        .sendRequest<Protocol.IServerResult>("$aclab/coreList", "")
        .then((platforms: Protocol.IServerResult) =>
          platformsServerToClient(this.processResult(platforms))
        )
        .catch((reason: any) => {
          console.log(reason);
          return new Map();
        });

    return platforms;
  }

  async getAllPlatforms(): Promise<Map<string, Protocol.IArduinoPlatform>> {
    const platforms: Map<string, Protocol.IArduinoPlatform> =
      await this._languageClient
        .sendRequest<Protocol.IServerResult>("$aclab/coreList", "--all")
        .then((platforms: Protocol.IServerResult) =>
          platformsServerToClient(this.processResult(platforms))
        )
        .catch((reason: any) => {
          console.log(reason);
          return new Map();
        });

    return platforms;
  }

  async coreInstall(name: string, version: string) {
    const platforms: Map<string, Protocol.IArduinoPlatform> =
      await this._languageClient
        .sendRequest<Protocol.IServerResult>("$aclab/coreInstall", [
          name,
          version,
        ])
        .then((platforms: Protocol.IServerResult) =>
          this.processResult(platforms)
        )
        .catch((reason: any) => {
          console.log(reason);
          return new Map();
        });

    return platforms;
  }

  async getUpdatablePlatforms(): Promise<
    Map<string, Protocol.IArduinoPlatform>
  > {
    const platforms: Map<string, Protocol.IArduinoPlatform> =
      await this._languageClient
        .sendRequest("$aclab/coreList", "--updatable")
        .then((platforms: any) => platformsServerToClient(platforms));

    return platforms;
  }

  async coreUpdateIndex(): Promise<Protocol.IServerResult> {
    return await this._languageClient
      .sendRequest("$aclab/coreUpdateIndex")
      .then((text: any) => text);
  }

  async validate3rdPartyUrl(url: URL): Promise<any> {
    return await this._languageClient
      .sendRequest("$aclab/validate3rdPartyUrl", url)
      .then(
        (text: any) => text,
        (reason: any) => console.error("validate3rdPartyUrl", reason)
      );
  }

  async configAdd3rdPartyUrl(url: URL): Promise<any> {
    return await this._languageClient
      .sendRequest("$aclab/configAdd3rdPartyUrl", url)
      .then((text: any) => text)
      .then(async () => {
        return await this.coreUpdateIndex();
      });
  }

  async configRemove3thPartyUrl(url: URL): Promise<any> {
    return await this._languageClient
      .sendRequest("$aclab/configRemove3thPartyUrl", url)
      .then((text: any) => text);
  }

  async boardList(): Promise<Protocol.IDetectedPort[]> {
    const ports: Protocol.IDetectedPort[] = await this._languageClient
      .sendRequest<Protocol.IServerResult>("$aclab/boardList")
      .then((ports: Protocol.IServerResult) => this.processResult(ports))
      .catch((reason: any) => {
        console.log(reason);
        return new Map();
      });

    return ports;
  }

  //////////////////////////////////////////////
  //////////////////////////////////////////////
  //////////////////////////////////////////////
  //////////////////////////////////////////////
  //////////////////////////////////////////////
  //////////////////////////////////////////////
  // _sendBoardList(): Thenable<Protocol.IBoard[]> {
  //   return new Promise<Protocol.IBoard[]>(async (resolve, reject) => {
  //     const boards: Protocol.IBoard[] = [];

  //     await this._languageClient.sendRequest("$aclab/getBoardList").then(
  //       (result: any) => {
  //         Object.keys(result).forEach((key: string) => {
  //           const element: any = result[key];

  //           boards.push(...element);
  //         });

  //         resolve(boards);
  //       },
  //       (error: any) => {
  //         this._languageClient.error(error.message, error);
  //         reject(error);
  //       }
  //     );
  //   });
  // }

  // sendOutdated(): Thenable<Protocol.IOutdated[]> {
  //   return new Promise<Protocol.IOutdated[]>(async (resolve, reject) => {
  //     const outdatedList: Protocol.IOutdated[] = [];

  //     await this._languageClient.sendRequest("$aclab/getOutdated").then(
  //       (result: any) => {
  //         Object.keys(result).forEach((key: string) => {
  //           const element: any = result[key];

  //           outdatedList.push(element.port);
  //         });

  //         resolve(outdatedList);
  //       },
  //       (error: any) => {
  //         this._languageClient.error(error.message, error);
  //         reject(error);
  //       }
  //     );
  //   });
  // }

  /**
   * Verify outdated
   *
   */
  // async checkOutdated(): Promise<boolean> {
  //   const outdatedList: Protocol.IOutdated[] = await this.sendOutdated();

  //   return outdatedList.length > 0;
  // }
}

export function platformsServerToClient(
  platforms: any
): Map<string, Protocol.IArduinoPlatform> {
  const _platforms: Map<string, Protocol.IArduinoPlatform> = new Map();

  Object.keys(platforms).forEach((key: string, index: number) => {
    const element: any = platforms[key];
    const name: string = element["name"];
    const data: Protocol.IArduinoPlatform = {
      id: element["id"],
      latest: element["latest"],
      installed: element["installed"],
      versions: element["versions"],
      name: element["name"],
      maintainer: element["maintainer"],
      website: element["website"],
      email: element["email"],
      boards: element["boards"],
    };

    _platforms.set(name, data);
  });

  return _platforms;
}
