import {
  By,
  InputBox,
  WebElement,
  ContextMenu,
  ViewItem,
  ViewControl,
} from "vscode-extension-tester";
import { setTimeout } from "timers/promises";

export const TINY_DELAY: number = 1000;
export const SMALL_DELAY: number = 1000;
export const MEDIUM_DELAY: number = 2000;
export const LONG_DELAY: number = 2000;

export const delay = async (duration: number = SMALL_DELAY) => {
  await setTimeout(duration);
};

export const avoidsBacksliding = async () => {
  await delay(MEDIUM_DELAY);
};

export async function takeQuickPickAction(
  pickBox: InputBox,
  titleAction: string
): Promise<boolean> {
  const actionContainer: WebElement = pickBox.findElement(
    By.className("actions-container")
  );
  const actionList: WebElement[] = await actionContainer.findElements(
    By.className("action-item")
  );
  const actions: WebElement[] = actionList.filter(
    async (action: WebElement) => {
      const link: WebElement = await action.findElement(
        By.css("a.action-label")
      );
      const title: string = (await link.getAttribute("title")).toLowerCase();
      return title === titleAction.toLowerCase();
    }
  );

  if (actions.length === 1) {
    await actions[0].click();
    await delay();
    return true;
  }

  return false;
}

/*
export async function readServersJsonFile(): Promise<string> {
  const serversJsonFile: string = path.join(
    PROJECT_FOLDER,
    ".vscode",
    "servers.json"
  );
  let result: string = "< file not found >";

  fse.ensureDirSync(path.dirname(serversJsonFile));

  if (fse.existsSync(serversJsonFile)) {
    const buffer: Buffer = fse.readFileSync(serversJsonFile);
    result = buffer.toString();
  }

  return result;
}
*/

export async function fireContextMenuAction(
  element: ViewItem | ViewControl,
  name: string
) {
  const menu: ContextMenu = await element.openContextMenu();
  await menu.select(name);

  await delay();
}
