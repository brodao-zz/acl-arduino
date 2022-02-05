import {
  SideBarView,
  TreeItem,
  ViewContent,
  DefaultTreeSection,
  ViewSection,
  ViewItem,
  TitleActionButton,
  ViewTitlePart,
  ActivityBar,
  DefaultTreeItem,
} from "vscode-extension-tester";
import { delay } from "../helper";
import { TINY_DELAY } from "./../helper";

export class ViewPageObject<T> {
  private _view: T;
  private viewName: string;

  protected constructor(name: string) {
    this.viewName = name;
    this.openView().then((value: T) => {
      this._view = value;
    });
  }

  get view(): T {
    return this._view as T;
  }

  async openView(): Promise<T> {
    let result: T = (await (
      await new ActivityBar().getViewControl(this.viewName)
    )?.openView()) as unknown as T;

    this._view = result;

    return result;
  }

  async openTreeItem(
    sectionName?: string,
    ...path: string[]
  ): Promise<TreeItem[]> {
    const view: SideBarView = this.view as unknown as SideBarView;
    const content: ViewContent = view.getContent();
    let tree: DefaultTreeSection;

    if (sectionName) {
      tree = (await content.getSection(sectionName)) as DefaultTreeSection;
    } else {
      const sections = await content.getSections();
      tree = sections[0] as DefaultTreeSection;
    }

    const result: TreeItem[] = await tree.openItem(...path);

    return result;
  }

  async getTreeItem(path: string[]): Promise<TreeItem | undefined> {
    const view: SideBarView = this.view as unknown as SideBarView;
    const content: ViewContent = view.getContent();
    const sections = await content.getSections();
    const tree: DefaultTreeSection = sections[0] as DefaultTreeSection;
    const result: TreeItem = await this.findChildNode(tree, path);

    return await Promise.resolve(result);
  }

  async countChild(path: string[]): Promise<number> {
    const view: SideBarView = this.view as unknown as SideBarView;
    const content: ViewContent = view.getContent();
    const sections = await content.getSections();
    const tree: DefaultTreeSection = sections[0] as DefaultTreeSection;
    let result: number = 0;

    if (path.length == 0) {
      result = (await tree.getVisibleItems()).length;
    } else {
      result = (await tree.openItem(...path)).length;
    }

    return result;
  }

  async findChildNode(
    tree: DefaultTreeSection,
    path: string[]
  ): Promise<TreeItem> {
    const DELAY: number = TINY_DELAY;

    if (path.length == 1) {
      let node: TreeItem = await tree.findItem(path[0]);
      return node;
    }

    let aux: DefaultTreeItem = undefined;
    let children = await tree.openItem(path[0]);
    await delay(DELAY);

    let level: number = 1;
    do {
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        const label: string = await child.getLabel();

        if (label == path[level]) {
          aux = child;
          break;
        }
      }

      await delay(DELAY);
      level++;
      if (level < path.length && aux) {
        children = await aux.getChildren();
      }
    } while (level < path.length);

    await delay(DELAY);

    return aux;
  }

  async getAction(action: string): Promise<TitleActionButton> {
    const view: SideBarView = this.view as unknown as SideBarView;
    const titlePart: ViewTitlePart = view.getTitlePart();

    return await titlePart.getAction(action);
  }

  async getVisibleItems(): Promise<ViewItem[]> {
    const view: SideBarView = this.view as unknown as SideBarView;
    const content: ViewContent = view.getContent();
    const sections: ViewSection[] = await content.getSections();
    const elements: ViewItem[] = await sections[0].getVisibleItems();

    return elements;
  }
}
