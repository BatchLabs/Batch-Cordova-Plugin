import { BatchSDK } from "../../../types";
import { Inbox as InboxAction } from "../../actions";
import { invokeModernBridge, isNumber, isString } from "../../helpers";
import { InboxModule, InboxNotificationSource } from "../inbox";
import { BatchInboxFetchResult } from "./inboxFetchResult";

interface BridgeNotificationListResponse {
  notifications?: [{ [key: string]: unknown }];
}

interface BridgeNotificationPageResponse {
  notifications?: [{ [key: string]: unknown }];
  endReached: boolean;
}

abstract class BatchInboxFetcherBaseImplementation
  implements BatchSDK.InboxFetcher {
  private _disposed = false;
  protected _fetcherID?: string;

  abstract init(maxPageSize?: number, limit?: number): Promise<void>;

  async getAllFetchedNotifications(): Promise<BatchSDK.InboxNotification[]> {
    await this._throwIfDisposed();

    const rawResponse = await invokeModernBridge(
      InboxAction.GetFetchedNotifications,
      this._makeBaseBridgeParameters()
    );

    if (!rawResponse) {
      throw new Error("Internal Error: Empty inbox bridge response (-7)");
    }

    const castedResponse = (rawResponse as unknown) as BridgeNotificationListResponse;
    if (!castedResponse.notifications) {
      throw new Error("Internal Error: Malformed inbox bridge response (-8)");
    }

    return this._parseBridgeNotifications(castedResponse.notifications);
  }

  async fetchNewNotifications(): Promise<BatchSDK.InboxFetchResult> {
    await this._throwIfDisposed();

    const rawResponse = await invokeModernBridge(
      InboxAction.FetchNewNotifications,
      this._makeBaseBridgeParameters()
    );

    if (!rawResponse) {
      throw new Error("Internal Error: Empty inbox bridge response (-4)");
    }

    const castedResponse = (rawResponse as unknown) as BridgeNotificationPageResponse;
    if (!castedResponse.notifications) {
      throw new Error("Internal Error: Malformed inbox bridge response (-5)");
    }

    return new BatchInboxFetchResult(
      this._parseBridgeNotifications(castedResponse.notifications),
      !!castedResponse.endReached
    );
  }

  async fetchNextPage(): Promise<BatchSDK.InboxFetchResult> {
    await this._throwIfDisposed();

    const rawResponse = await invokeModernBridge(
      InboxAction.FetchNextPage,
      this._makeBaseBridgeParameters()
    );

    if (!rawResponse) {
      throw new Error("Internal Error: Empty inbox bridge response (-5)");
    }

    const castedResponse = (rawResponse as unknown) as BridgeNotificationPageResponse;
    if (!castedResponse.notifications) {
      throw new Error("Internal Error: Malformed inbox bridge response (-6)");
    }

    return new BatchInboxFetchResult(
      this._parseBridgeNotifications(castedResponse.notifications),
      !!castedResponse.endReached
    );
  }

  async markNotificationAsRead(
    notification: BatchSDK.InboxNotification
  ): Promise<void> {
    await this._throwIfDisposed();

    const parameters = this._makeBaseBridgeParameters();
    parameters["notifID"] = notification.identifier;
    await invokeModernBridge(InboxAction.MarkAsRead, parameters);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this._throwIfDisposed();

    await invokeModernBridge(
      InboxAction.MarkAllAsRead,
      this._makeBaseBridgeParameters()
    );
  }

  async markNotificationAsDeleted(
    notification: BatchSDK.InboxNotification
  ): Promise<void> {
    await this._throwIfDisposed();

    const parameters = this._makeBaseBridgeParameters();
    parameters["notifID"] = notification.identifier;
    await invokeModernBridge(InboxAction.MarkAsDeleted, parameters);
  }

  dispose(): void {
    this._disposed = true;
    if (this._fetcherID !== undefined) {
      invokeModernBridge(
        InboxAction.ReleaseFetcher,
        this._makeBaseBridgeParameters()
      ).catch(() => {});
    }
  }

  protected _makeBaseInitParameters(maxPageSize?: number, limit?: number) {
    const params: { maxPageSize?: number; limit?: number } = {};

    if (maxPageSize) {
      params["maxPageSize"] = maxPageSize;
    }

    if (limit) {
      params["limit"] = limit;
    }

    return params;
  }

  protected _makeBaseBridgeParameters(): { [key: string]: string } {
    if (this._fetcherID === undefined) {
      throw "Internal Error: Missing internal fetcher ID";
    }
    return { fetcherID: this._fetcherID };
  }

  protected _throwIfDisposed(): Promise<void> {
    if (this._disposed) {
      return Promise.reject(
        new Error(
          "DisposedInboxError: BatchInboxFetcher instances cannot be used anymore once .dispose() has been called."
        )
      );
    }
    return Promise.resolve();
  }

  protected _parseBridgeNotifications(
    response: [{ [key: string]: unknown }]
  ): BatchSDK.InboxNotification[] {
    if (!Array.isArray(response)) {
      throw new Error("Internal Error: Malformed inbox bridge response (-7)");
    }

    return response.map(this._parseBridgeNotification);
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

    const identifier = notif.id;
    if (!isString(identifier)) {
      throw new Error("An Inbox Notification must at least have an identifier");
    }

    const rawDate = notif.date; // ts in ms
    if (!isNumber(rawDate)) {
      throw new Error("An Inbox Notification must at least have a date");
    }

    const isUnread = notif.isUnread;
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

  async init(maxPageSize?: number, limit?: number): Promise<void> {
    const bridgeParameters = this._makeBaseInitParameters(maxPageSize, limit);
    const response = (await invokeModernBridge(
      InboxAction.CreateInstallationFetcher,
      bridgeParameters
    )) as void | { fetcherID?: string };
    const fetcherID = response?.fetcherID;
    if (fetcherID && fetcherID.length > 0) {
      this._fetcherID = fetcherID;
    } else {
      throw new Error(
        "Internal error: Failed to create installation inbox fetcher"
      );
    }
  }
}

export class BatchInboxFetcherUserImplementation extends BatchInboxFetcherBaseImplementation {
  private _userIdentifier: string;
  private _authenticationKey: string;

  constructor(userIdentifier: string, authenticationKey: string) {
    super();
    this._userIdentifier = userIdentifier;
    this._authenticationKey = authenticationKey;
  }

  async init(maxPageSize?: number, limit?: number): Promise<void> {
    const bridgeParameters = this._makeBaseInitParameters(
      maxPageSize,
      limit
    ) as { [key: string]: string };

    bridgeParameters["user"] = this._userIdentifier;
    bridgeParameters["authKey"] = this._authenticationKey;

    const response = (await invokeModernBridge(
      InboxAction.CreateUserFetcher,
      bridgeParameters
    )) as void | { fetcherID?: string };
    const fetcherID = response?.fetcherID;
    if (fetcherID && fetcherID.length > 0) {
      this._fetcherID = fetcherID;
    } else {
      throw new Error(
        "Internal error: Failed to create installation user fetcher"
      );
    }
  }
}
