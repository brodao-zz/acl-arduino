import { Diagnostic } from "vscode-languageclient";

export namespace Protocol {
  export interface Message {
    // sendBoardList(): Thenable<IBoard[]>;
    // sendPorts(): Thenable<IDetectedPort[]>;
  }

  export function getResult<T>(serverResult: IServerResult): T {
    if (serverResult.status) {
      return serverResult.data as T;
    }

    throw new Error(serverResult.reason);
  }

  export interface IServerResult {
    status: boolean;
    data: any;
    reason: string;
  }

  export interface IArduinoCliVersion {
    name: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    tag_name: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    tarball_url: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    zipball_url: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    prerelease: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    published_at: string;
    author: string;
  }

  export interface IArduinoPlatform {
    id: string;
    latest: string;
    installed: string;
    versions: string[];
    name: string;
    maintainer: string;
    website: string;
    email: string;
    boards: IBoard[];
  }

  export interface IDetectedPort {
    port: {
      address: string;
      label: string;
      protocol: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      protocol_label: string;
      properties?: {
        pid: string;
        serialNumber: string;
        vid: string;
      };
    };
  }

  export interface IOutdated {
    name: string;
    actual: string;
    newer: string;
  }

  export interface IBoard {
    name: string;
    fqbn: string;
  }

  export interface IDetectedPort {
    port: {
      address: string;
      label: string;
      protocol: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      protocol_label: string;
      properties?: {
        pid: string;
        serialNumber: string;
        vid: string;
      };
    };
  }

  export interface ICheckProject {
    uri: string;
    status: number;
    diagnostics: Diagnostic[];
  }
}
