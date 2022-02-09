import * as winston from "winston";
import Transport from "winston-transport";

export namespace ACLLogger {
  export class ConnectionServerTransport extends Transport {
    constructor(readonly connection: any, opts?: any) {
      super(opts);
    }

    log(info: any, callback: any) {
      setImmediate(() => {
        this.emit("logged", info);
      });
      this.connection.console.log(info);

      callback();
    }
  }

  export interface IAppInfo {
    name: string;
    version: string;
    description: string;
    url: string;
    displayName: string;
    getShortName: () => string;
  }

  export type LogLevel = typeof winston.level;

  export interface ILoggerConfig {
    appInfo: IAppInfo;
    showBanner: boolean;
    logLevel: LogLevel;
    logToFile: boolean;
    logFormat: string;
    label: string;
  }

  export interface ILogger {
    addConnection: (connection: any) => void;
    error: (...args: any) => void;
    warn: (...args: any) => void;
    //help: (...args: any) => void;
    //data: (...args: any) => void;
    info: (...args: any) => void;
    verbose: (...args: any) => void;
    debug: (...args: any) => void;
    //nested: (level: LogLevel, message: string, ...args: any) => void;
    profile: (id: string) => void;
    getConfig: () => ILoggerConfig;
    setConfig: (newConfig: Partial<ILoggerConfig>) => void;
  }

  export interface IAppOptions {
    appInfo: IAppInfo;
  }

  const shortTextFormat = winston.format.printf(
    ({ level, message, label, timestamp }) => {
      if (message.indexOf("\n") > -1) {
        message = ("\n" + message).replaceAll("\n", "\n\t");
      }

      return `${timestamp} [${label}] ${level
        .substring(0, 1)
        .toUpperCase()}: ${message}`;
    }
  );

  const longTextFormat = winston.format.printf(
    ({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    }
  );

  class Logger implements ILogger {
    private _config: ILoggerConfig = {
      appInfo: undefined,
      logLevel: "info",
      showBanner: true,
      logToFile: false,
      logFormat: "text",
      label: undefined,
    };

    private _id: string;
    private _logger!: winston.Logger;
    private _firstLog: boolean = true;

    constructor(id: string, config: Partial<ILoggerConfig>) {
      this._id = id.trim().toLowerCase();

      this.setConfig(config);
    }

    getConfig(): ILoggerConfig {
      return this._config;
    }

    setConfig(newConfig: Partial<ILoggerConfig>) {
      this._config = { ...this._config, ...newConfig };

      const options: winston.LoggerOptions = {
        exitOnError: false,
        handleExceptions: false,
        level: this._config.logLevel,
        levels: winston.config.npm.levels,
        format: winston.format.combine(
          winston.format.splat(),
          //winston.format.colorize({ all: false }),
          winston.format.label({
            label: this._config.label
              ? this._config.label
              : this._config.appInfo?.getShortName(),
          }),
          winston.format.timestamp({ format: "HH:mm:ss" }),
          shortTextFormat
        ),
        transports: [new winston.transports.Console()], // { handleExceptions: true }
      };

      if (this._logger) {
        this._logger.configure(options);
      } else {
        this._logger = winston.createLogger(options);
      }

      if (this._config.logToFile) {
        if (this._config.logFormat === "text") {
          this._logger.add(
            new winston.transports.File({
              level: "debug",
              filename: this._id + ".log",
              //dirname: outDir,
              format: longTextFormat,
            })
          );
        } else {
          this._logger.add(
            new winston.transports.File({
              level: "debug",
              filename: this._id + ".log.json",
              //dirname: outDir,
              format: winston.format.json(),
            })
          );
        }
      }
    }

    addConnection(connection: any) {
      // this._logger.add(
      //   new ConnectionServerTransport(connection, {
      //     level: undefined, //this._config.logLevel,
      //     levels: winston.config.npm.levels,
      //     format: winston.format.combine(
      //       winston.format.splat(),
      //       winston.format.label({
      //         label: this._config.label
      //           ? this._config.label
      //           : this._config.appInfo?.getShortName(),
      //       }),
      //       winston.format.timestamp({ format: "HH:mm:ss" }),
      //       shortFileTextFormat
      //     ),
      //   })
      // );
    }

    removeTransport(transport: winston.transport) {
      this._logger.remove(transport);
    }

    // nested(level: LogLevel, message: string, ...args: any) {
    //   this.consoleLog(level, message);

    //   Object.keys(args).forEach((key) => {
    //     const item: any = args[key];

    //     if (Array.isArray(item)) {
    //       const aitem: any[] = item;
    //       aitem.forEach((element: any) => {
    //         this.consoleLog(level, "> %s", element);
    //       });
    //     } else if (typeof args[key] === "object") {
    //       this.nested(level, key, args[key]);
    //     } else {
    //       this.consoleLog(level, ">  %s = %s", key, args[key]);
    //     }
    //   });
    // }

    private consoleLog(level: LogLevel, message: string, ...data: any) {
      if (this._firstLog) {
        this._firstLog = false;
        this.showHeader();
      }

      this._logger.log(level, message, ...data);
    }

    // help(...args: any) {
    //   //this.consoleLog("help", args[0], args.slice(1));
    // }

    // data(level: LogLevel, ...args: any) {
    //   this.consoleLog(level, args[0], args.slice(1));
    // }

    debug(...args: any) {
      this.consoleLog("debug", args[0], args.slice(1));
    }

    error(...args: any[]) {
      this.consoleLog("error", args[0], args.slice(1));
    }

    warn(...args: any[]) {
      this.consoleLog("warn", args[0], args.slice(1));
    }

    info(...args: any[]) {
      this.consoleLog("info", args[0], args.slice(1));
    }

    verbose(...args: any[]) {
      //if (this._logger.isVerboseEnabled()) {
      this.consoleLog("verbose", args[0], args.slice(1));
      //}
    }

    profile(id: string) {
      this._logger.profile(id);
    }

    private appText(appInfo: IAppInfo): string[] {
      return [
        `${appInfo.displayName} [${appInfo.name}] ${appInfo.version}`,
        `${appInfo.description}`,
        "",
      ];
    }

    // prettier-ignore
    private banner(appInfo: IAppInfo): string[] {
      const SIZE_LINE: number = 76;
      const center = (text: string): string => {
        const rest: number = (SIZE_LINE - text.length) % 2;
        
        return (
          "-".padEnd((SIZE_LINE - text.length) / 2, "-") +
          `< ${text} >` +
          "-".padStart((SIZE_LINE - text.length) / 2 + rest, "-")
        );
      };
      const center2 = (text: string): string => {
        const rest: number = (SIZE_LINE - text.length) % 2;

        return (
          "|".padEnd((SIZE_LINE - text.length) / 2, " ") +
          `  ${text}  ` +
          "|".padStart((SIZE_LINE - text.length) / 2 + rest, " ")
        );
      };

		//const track: string = "\0xEF\0xB9\0x8C";

		return [
      // '/===========================v======================================================\\',
      // '|     /////// ////// ////// | AC TOOLS - Extensions for VS-Code and NodeJS         |',
      // '|    //   // //       //    | (C) 2020 Alan Candido (BRODAO) <brodao@gmail.com>    |',
      // '|   /////// //       //     | https://github.com/brodao/actools-extensions         |',
      // `|  //   // //       //      | ${appInfo.name.padEnd( 40, ' ' )} [${appInfo.version.padStart(9, ' ')}] |`,
      // `| //   // //////   //       | ${appInfo.description.padEnd(52, ' ')} |`,
      // '\\===========================^======================================================/',
      center(appInfo.displayName),
      // "    o O O    ___      ___      _____    ___      ___     _         ___  ",
      // "   o   _    /   \\    / __|    |_   _|  / _ \\    / _ \\   | |       / __| ",
      // "  _Y__[O]   | - |   | (__       | |   | (_) |  | (_) |  | |__     \\__ \\ ",
      // " {======|  _|_|_|_  _\\___|_  ___|_|_  _\\___/_  _\\___/_  |____|_  _|___/_",
      // "./o--000' \"`-0-0-' \"`-0-0-' \"`-0-0-' \"`-0-0-' \"`-0-0-' \"`-0-0-' \"`-0-0-'",
      center2(`        O             ___       __               _        ___      ___  `),
      center2(`    o O              /   \\    / __|             | |      /   \\    | _ ) `),
      center2(`   o  _____          | - |   | (__              | |__    | - |    | _ \\ `),
      center2(`  []__[O]_           |_|_|    \\___|             |____|   |_|_|    |___/ `),
      center2(` {======| _\\"""""/ _|"""""| _|"""""| _\\"""""/ _|"""""| _|"""""| _|"""""|`),
      center2(`./o=-000' "'-0^0-' "'-0^0-' "'-0^0-' "'-0^0-' "'-0^0-' "'-0^0-' "'-0^0-'`),
      center2("  "),
      center(appInfo.description),
      `${"Extensions for VS-Code and NodeJS".padEnd(40)}${appInfo.name.padStart(
        40
      )}`,
      `${"(C) 2020-22 Alan Candido (bródão)".padEnd(40)}${"Versão: "
        .concat(appInfo.version)
        .padStart(40)}`,
      `${"brodao@gmail.com".padEnd(30)}${appInfo.url.padStart(50)}`,
      "",
    ];
		}

    private showHeader() {
      if (this._config.appInfo) {
        if (!this._config.showBanner) {
          this.appText(this._config.appInfo).forEach((line: string) => {
            this._logger.log("info", line);
          });
        } else {
          this._logger.log(
            "info",
            this.banner(this._config.appInfo).join("\n")
          );

          // this._logger.log("info", "--------------------------------------");

          // this.banner(this._config.appInfo).forEach((line: string) => {
          //   this._logger.log("info", line);
          // });
        }
      }
    }
  }

  const loggerMap: Map<string, ILogger> = new Map<string, ILogger>();
  let _instance: ILogger;

  export function instance(): ILogger {
    return _instance;
  }

  export function getLogger(id: string): ILogger {
    return loggerMap.get(id);
  }

  export function createLogger(
    id: string,
    config: Partial<ILoggerConfig>
  ): ILogger {
    const newLogger: ILogger = new Logger(id, config);
    loggerMap.set(id, newLogger);

    if (!_instance) {
      _instance = newLogger;
    }

    return newLogger;
  }
}
