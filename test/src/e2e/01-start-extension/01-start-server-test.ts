import { expect } from "chai";
import { describe, before, after } from "mocha";
import {
  OutputAclPageObject,
  START_SERVER_BLOCK,
} from "../page-objects/output-acl-po";
import { WorkbenchPageObject } from "../page-objects/workbench-po";

describe("Arduino View", async () => {
  let workbenchPO: WorkbenchPageObject;
  let outputPO: OutputAclPageObject;

  before(async () => {
    workbenchPO = await WorkbenchPageObject.openProject();
    outputPO = await workbenchPO.openOutputAcl();
  });

  after(async () => {
    await workbenchPO.closeProject();
  });

  it("Console log (Local Server)", async () => {
    const text: string[] = await outputPO.extractServerStartSequence();

    expect(text).is.eqls(START_SERVER_BLOCK);
  });
});
