// export interface IBoardServerModel {
//   name: string;
//   fqbn: string;
// }

export interface IConfigServerModel {
  version: string;
  cliVersion: string;
  port: string;
  board: string;
  boardName?: string;
  alias?: string;
}

export const CONFIG_SERVER_DEFAULT: IConfigServerModel = {
  version: "",
  cliVersion: "",
  port: "",
  boardName: "",
  board: "",
  alias: "",
};
