import * as vscode from "vscode";

/**
 * ACLab Config Interface
 */
const config = () => vscode.workspace.getConfiguration("acLabServer");

export namespace AcLabConfig {
  export function maxNumberOfProblems(): number {
    return config().get<number>("maxNumberOfProblems", 100);
  }
  export function isAskNoMore(): boolean {
    return config().get<boolean>("AskNoMore", false);
  }

  export function traceLevel(): string {
    return config().get<string>("trace.server", "none");
  }

  export function logLevel(): string {
    return config().get<string>("log.level", "info");
  }
  export function isShowBanner(): boolean {
    return config().get<boolean>("show.banner", true);
  }
  export function isLogToFile(): boolean {
    return config().get<boolean>("log.to.file", false);
  }
  export function formatLogFile(): string {
    return config().get<string>("format.log.file", "text");
  }

  // export function setAskNoMore(value: boolean) {
  //   return config().update(
  //     "AskNoMore",
  //     value,
  //     vscode.ConfigurationTarget.WorkspaceFolder
  //   );
  // }
}
