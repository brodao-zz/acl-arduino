import * as vscode from "vscode";
import { MultiStepInput } from "../components/multi-step-quick-pick";
import { acLabArduino } from "../extension";
import { Protocol } from "../protocol-interf";
import { State } from "./command-interf";

const ADD_PLATFORM: vscode.QuickPickItem = {
  label: "Add Platform",
  description: "",
  detail: "Add a new platform with device specifications.",
  alwaysShow: true,
};

export async function doSelectBoard(state: State): Promise<State> {
  return await getBoard(state)
    .then((state: State) => {
      if (state.nextOper === "cancel") {
        vscode.window.showInformationMessage(
          "Select board canceled by user request"
        );

        return state;
      } else if (state.nextOper === "confirm") {
        vscode.window.showInformationMessage(
          `Selected [${state.board.name}:${state.board.fqbn}]`
        );

        acLabArduino.getModel(state.workspace).board = state.board.fqbn;
        acLabArduino.getModel(state.workspace).board_name = state.board.name;
        state.nextOper = "finish";
      }

      return state;
    })
    .catch((reason) => {
      vscode.window.showErrorMessage(reason);
      state.nextOper = "cancel";
      return state;
    });
}

async function getBoard(state: State): Promise<State> {
  return await state.protocol
    .getInstalledPlatforms()
    .then(async (platforms: Map<string, Protocol.IArduinoPlatform>) => {
      state.platforms = platforms;
      return state;
    })
    .then(async (state: State) => {
      await MultiStepInput.run(async (input) => await pickBoard(input, state));

      return state;
    })
    .then(async (state: State) => {
      if (state.nextOper === "confirm") {
        let board: Protocol.IBoard = {
          name: state.pickItem.label,
          fqbn: state.pickItem.description,
        };
        state.board = board;
      }

      return state;
    });
}

async function pickBoard(input: MultiStepInput, state: Partial<State>) {
  const subtitle: string = state.platform?.id ? `(${state.platform.id})` : "";
  state.pickItem = await input.showQuickPick({
    title: `Select a Board ${subtitle}`,
    step: 0,
    totalSteps: 1,
    items: getBoardItemsPick(state),
    //buttons: [new AddPlatformButton()],
    matchAll: true,
  });

  if (!state.pickItem) {
    state.nextOper = "cancel";
  } else if (state.pickItem.label === ADD_PLATFORM.label) {
    state.nextOper = "selectPlatform";
  } else {
    state.board = state.pickItem.label;
    state.nextOper = "confirm";
  }

  return;
}

function getBoardItemsPick(state: Partial<State>): vscode.QuickPickItem[] {
  if (!state.platforms) {
    return [];
  }

  const platforms: Map<string, Protocol.IArduinoPlatform> = state.platforms;
  const result: vscode.QuickPickItem[] = [];

  platforms.forEach((entry: Protocol.IArduinoPlatform) => {
    if (!state.platform || state.platform.id === entry.id) {
      entry.boards.forEach((board: Protocol.IBoard) => {
        result.push({
          label: board.name,
          description: `${board.fqbn}`,
        });
      });
    }
  });

  return [
    ADD_PLATFORM,
    ...result.sort((a: vscode.QuickPickItem, b: vscode.QuickPickItem) => {
      return a.label < b.label ? -1 : a.label === b.label ? 0 : 1;
    }),
  ];
}
