import * as vscode from "vscode";
import { AclProtocol } from "../protocol";
import { Protocol } from "../protocol-interf";

export interface State {
  nextOper:
    | "cancel"
    | "confirm"
    | "selectBoard"
    | "selectPlatform"
    | "add3rdPartyUrl"
    | "selectPort"
    | "finish";
  workspace: vscode.WorkspaceFolder;
  pickItem: any;
  board: Protocol.IBoard;
  platforms: Map<string, Protocol.IArduinoPlatform>;
  platform: Protocol.IArduinoPlatform | undefined;
  protocol: AclProtocol;
  url: URL;
  port: string;
  ports: Protocol.IDetectedPort[];
}
