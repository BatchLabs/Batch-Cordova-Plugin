import { BatchSDK } from "../../types";
import { Inbox as InboxActions } from "../actions";
import { isNumber, isString, sendToBridge } from "../helpers";
import {
  BatchInboxFetcherInstallationImplementation,
  BatchInboxFetcherUserImplementation,
} from "./inbox/inboxFetcher";

/**
 * Inbox Notification Source enum.
 * A notification source represents how the push was sent from Batch: via the Transactional API, or using a Push Campaign
 *
 * To be used with batch.inbox fetched notifications.
 */
export enum InboxNotificationSource {
  UNKNOWN = 0,
  CAMPAIGN = 1,
  TRANSACTIONAL = 2,
  TRIGGER = 3,
}

export class InboxModule implements BatchSDK.InboxModule {
  public NotificationSource: typeof InboxNotificationSource;

  constructor() {
    this.NotificationSource = InboxNotificationSource;
  }

  async getFetcherForInstallation(
    maxPageSize?: number,
    limit?: number
  ): Promise<BatchSDK.InboxFetcher> {
    const fetcher = new BatchInboxFetcherInstallationImplementation();
    await fetcher.init(maxPageSize, limit);
    return fetcher;
  }

  async getFetcherForUser(
    userIdentifier: string,
    authenticationKey: string,
    maxPageSize?: number,
    limit?: number
  ): Promise<BatchSDK.InboxFetcher> {
    const fetcher = new BatchInboxFetcherUserImplementation(
      userIdentifier,
      authenticationKey
    );
    await fetcher.init(maxPageSize, limit);
    return fetcher;
  }

  private handleFetchCallback(
    rawResponse: string,
    userCallback: (
      error?: Error,
      notifications?: BatchSDK.InboxNotification[]
    ) => void
  ): void {
    if (typeof userCallback !== "function") {
      throw new Error(
        "callback is a required parameter, and must be a function"
      );
    }

    let response: { [key: string]: unknown };
    try {
      response = JSON.parse(rawResponse);
    } catch (e) {
      userCallback(new Error("Internal bridge error"), undefined);
      return;
    }

    if (isString(response.error)) {
      userCallback(new Error(response.error));
      return;
    }

    const rawNotifications = response.notifications;
    if (!Array.isArray(rawNotifications)) {
      userCallback(new Error("Internal error: malformed notifications"));
      return;
    }

    const notifications: BatchSDK.InboxNotification[] = [];
    rawNotifications.forEach((rawNotif) => {
      try {
        notifications.push(this.parseBridgeNotification(rawNotif));
      } catch (e) {
        // TODO: Debug log?
      }
    });

    userCallback(undefined, notifications);
  }

  private parseBridgeNotification(notif: {
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
