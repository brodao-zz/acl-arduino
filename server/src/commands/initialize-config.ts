import fse = require("fs-extra");
import path = require("path");
import { CONFIG_SERVER_DEFAULT } from "../model/config-model";

export function doInitializeConfig(settingsFile: string): Promise<string> {
  fse.ensureDirSync(path.dirname(settingsFile));
  fse.writeJSONSync(settingsFile, CONFIG_SERVER_DEFAULT, { spaces: 4 });

  return new Promise<string>(() =>
    fse.existsSync(settingsFile)
      ? "File configuration created with sucess."
      : "File configuration creation failed"
  );
}
