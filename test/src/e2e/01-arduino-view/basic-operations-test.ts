import { describe, before, it } from "mocha";
import { OutputAclPageObject } from './page-objects/output-acl-po';
import { WorkbenchPageObject } from "./page-objects/workbench-po";

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

  // it("Console log (Local Server)", async () => {
  //   await outputPO.validServerSequenceTest();
  // });
});
