/* tslint:disable:no-bitwise */

import { BatchSDK } from "../../types";
import { Push as PushActions } from "../actions";
import { sendToBridge, sendToBridgePromise, writeBatchLog } from "../helpers";

/**
 * Android Notification Types enum.
 */
export enum AndroidNotificationTypes {
  NONE = 0,
  SOUND = 1 << 0,
  VIBRATE = 1 << 1,
  LIGHTS = 1 << 2,
  ALERT = 1 << 3,
}

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
  public AndroidNotificationTypes: typeof AndroidNotificationTypes;
  public iOSNotificationTypes: typeof iOSNotificationTypes;

  constructor() {
    this.AndroidNotificationTypes = AndroidNotificationTypes;
    this.iOSNotificationTypes = iOSNotificationTypes;
  }

  public registerForRemoteNotifications(): void {
    sendToBridge(null, PushActions.Register, null);
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

  public setAndroidNotificationTypes(
    notifTypes: AndroidNotificationTypes
  ): void {
    if (typeof notifTypes !== "number") {
      writeBatchLog(
        false,
        "notifTypes must be a number (of the AndroidNotificationTypes enum)"
      );
    } else {
      sendToBridge(null, PushActions.SetAndroidNotifTypes, [{ notifTypes }]);
    }
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
