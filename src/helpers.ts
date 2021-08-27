import * as Actions from "./actions";
import { Consts } from "./consts";

export function writeBatchLog(debug: boolean, ...message: unknown[]): void {
  const args = (["[Batch]"] as unknown[]).concat(message);
  if (Consts.DevelopmentMode === true && debug === true) {
    if (console && console.debug) {
      console.debug(console, ...args);
    }
  } else if (debug === false) {
    if (console && console.log) {
      console.log(console, ...args);
    }
  }
}

export function sendToBridge(
  callback: ((result: string) => void) | null,
  method:
    | Actions.Core
    | Actions.Push
    | Actions.Messaging
    | Actions.Inbox
    | Actions.User
    | Actions.UserDataOperation
    | Actions.Internal,
  args: unknown[] | null
): void {
  // The Bridge never fails as far as Cordova is concerned, but the callback can have a negative response
  // It will need to be handled on a per-case basis
  cordova.exec(
    (value) => {
      if (callback) {
        callback(value === null ? undefined : value);
      }
    },
    () => {},
    Consts.BatchPluginName,
    "BA_" + method,
    args != null ? args : [{}]
  );
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function isString(value: any): value is string {
  return value instanceof String || typeof value === "string";
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function isNumber(value: any): value is number {
  return (
    value instanceof Number || (typeof value === "number" && !isNaN(value))
  );
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function isBoolean(value: any): value is boolean {
  return value instanceof Boolean || typeof value === "boolean";
}
