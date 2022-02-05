import { Notification, VSBrowser } from "vscode-extension-tester";

import { OutputAclPageObject } from "./output-acl-po";
import { MEDIUM_DELAY, SMALL_DELAY, delay } from "./../helper";
import path = require("path");
import fse = require("fs-extra");
import { SCENARIO } from "../scenario";
import { AbstractWorkbenchPageObject } from "./abstract-workbench-po";

const FAST_PROCESS_TIMEOUT = 10 * SMALL_DELAY; //10 segundos
const MEDIUM_PROCESS_TIMEOUT = 60 * SMALL_DELAY; //1 min
const SLOW_PROCESS_TIMEOUT = 3 * 60 * SMALL_DELAY; //3 min

export interface IOptionsOpenProject {
  reset: boolean;
}

const DEFAULT_OPTIONS_OPEN_PROJECT: IOptionsOpenProject = {
  reset: false,
};

export class WorkbenchPageObject extends AbstractWorkbenchPageObject {
  static async openProjectWithReset(): Promise<WorkbenchPageObject> {
    return await this.openProject({ reset: true });
  }

  static async openProject(
    optionsOpenProject: Partial<IOptionsOpenProject> = {}
  ): Promise<WorkbenchPageObject> {
    const options: IOptionsOpenProject = {
      ...DEFAULT_OPTIONS_OPEN_PROJECT,
      ...optionsOpenProject,
    };

    if (options.reset) {
      this.resetProject(SCENARIO.project.folder);
    }

    await VSBrowser.instance.openResources(SCENARIO.project.folder);
    await delay(MEDIUM_DELAY);

    await this.closeAllEditors();
    await delay(MEDIUM_DELAY);

    return Promise.resolve(new WorkbenchPageObject());
  }

  private constructor() {
    super();
  }

  // async isConnected(
  //   LOCALHOST_NAME: string,
  //   LOCALHOST_ENVIRONMENT: string
  // ): Promise<boolean> {
  //   return (
  //     (await this.statusBar.statusBarWithText(
  //       `${LOCALHOST_NAME} / ${LOCALHOST_ENVIRONMENT}`,
  //       10000
  //     )) !== null
  //   );
  // }

  // async isRpoIntactOrIncomplete(): Promise<boolean> {
  //   return await this.testNotification(/RPO [intact|incomplete]/);
  // }

  // async isDAEndProcess(): Promise<boolean> {
  //   return await Promise.all([
  //     await this.testNotification(/Closing SmartClient/),
  //     await this.testNotification(/ExitCode=.*ExistStatus=.*/),
  //     await this.testNotification(/SmartClient closed/),
  //     await this.isDAFinished(),
  //   ]).then((value: boolean[]) => {
  //     return !value.includes(false);
  //   });
  // }

  async waitConnection(wait: number = FAST_PROCESS_TIMEOUT): Promise<void> {
    await this.waitProcessFinish(/Authenticating user/, wait);
  }

  async waitAskShowCompileResult(
    wait: number = FAST_PROCESS_TIMEOUT
  ): Promise<Notification> {
    return await this.waitNotification(/Show table with compile results/, wait);
  }

  async waitStopDebugger(wait: number = MEDIUM_PROCESS_TIMEOUT) {
    return await this.waitNotification(/Closing SmartClient/, wait);
  }
}
