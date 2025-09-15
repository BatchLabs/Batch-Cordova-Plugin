/* tslint:disable:no-bitwise */

import { BatchSDK } from "../../types";
import { Push as PushActions } from "../actions";
import {
  invokeModernBridge,
  sendToBridge,
  sendToBridgePromise,
  writeBatchLog,
} from "../helpers";

/**
 * iOS Notification Types enum.
 */
export enum iOSNotificationTypes {
  NONE = 0,
  BADGE = 1 << 0,
  SOUND = 1 << 1,
  ALERT = 1 << 2,
}

export class PushModule implements BatchSDK.PushModule {
  public iOSNotificationTypes: typeof iOSNotificationTypes;

  constructor() {
    this.iOSNotificationTypes = iOSNotificationTypes;
  }

  public refreshToken(): void {
    sendToBridge(null, PushActions.RefreshToken, null);
  }

  public requestNotificationAuthorization(): void {
    sendToBridge(null, PushActions.RequestAuthorization, null);
  }

  public requestProvisionalNotificationAuthorization(): void {
    sendToBridge(null, PushActions.RequestProvisionalAuthorization, null);
  }

  public setAndroidShowNotifications(show: boolean): void {
    if (typeof show !== "boolean") {
      writeBatchLog(
        false,
        "setAndroidShowNotifications expects a boolean argument"
      );
      return;
    } else {
      sendToBridge(null, PushActions.SetAndroidShowNotifications, [{ show }]);
    }
  }

  public async shouldShowAndroidNotifications(): Promise<undefined | boolean> {
    const { shouldShow } = (await invokeModernBridge(
      PushActions.ShouldShowAndroidNotifications
    )) as { shouldShow: boolean };
    return shouldShow;
  }

  public setiOSNotificationTypes(notifTypes: iOSNotificationTypes): void {
    if (typeof notifTypes !== "number") {
      writeBatchLog(
        false,
        "notifTypes must be a number (of the iOSNotificationTypes enum)"
      );
      return;
    } else {
      sendToBridge(null, PushActions.SetIOSNotifTypes, [{ notifTypes }]);
    }
  }

  public setiOSShowForegroundNotifications(showForeground: boolean): void {
    if (typeof showForeground !== "boolean") {
      writeBatchLog(
        false,
        "setiOSShowForegroundNotifications expects a boolean argument"
      );
      return;
    } else {
      sendToBridge(null, PushActions.SetIOSShowForegroundNotifications, [
        { showForeground },
      ]);
    }
  }

  public clearBadge(): void {
    sendToBridge(null, PushActions.ClearBadge, null);
  }

  public dismissNotifications(): void {
    sendToBridge(null, PushActions.DismissNotifications, null);
  }

  public getLastKnownPushToken(): Promise<undefined | string> {
    return sendToBridgePromise(PushActions.GetLastKnownPushToken, null);
  }
}
