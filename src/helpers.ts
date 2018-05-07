import * as Actions from "./actions";
import { Consts } from "./consts";

export function writeBatchLog(debug: boolean, ...message: any[]) {
  const args = ["[Batch]"].concat(Array.prototype.slice.call(arguments, 1));
  if (Consts.DevelopmentMode === true && debug === true) {
    console.debug.apply(console, args);
  } else if (debug === false) {
    console.log.apply(console, args);
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
  args: any[] | null
) {
  // The Bridge never fails as far as Cordova is concerned, but the callback can have a negative response
  // It will need to be handled on a per-case basis
  cordova.exec(
    callback || (() => {}),
    () => {},
    Consts.BatchPluginName,
    "BA_" + method,
    args != null ? args : [{}]
  );
}

export function isString(value: any): value is string {
  return value instanceof String || typeof value === "string";
}

export function isNumber(value: any): value is number {
  return value instanceof Number || typeof value === "number";
}
