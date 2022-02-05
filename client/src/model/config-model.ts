import fse = require("fs-extra");
import * as vscode from "vscode";

export interface IConfigDataModel {
  version: string;
  cliVersion: string;
  port: string;
  board: string;
  board_name?: string;
  alias?: string;
  additional_urls?: string[];
}

export interface IConfigModel extends IConfigDataModel {
  filename: vscode.Uri;
  existFile: boolean;
  onDidChangeConfig: any; //(event: IConfigModel) => void;
  add3rdPartyUrl: (url: URL) => void;
}

const DEFAULT_CONFIG: IConfigDataModel = {
  version: "0.0.1",
  cliVersion: "",
  port: "",
  board: "",
  alias: "",
};

export class ConfigModel implements IConfigModel {
  private readonly _filename: vscode.Uri;
  private _content: IConfigDataModel;

  private _onDidChangeConfig: vscode.EventEmitter<IConfigModel> =
    new vscode.EventEmitter<IConfigModel | null>();

  readonly onDidChangeConfig: vscode.Event<IConfigModel> =
    this._onDidChangeConfig.event;
  private _watchFile: fse.StatWatcher;

  static create(workspace: vscode.Uri): IConfigModel {
    const file: vscode.Uri = vscode.Uri.joinPath(
      workspace,
      ".vscode",
      "aclabarduino.json"
    );

    const model: ConfigModel = new ConfigModel(file);

    return model as unknown as IConfigModel;
  }

  private constructor(filename: vscode.Uri) {
    this._filename = filename;

    if (fse.existsSync(filename.fsPath)) {
      this._content = fse.readJSONSync(filename.fsPath);
    } else {
      this._content = { ...DEFAULT_CONFIG };
    }

    this._watchFile = fse.watchFile(filename.fsPath, (curr, prev) => {
      if (curr.uid == 0 && curr.mtimeMs == 0) {
        //deletado
        this._watchFile.unref();
        this._content = DEFAULT_CONFIG;
      } else if (curr.mtimeMs > prev.mtimeMs) {
        //novo ou modificado
        this._content = fse.readJSONSync(filename.fsPath);
      }

      this._onDidChangeConfig.fire(this);
    });
  }

  add3rdPartyUrl(url: URL): void {
    let additionalUrls: string[] = this._content.additional_urls;

    if (!additionalUrls) {
      additionalUrls = [];
    }

    if (!additionalUrls.includes(url.toString())) {
      additionalUrls.push(url.toString());
      this.content = { ...this._content, additional_urls: additionalUrls };
    }
  }

  get alias(): string {
    return this._content.alias;
  }

  get existFile(): boolean {
    return fse.existsSync(this._filename.fsPath);
  }

  get filename(): vscode.Uri {
    return this._filename;
  }

  private set content(content: IConfigDataModel) {
    if (JSON.stringify(this._content) !== JSON.stringify(content)) {
      this._content = content;
      fse.writeJSONSync(this.filename.fsPath, content, { spaces: 2 });
    }
  }

  private get content(): IConfigDataModel {
    return this._content;
  }

  set cliVersion(version: string) {
    this.content = { ...this._content, cliVersion: version };
  }

  get cliVersion(): string {
    return this.content.cliVersion;
  }

  get version(): string {
    return this.content.version;
  }

  get port(): string {
    return this.content.port;
  }

  set port(port: string) {
    this.content = { ...this._content, port: port };
  }

  get board(): string {
    return this.content.board;
  }

  set board(value: string) {
    this.content = {
      ...this._content,
      board: value,
    };
  }

  set board_name(value: string) {
    this.content = {
      ...this._content,
      board_name: value,
    };
  }

  get board_name(): string {
    return this.content.board_name;
  }
}
