import * as Actions from "./actions";
import { Consts } from "./consts";
import { BatchEventAttributes } from "./modules/profile/batchEventAttributes";

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

// Promise version of sendToBridge that
// expects a JSON object to be returned from the bridge
export async function invokeModernBridge(
  method:
    | Actions.Core
    | Actions.Push
    | Actions.Messaging
    | Actions.Inbox
    | Actions.User
    | Actions.ProfileAttributeOperation
    | Actions.Internal,
  args?: unknown | null
): Promise<{ [key: string]: unknown } | void> {
  return new Promise((resolve, reject) => {
    sendToBridge(
      (result?: string | null) => {
        // Bridge supports empty results
        if (result === undefined || result === null || result === "") {
          resolve();
          return;
        }

        const resultObj = JSON.parse(result);

        if (typeof resultObj !== "object") {
          reject("Internal error: malformed modern bridge response");
          return;
        }

        if (isString(resultObj.error)) {
          reject(resultObj.error);
          return;
        }

        resolve(resultObj);
      },
      method,
      args !== undefined ? [args] : null
    );
  });
}

export function sendToBridge(
  callback: ((result: string) => void) | null,
  method:
    | Actions.Core
    | Actions.Push
    | Actions.Messaging
    | Actions.Inbox
    | Actions.User
    | Actions.Profile
    | Actions.ProfileAttributeOperation
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

// Promise version of sendToBridge that always resolves a Promise
// with the bridge reply, no matter if it is a success or a failure.
export async function sendToBridgePromise(
  method:
    | Actions.Core
    | Actions.Push
    | Actions.Messaging
    | Actions.Inbox
    | Actions.User
    | Actions.Profile
    | Actions.ProfileAttributeOperation
    | Actions.Internal,
  args: unknown[] | null
): Promise<undefined | string> {
  return new Promise((resolve) => {
    sendToBridge(
      (result) => {
        resolve(result);
      },
      method,
      args
    );
  });
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

export const isObject = (value: unknown): value is BatchEventAttributes => {
  return value instanceof BatchEventAttributes;
};

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every((it) => isString(it));
}

export function isObjectArray(value: unknown): value is BatchEventAttributes[] {
  return isArray(value) && value.every((it) => isObject(it));
}
