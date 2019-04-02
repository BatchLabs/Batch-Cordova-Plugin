import { InboxNotificationSource } from "./modules/inbox";
import { AndroidNotificationTypes, iOSNotificationTypes } from "./modules/push";

/* tslint:disable:no-console */

class MessagingStub implements BatchSDK.MessagingModule {
  public setDoNotDisturbEnabled(enabled: boolean) {}
  public showPendingMessage() {}
}

class PushStub implements BatchSDK.PushModule {
  public AndroidNotificationTypes: typeof AndroidNotificationTypes;
  public iOSNotificationTypes: typeof iOSNotificationTypes;

  constructor() {
    this.AndroidNotificationTypes = AndroidNotificationTypes;
    this.iOSNotificationTypes = iOSNotificationTypes;
  }

  public registerForRemoteNotifications() {}
  public setAndroidNotificationTypes(notifTypes: any) {}
  public setiOSNotificationTypes(notifTypes: any) {}
  public clearBadge() {}
  public dismissNotifications() {}
  public getLastKnownPushToken(resultCallback: (token: string) => void) {}
}

class UserStub implements BatchSDK.UserModule {
  public eventData: typeof BatchSDK.BatchEventData;

  constructor() {
    this.eventData = BatchEventDataStub;
  }

  public getInstallationID(resultCallback: (installationID: string) => void) {}
  public getEditor(): BatchSDK.BatchUserDataEditor {
    return new BatchUserDataEditorStub();
  }
  public printDebugInformation() {}
  public trackEvent(name: string, label?: string, data?: any) {}
  public trackTransaction(amount: number, data?: { [key: string]: any }) {}
  public trackLocation(location: BatchSDK.Location): void {}
}

class InboxStub implements BatchSDK.InboxModule {
  public NotificationSource: typeof InboxNotificationSource;

  constructor() {
    this.NotificationSource = InboxNotificationSource;
  }

  public fetchNotifications(
    callback: (
      error?: Error,
      notifications?: BatchSDK.InboxNotification[]
    ) => void
  ) {}
  public fetchNotificationsForUserIdentifier(
    userIdentifier: string,
    authenticationKey: string,
    callback: (
      error?: Error,
      notifications?: BatchSDK.InboxNotification[]
    ) => void
  ) {}
}

class BatchEventDataStub implements BatchSDK.BatchEventData {
  public addTag(tag: string): BatchSDK.BatchEventData {
    return this;
  }

  public put(key: any, value: string | number | boolean) {
    return this;
  }
}

class BatchUserDataEditorStub implements BatchSDK.BatchUserDataEditor {
  public setLanguage(language: string | null) {
    return this;
  }
  public setRegion(region: string | null) {
    return this;
  }
  public setIdentifier(identifier: string | null) {
    return this;
  }
  public setAttribute(key: string, value: string | number | boolean | Date) {
    return this;
  }
  public removeAttribute(key: string) {
    return this;
  }
  public clearAttributes() {
    return this;
  }
  public addTag(collection: string, tag: string) {
    return this;
  }
  public removeTag(collection: string, tag: string) {
    return this;
  }
  public clearTags() {
    return this;
  }
  public clearTagCollection(collection: string) {
    return this;
  }
  public save() {
    return this;
  }
}

class BatchStub implements BatchSDK.Batch {
  public push: BatchSDK.PushModule;
  public user: BatchSDK.UserModule;
  public messaging: BatchSDK.MessagingModule;
  public inbox: BatchSDK.InboxModule;
  constructor() {
    this.push = new PushStub();
    this.user = new UserStub();
    this.messaging = new MessagingStub();
    this.inbox = new InboxStub();
  }
  public on(
    event: string,
    listener: (eventName: string, parameters: any) => void
  ) {}
  public off(event?: string) {}
  public setConfig(config: BatchSDK.Config) {}
  public start() {
    if (console && console.log) {
      console.log("Batch is not supported in this environement");
    }
  }
  public optIn() {}
  public optOut() {}
  public optOutAndWipeData() {}
}

export default BatchStub;
