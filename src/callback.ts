import { Internal as InternalActions } from "./actions";
import { Consts } from "./consts";
import { isString, writeBatchLog } from "./helpers";

export enum CallbackAction {
  Log = "_log",
  Eval = "_eval",
  DispatchPush = "_dispatchPush",
  DispatchMessagingEvent = "_dispatchMessagingEvent",
  OnBridgeFailure = "onBridgeFailure",
}

interface ICallbackDispatchPushData {
  action: CallbackAction.DispatchPush;
  payload: { [key: string]: unknown };
  hasLandingMessage?: boolean;
}

interface ICallbackDispatchMessagingEventData {
  action: CallbackAction.DispatchMessagingEvent;
  lifecycleEvent: string;
  messageIdentifier?: string | null;
}

interface ICallbackLogData {
  action: CallbackAction.Log;
  message: string;
}

interface ICallbackEvalData {
  action: CallbackAction.Eval;
  command: string;
}

interface ICallbackOnBridgeFailureData {
  action: CallbackAction.OnBridgeFailure;
  result: string;
}

export class CallbackHandler {
  public setup(): void {
    // Don't call sendToBridge because we don't want to have the BA_ prefix
    cordova.exec(
      this.handleCallback,
      () => {},
      Consts.BatchPluginName,
      InternalActions.SetupCallback,
      [{}]
    );
  }

  private handleCallback(
    callbackData:
      | ICallbackDispatchPushData
      | ICallbackDispatchMessagingEventData
      | ICallbackLogData
      | ICallbackEvalData
      | ICallbackOnBridgeFailureData
  ) {
    if (callbackData.action !== CallbackAction.Log) {
      writeBatchLog(true, "Got callback from Batch", callbackData);
    }

    switch (callbackData.action) {
      case CallbackAction.DispatchPush: {
        const pushPayload = callbackData.payload;
        for (const key in pushPayload) {
          if (Object.prototype.hasOwnProperty.call(pushPayload, key)) {
            const value = pushPayload[key];
            if (typeof value === "string") {
              try {
                pushPayload[key] = JSON.parse(value);
                // If the result is not an object (and an array is an object), rollback
                if (typeof pushPayload[key] !== "object") {
                  pushPayload[key] = value;
                }
              } catch (err) {
                // Decoding JSON can fail on strings that aren't meant to be objects,
                // so silently ignore this
              }
            } else if (
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              pushPayload[key] = String(value);
            }
          }
        }

        let hasLandingMessage = false;
        if (callbackData.hasLandingMessage === true) {
          hasLandingMessage = true;
        }

        cordova.fireDocumentEvent("batchPushReceived", {
          hasLandingMessage,
          payload: pushPayload,
        });
        break;
      }
      case CallbackAction.DispatchMessagingEvent: {
        const lifecycleEventName = callbackData.lifecycleEvent;
        let publicEventName: string;

        // tslint:disable:triple-equals
        if ("shown" == lifecycleEventName) {
          publicEventName = "batchMessageShown";
        } else if ("closed" == lifecycleEventName) {
          publicEventName = "batchMessageClosed";
        } else {
          writeBatchLog(
            true,
            "Unknown messaging lifecycle event, can't forward",
            callbackData.lifecycleEvent
          );
          break;
        }
        // tslint:enable:triple-equals

        const payload: {
          messageIdentifier?: string;
        } = {};

        if (isString(callbackData.messageIdentifier)) {
          payload.messageIdentifier = callbackData.messageIdentifier;
        }

        cordova.fireDocumentEvent(publicEventName, payload);
        break;
      }
      case CallbackAction.Log:
        // Don't use writeBatchLog on purpose
        if (console && console.log) {
          console.log(callbackData.message); // tslint:disable-line
        }
        break;
      case CallbackAction.Eval:
        // This case is because Cordova Android's evaljs is deprecated.
        // Using a callback to eval is their recommended solution
        eval(callbackData.command); // tslint:disable-line
        break;
      case CallbackAction.OnBridgeFailure:
        // todo: check that const's value
        writeBatchLog(false, "Internal Bridge error", callbackData.result);
        break;
    }
  }
}
