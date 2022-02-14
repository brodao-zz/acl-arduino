import { SideBarView, TreeItem } from "vscode-extension-tester";
import { delay } from "../helper";
import { ViewPageObject } from "./view-po";

export class ExplorerPageObject extends ViewPageObject<SideBarView> {
  constructor() {
    super("Explorer");
  }

  async getResource(path: string[]): Promise<TreeItem | undefined> {
    const treeItem: TreeItem | undefined = await super.getTreeItem(path);
    //await treeItem?.select();
    await delay();

    return treeItem;
  }

  async getFolder(path: string[]): Promise<TreeItem | undefined> {
    return await this.getResource(path);
  }
}
