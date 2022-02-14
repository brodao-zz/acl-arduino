import {
  Workbench,
  Notification,
  NotificationType,
  EditorView,
  // VSBrowser,
} from "vscode-extension-tester";

import { NotificationPageObject } from "./notification-po";
import { expect } from "chai";
import { ExplorerPageObject } from "./explorer-view-po";
import { OutputAclPageObject } from "./output-acl-po";
import { ProblemsPageObject } from "./problem-view-po";
import { BottomBarPageObject } from "./bottom-bar-po";
import { SMALL_DELAY, TINY_DELAY, delay } from "./../helper";
import path = require("path");
import fse = require("fs-extra");
import { OutputAclTracePageObject } from "./output-acl-trace-po";

const FAST_PROCESS_TIMEOUT = 10 * SMALL_DELAY; //10 segundos
//const MEDIUM_PROCESS_TIMEOUT = 60 * SMALL_DELAY; //1 min
//const SLOW_PROCESS_TIMEOUT = 3 * 60 * SMALL_DELAY; //3 min

export interface IOptionsOpenProject {
  reset: boolean;
}

// const DEFAULT_OPTIONS_OPEN_PROJECT: IOptionsOpenProject = {
//   reset: false,
// };

export class AbstractWorkbenchPageObject {
  private _workbench: Workbench;
  //private statusBar: StatusPageObject;
  private notification: NotificationPageObject;
  private bottombar: BottomBarPageObject;

  protected static resetProject(projectFolder: string): void {
    const vscodeFolder: string = path.join(projectFolder, ".vscode");
    const files: string[] = [
      path.join(vscodeFolder, "aclarduino.json"),
      path.join(vscodeFolder, "arduino-cli.yaml"),
    ];

    fse.ensureDirSync(path.dirname(vscodeFolder));

    files.forEach((file: string) => {
      if (fse.existsSync(file)) {
        fse.removeSync(file);
      }
    });
  }

  static async closeAllEditors(): Promise<void> {
    const view = new EditorView();
    view.closeAllEditors();
    await delay();

    return Promise.resolve();
  }

  protected constructor() {
    this._workbench = new Workbench();
    //this.statusBar = new StatusPageObject(this._workbench);
    this.notification = new NotificationPageObject(this._workbench);
    this.bottombar = new BottomBarPageObject();
  }

  async wait() {
    await delay(TINY_DELAY);
    await this._workbench.getStatusBar().wait(2000);
  }

  async closeProject(): Promise<void> {
    this._workbench.executeCommand("Close Folder");
    return Promise.resolve();
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

  protected async testNotification(
    targetText: RegExp | string
  ): Promise<boolean> {
    const notification: Notification | undefined = await this.getNotification(
      targetText
    );
    const result: boolean = notification ? true : false;
    await notification?.dismiss();

    return result;
  }

  protected async processInProgress(
    targetText: RegExp | string
  ): Promise<boolean> {
    let notification: Notification | undefined = await this.getNotification(
      targetText
    );

    return (await notification?.hasProgress()) || false;
  }

  protected async waitNotification(
    targetText: RegExp | string,
    _wait: number = FAST_PROCESS_TIMEOUT
  ) {
    let steps: number = _wait / 500;
    let notification: Notification | undefined = await this.getNotification(
      targetText
    );

    if (notification) {
      let notificationAux;
      while (!notificationAux && steps > 0) {
        await delay(SMALL_DELAY);
        steps--;

        notificationAux = await this.getNotification(targetText);
      }
    }

    return notification;
  }

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

  protected async waitProcessFinish(
    targetText: RegExp | string,
    _wait: number = FAST_PROCESS_TIMEOUT
  ): Promise<Notification | undefined> {
    let steps: number = _wait / 500;
    let notification: Notification | undefined = await this.getNotification(
      targetText
    );

    if (notification) {
      try {
        while ((await notification.hasProgress()) && steps > 0) {
          await delay(TINY_DELAY);
          steps--;
        }
        expect(
          notification.hasProgress(),
          `Timeout process (${_wait}ms): ${targetText}`
        ).is.false;
      } catch (error) {
        //em caso de erro, considera que é barra de progresso que é destruída
        //quando o processo termina
      }
    }

    return notification;
  }

  protected async getNotification(
    targetText: RegExp | string,
    _wait: number = 5000
  ): Promise<Notification | undefined> {
    const notification: Notification | undefined =
      await this.notification.getNotification(
        targetText,
        NotificationType.Any,
        _wait
      );

    return notification;
  }

  protected async executeCommand(command: string) {
    await this._workbench.executeCommand(command);
  }

  // async openDebugView(): Promise<DebugPageObject> {
  //   const po: DebugPageObject = new DebugPageObject();
  //   await po.openView();

  //   return po;
  // }

  async openExplorerView(): Promise<ExplorerPageObject> {
    const po: ExplorerPageObject = new ExplorerPageObject();
    await po.openView();

    return po;
  }

  async openOutputAcl(): Promise<OutputAclPageObject> {
    const po: OutputAclPageObject = new OutputAclPageObject();
    await po.openPanel();

    return po;
  }

  async openOutputAclTrace(): Promise<OutputAclTracePageObject> {
    const po: OutputAclTracePageObject = new OutputAclTracePageObject();
    await po.openPanel();

    return po;
  }

  async openProblemsView(): Promise<ProblemsPageObject> {
    const po: ProblemsPageObject = await this.bottombar.openProblemsView();
    //await po.openPanel();

    return po;
  }
}
