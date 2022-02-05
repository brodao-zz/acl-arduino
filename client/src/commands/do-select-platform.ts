import path = require("path");
import fse = require("fs-extra");
import * as vscode from "vscode";
import { MultiStepInput } from "../components/multi-step-quick-pick";
import { Protocol } from "../protocol-interf";
import { State } from "./command-interf";

const ADD_3RD_PARTY_URL: vscode.QuickPickItem = {
  label: "Add 3rd party URL",
  description: "",
  detail: "Add and install 3rd party URL",
  alwaysShow: true,
};

export async function doSelectPlatform(state: State): Promise<State> {
  return await getPlatform(state)
    .then(async (state: State) => {
      if (state.nextOper == "cancel") {
        vscode.window.showInformationMessage(
          "Add platform canceled by user request"
        );

        return state;
      } else if (state.nextOper == "confirm") {
        vscode.window.showInformationMessage(
          `Added [${state.platform.name} version ${state.platform.latest}]`
        );

        await state.protocol.coreInstall(
          state.platform.id,
          state.platform.latest
        );
        state.nextOper = "selectBoard";
      }

      return state;
    })
    .catch((reason) => {
      vscode.window.showErrorMessage(reason);
      state.nextOper = "cancel";
      return state;
    });
}

async function getPlatform(state: State): Promise<State> {
  return await state.protocol
    .getAllPlatforms()
    .then(async (platforms: Map<string, Protocol.IArduinoPlatform>) => {
      state.platforms = platforms;
      return state;
    })
    .then(async (state: State) => {
      await MultiStepInput.run(
        async (input) => await pickPlatform(input, state)
      );

      return state;
    })
    .then(async (state: State) => {
      if (state.nextOper == "confirm") {
        state.platform = state.platforms.get(state.pickItem.label);
      }

      return state;
    });
}

async function pickPlatform(input: MultiStepInput, state: Partial<State>) {
  state.pickItem = await input.showQuickPick({
    title: "Select a Platform",
    step: 0,
    totalSteps: 1,
    items: getPlatformItemsPick(state.platforms),
    matchAll: true,
  });

  if (!state.pickItem) {
    state.nextOper = "cancel";
  } else if (state.pickItem.label == ADD_3RD_PARTY_URL.label) {
    state.nextOper = "add3rdPartyUrl";
  } else {
    state.nextOper = "confirm";
  }

  return;
}

function getPlatformItemsPick(
  platforms: Map<string, Protocol.IArduinoPlatform>
): vscode.QuickPickItem[] {
  const result: vscode.QuickPickItem[] = [];

  result.push(ADD_3RD_PARTY_URL);

  platforms.forEach((entry: Protocol.IArduinoPlatform) => {
    if (!entry.installed) {
      result.push({
        label: entry.name,
        description: `Version ${entry.latest} by ${entry.maintainer}`,
        detail: `${entry.boards
          .map((board: Protocol.IBoard) => board.name)
          .join(", ")}`,
      });
    }
  });

  return result.sort((a: vscode.QuickPickItem, b: vscode.QuickPickItem) => {
    return a.label < b.label ? -1 : a.label == b.label ? 0 : 1;
  });
}
