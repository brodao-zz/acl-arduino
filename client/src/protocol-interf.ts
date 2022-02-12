export namespace Protocol {
  export interface Message {
    // sendBoardList(): Thenable<IBoard[]>;
    // sendPorts(): Thenable<IDetectedPort[]>;
  }

  export interface IServerResult {
    status: boolean;
    data: any;
    reason: string;
  }

  export interface IArduinoCliVersion {
    name: string;
    //@ts-ignore
    tag_name: string;
    //@ts-ignore
    tarball_url: string;
    //@ts-ignore
    zipball_url: string;
    //@ts-ignore
    prerelease: boolean;
    //@ts-ignore
    published_at: string;
    //@ts-ignore
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
}
