import { OutputPageObject } from "./output-po";

export const START_SERVER_BLOCK: String[] = [
  "--------< Arduino development environment and similars. Fast and easy! >--------",
  "Extensions for VS-Code and NodeJS                             acl-arduino-server",
  "(C) 2020-22 Alan Candido (bródão)                                  Versão: 0.0.1",
  "brodao@gmail.com                       https://github.com/brodao/acl-arduino.git",
  "",
  "I: Started and initialize received. WS Count: 1",
];

export const START_SERVER_IDENTIFY_BLOCK: RegExp[] = [
  /--------< Arduino development/i,
  /I: Started and initialize/i,
];

export class OutputAclPageObject extends OutputPageObject {
  constructor() {
    super("AC Lab Service");
  }

  async extractServerStartSequence(): Promise<string[]> {
    return await this.extractSequenceTest(
      START_SERVER_IDENTIFY_BLOCK[0],
      START_SERVER_IDENTIFY_BLOCK[1]
    );
  }

  // async compileSequenceSingleFileTest(): Promise<void> {
  //   const sequence: RegExp[] = [
  //     /(Starting compile)/,
  //     /(Starting build for environment)/,
  //     /(Starting build using RPO token)/,
  //     /(Start file compile)/,
  //     /(Using Includes:)/,
  //     /(Start secure compiling.*1\/1)/,
  //     /(.*)/,
  //     /((Aborting|Committing) end build)/,
  //     /(All files compiled.*)/,
  //     /(Compile finished)/,
  //   ];

  //   return await this.sequenceDefaultTest(sequence);
  // }

  // async compileSequenceFolderTest(total: number): Promise<void> {
  //   const startSecure = (): RegExp[] => {
  //     const block: RegExp[] = [];
  //     let seq: number = 1;

  //     do {
  //       block.push(new RegExp(`(Start secure compiling.*${seq}/${total})`));
  //       block.push(/(.*)/);
  //       seq++;
  //     } while (seq <= total);

  //     return block;
  //   };

  //   const sequence: RegExp[] = [
  //     /(Starting compile)/,
  //     /(Starting build for environment)/,
  //     /(Starting build using RPO token)/,
  //     /(Start compile of)/,
  //     /(Using Includes:)/,
  //     ...startSecure(),
  //     /((Aborting|Committing) end build)/,
  //     /(All files compiled|One or more files have errors)/,
  //     /(Compile finished)/,
  //   ];

  //   return await this.sequenceDefaultTest(sequence);
  // }
}
