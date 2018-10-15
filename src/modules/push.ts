/* tslint:disable:no-bitwise */

import { Push as PushActions } from "../actions";
import { sendToBridge, writeBatchLog } from "../helpers";

/**
 * Android Notification Types enum.
 */
export enum AndroidNotificationTypes {
  NONE = 0,
  SOUND = 1 << 0,
  VIBRATE = 1 << 1,
  LIGHTS = 1 << 2,
  ALERT = 1 << 3
}

/**
 * iOS Notification Types enum.
 */
export enum iOSNotificationTypes {
  NONE = 0,
  BADGE = 1 << 0,
  SOUND = 1 << 1,
  ALERT = 1 << 2
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

  public setAndroidNotificationTypes(notifTypes: any): void {
    if (typeof notifTypes !== "number") {
      writeBatchLog(
        false,
        "notifTypes must be a number (of the AndroidNotificationTypes enum)"
      );
    } else {
      sendToBridge(null, PushActions.SetAndroidNotifTypes, [{ notifTypes }]);
    }
  }

  public setiOSNotificationTypes(notifTypes: any): void {
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

  public clearBadge(): void {
    sendToBridge(null, PushActions.ClearBadge, null);
  }

  public dismissNotifications(): void {
    sendToBridge(null, PushActions.DismissNotifications, null);
  }

  public getLastKnownPushToken(resultCallback: (token: string) => void): void {
    sendToBridge(resultCallback, PushActions.GetLastKnownPushToken, null);
  }
}
