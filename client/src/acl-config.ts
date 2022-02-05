import * as vscode from "vscode";
import { acLabArduino } from "./extension";

/**
 * ACLab Config Interface
 */
const config = () => vscode.workspace.getConfiguration("acLabServer");

export namespace AcLabConfig {
  export function maxNumberOfProblems(): number {
    return config().get<number>("maxNumberOfProblems");
  }
  export function isAskNoMore(): boolean {
    return config().get<boolean>("AskNoMore");
  }

  export function traceLevel(): string {
    return config().get<string>("trace.server");
  }

  export function logLevel(): string {
    return config().get<string>("log.level");
  }
  export function isShowBanner(): boolean {
    return config().get<boolean>("show.banner");
  }
  export function isLogToFile(): boolean {
    return config().get<boolean>("log.to.file");
  }
  export function formatLogFile(): string {
    return config().get<string>("format.log.file");
  }

  // export function setAskNoMore(value: boolean) {
  //   return config().update(
  //     "AskNoMore",
  //     value,
  //     vscode.ConfigurationTarget.WorkspaceFolder
  //   );
  // }
}
