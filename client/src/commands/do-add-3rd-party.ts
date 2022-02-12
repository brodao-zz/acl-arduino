import * as vscode from "vscode";
import { MultiStepInput } from "../components/multi-step-quick-pick";
import { State } from "./command-interf";
import { acLabArduino } from "./../extension";

export async function doAdd3rdPartyUrl(state: State): Promise<State> {
  return await add3rdParty(state)
    .then(async (state: State) => {
      if (state.nextOper === "cancel") {
        vscode.window.showInformationMessage(
          "Add 3rd party URL canceled by user request"
        );

        return state;
      } else if (state.nextOper === "confirm") {
        vscode.window.showInformationMessage(
          `Added 3rd party url [${state.url}]`
        );

        acLabArduino.getModel(state.workspace).add3rdPartyUrl(state.url);
        await state.protocol.configAdd3rdPartyUrl(state.url);
        state.nextOper = "selectPlatform";
      }

      return state;
    })
    .catch((reason) => {
      vscode.window.showErrorMessage(reason);
      state.nextOper = "cancel";
      return state;
    });
}

async function add3rdParty(state: State): Promise<State> {
  await MultiStepInput.run(async (input) => await pick3rdParty(input, state));
  return Promise.resolve(state);
}

async function pick3rdParty(input: MultiStepInput, state: Partial<State>) {
  state.pickItem = await input.showInputBox({
    title: "Add 3rd Party URL",
    step: 0,
    totalSteps: 1,
    prompt: "Inform 3rd Partu URL",
    value: "",
    state: state,
    validate: validade3rdParty,
  });

  if (!state.pickItem) {
    state.nextOper = "cancel";
  } else {
    state.nextOper = "confirm";
    state.url = state.pickItem;
  }

  return;
}

async function validade3rdParty(
  state: Partial<State>,
  value: string
): Promise<string> {
  let message: string = "";

  try {
    const url: URL = new URL(value);
    await state.protocol?.validate3rdPartyUrl(url).then((result: any[]) => {
      result
        .filter((element: any) => !element.status)
        .forEach((element: any) => (message += element.reason));
    });
  } catch (reason: any) {
    message = reason.toString();
  }

  return Promise.resolve(message);
}
