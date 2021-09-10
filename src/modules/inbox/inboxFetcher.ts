import { BatchSDK } from "../../../types";

abstract class BatchInboxFetcherBaseImplementation
  implements BatchSDK.InboxFetcher {
  abstract init(maxPageSize?: number, limit?: number): Promise<void>;

  fetchNewNotifications(): Promise<BatchSDK.InboxFetchResult> {
    throw new Error("Method not implemented.");
  }

  fetchNextPage(): Promise<BatchSDK.InboxFetchResult> {
    throw new Error("Method not implemented.");
  }

  markNotificationAsRead(notification: BatchSDK.InboxNotification): void {
    throw new Error("Method not implemented.");
  }

  markAllNotificationsAsRead(): void {
    throw new Error("Method not implemented.");
  }

  markNotificationAsDeleted(notification: BatchSDK.InboxNotification): void {
    throw new Error("Method not implemented.");
  }

  dispose(): void {
    throw new Error("Method not implemented.");
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
