import crypto from "crypto";
import path = require("path");
import fse from "fs-extra";

export namespace ACLCache {
  export let maxAgeDefault: number = 1;

  export let cacheDir: string = path.join(".vscode", ".acl-cache");
  const cacheMap: Map<string, string> = new Map();

  export function getCacheId(name: string, ...args: string[]): string {
    const id: string = [name, ...args].join("_");
    if (!cacheMap.has(id)) {
      const hash: crypto.Hash = crypto.createHash("MD5");
      hash.update(id);
      cacheMap.set(id, `${cacheDir}/${name}_${hash.digest("hex")}.json`);
    }

    return id;
  }

  export function load(cacehId: string, maxAge: number = maxAgeDefault): any {
    const file: string = cacheMap.get(cacehId);

    if (file && fse.existsSync(file)) {
      const stats: fse.Stats = fse.lstatSync(file);
      const date: Date = stats.mtime;
      const now: Date = new Date();
      const age: number = Math.round((now.getTime() - date.getTime()) / 1000);

      if (age < maxAge * 86400) {
        return fse.readJsonSync(file);
      }
    }

    return undefined;
  }

  export function write(cacehId: string, data: any): any {
    if (data.status != false) {
      const file: string = cacheMap.get(cacehId);
      fse.ensureDirSync(cacheDir);
      fse.writeJsonSync(file, data, { spaces: 2 });
    }
  }

  export function clear() {
    cacheMap.clear();

    fse.removeSync(cacheDir);
  }
}
