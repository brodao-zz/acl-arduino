import { IArduinoEntry } from "./arduino-entry";

export interface IInformationEntry {
  readonly parent: IArduinoEntry;
  readonly label: string;
  readonly value: string;
  readonly tooltip: string;
}

export class InformationEntry implements IInformationEntry {
  private readonly _parent: IArduinoEntry;
  private readonly _label: string;
  private readonly _property: string;
  private readonly _tooltip: string;

  constructor(
    parent: IArduinoEntry,
    label: string,
    property: string,
    tooltip?: string
  ) {
    this._parent = parent;
    this._label = label;
    this._property = property;
    this._tooltip = tooltip ? tooltip : `${label}: ${property}`;
  }

  get parent(): IArduinoEntry {
    return this._parent;
  }

  get label(): string {
    return this._label;
  }

  get value(): string {
    return this._property;
  }

  get tooltip(): string {
    return this._tooltip;
  }
}
