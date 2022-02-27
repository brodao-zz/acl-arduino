/* eslint-disable @typescript-eslint/naming-convention */
export namespace Server {
  export interface IArduinoRelease {
    name: string;
    tag_name: string;
    //tarball_url: string;
    //zipball_url: string;
    html_url: string;
    prerelease: boolean;
    published_at: string;
    author: string;
  }

  export interface IArduinoBoard {
    name: string;
    fqbn: string;
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
    boards: IArduinoBoard[];
  }

  export interface IDetectedPort {
    address: string;
    label: string;
    protocol: string;
    protocol_label: string;
    properties?: {
      pid: string;
      serialNumber: string;
      vid: string;
    };
  }
}
