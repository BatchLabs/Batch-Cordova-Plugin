import { BatchSDK } from "../../../types";
import { Inbox as InboxAction } from "../../actions";
import { invokeModernBridge, isNumber, isString } from "../../helpers";
import { InboxModule, InboxNotificationSource } from "../inbox";

abstract class BatchInboxFetcherBaseImplementation
  implements BatchSDK.InboxFetcher {
  private _disposed = false;
  private _fetcherID?: string;

  abstract init(maxPageSize?: number, limit?: number): Promise<void>;

  async fetchNewNotifications(): Promise<BatchSDK.InboxFetchResult> {
    throw new Error("Method not implemented.");
  }

  async fetchNextPage(): Promise<BatchSDK.InboxFetchResult> {
    throw new Error("Method not implemented.");
  }

  async markNotificationAsRead(
    notification: BatchSDK.InboxNotification
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async markAllNotificationsAsRead(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async markNotificationAsDeleted(
    notification: BatchSDK.InboxNotification
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  dispose(): void {
    this._disposed = true;
    if (this._fetcherID !== undefined) {
      invokeModernBridge(
        InboxAction.ReleaseFetcher,
        this._makeBaseBridgeParameters()
      );
    }
  }

  protected _makeBaseBridgeParameters() {
    if (this._fetcherID === undefined) {
      throw "Internal Error: Missing internal fetcher ID";
    }
    return { fetcherID: this._fetcherID };
  }

  protected _throwIfDisposed(): void {
    if (this._disposed) {
      throw new Error(
        "DisposedInboxError: BatchInboxFetcher instances cannot be used anymore once .dispose() has been called."
      );
    }
  }

  protected _parseBridgeNotification(notif: {
    [key: string]: unknown;
  }): BatchSDK.InboxNotification {
    if (typeof notif !== "object" || notif === null) {
      throw new Error("Raw notification is not an object");
    }

    const body = notif.body;
    if (!isString(body)) {
      throw new Error("An Inbox Notification must at least have a body");
    }

    const identifier = notif.identifier;
    if (!isString(identifier)) {
      throw new Error("An Inbox Notification must at least have an identifier");
    }

    const rawDate = notif.date; // ts in ms
    if (!isNumber(rawDate)) {
      throw new Error("An Inbox Notification must at least have a date");
    }

    const isUnread = notif.is_unread;
    if (typeof isUnread !== "boolean") {
      throw new Error("An Inbox Notification must at least have a read flag");
    }

    let source = notif.source;
    if (!isNumber(source)) {
      throw new Error("An Inbox Notification must at least have a source");
    }
    if (
      source !== InboxNotificationSource.CAMPAIGN &&
      source !== InboxNotificationSource.TRANSACTIONAL &&
      source !== InboxNotificationSource.TRIGGER &&
      source !== InboxNotificationSource.UNKNOWN
    ) {
      source = InboxNotificationSource.UNKNOWN;
    }

    const parsedNotif: BatchSDK.InboxNotification = {
      body,
      date: new Date(rawDate),
      identifier,
      isUnread,
      payload: {},
      source: source as InboxModule["NotificationSource"],
    };

    if (isString(notif.ios_attachment_url)) {
      parsedNotif.iOSAttachmentURL = notif.ios_attachment_url;
    }

    // TODO: make sure it's uniform with batchPushReceived
    if (typeof notif.payload === "object" && notif.payload !== null) {
      parsedNotif.payload = notif.payload as { [key: string]: unknown };
    }

    if (isString(notif.title)) {
      parsedNotif.title = notif.title;
    }

    return parsedNotif;
  }
}

export class BatchInboxFetcherInstallationImplementation extends BatchInboxFetcherBaseImplementation {
  constructor() {
    super();
  }

  init(maxPageSize?: number, limit?: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export class BatchInboxFetcherUserImplementation extends BatchInboxFetcherBaseImplementation {
  constructor(userIdentifier: string, authenticationKey: string) {
    super();
  }

  init(maxPageSize?: number, limit?: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
