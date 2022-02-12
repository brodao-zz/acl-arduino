import * as vscode from "vscode";
import { MultiStepInput } from "../components/multi-step-quick-pick";
import { acLabArduino } from "../extension";
import { Protocol } from "../protocol-interf";
import { State } from "./command-interf";

export async function doSelectPort(state: State): Promise<State> {
  return await getPort(state)
    .then((state: State) => {
      if (state.nextOper === "cancel") {
        vscode.window.showInformationMessage(
          "Select port canceled by user request"
        );

        return state;
      } else if (state.nextOper === "confirm") {
        vscode.window.showInformationMessage(
          `Selected [${state.port}] for [:${state.workspace.name}]`
        );

        acLabArduino.getModel(state.workspace).port = state.port;
        state.nextOper = "finish";
      }

      return state;
    })
    .catch((reason: any) => {
      vscode.window.showErrorMessage(reason);
      state.nextOper = "cancel";
      return state;
    });
}

async function getPort(state: State): Promise<State> {
  return await state.protocol
    .boardList()
    .then(async (ports: Protocol.IDetectedPort[]) => {
      state.ports = ports;
      return state;
    })
    .then(async (state: State) => {
      await MultiStepInput.run(async (input) => await pickPort(input, state));

      return state;
    })
    .then(async (state: State) => {
      return state;
    });
}

async function pickPort(input: MultiStepInput, state: Partial<State>) {
  state.pickItem = await input.showQuickPick({
    title: `Select a Port`,
    step: 0,
    totalSteps: 1,
    items: getPortItemsPick(state),
    matchAll: true,
  });

  if (!state.pickItem) {
    state.nextOper = "cancel";
  } else {
    state.port = state.pickItem.label;
    state.nextOper = "confirm";
  }

  return;
}

function getPortItemsPick(state: Partial<State>): vscode.QuickPickItem[] {
  const ports: Protocol.IDetectedPort[] = state.ports || [];
  const result: vscode.QuickPickItem[] = [];

  ports.forEach((port: Protocol.IDetectedPort) => {
    result.push({
      label: port.port.address,
      description: `${
        port.port.protocol_label ? port.port.protocol_label : "<no protocol>"
      }, ${
        port.port.protocol ? port.port.protocol.toLowerCase() : "<no protocol>"
      }`,
      detail: JSON.stringify(port.port.properties ? port.port.properties : {}),
    });
  });

  return result;
}
