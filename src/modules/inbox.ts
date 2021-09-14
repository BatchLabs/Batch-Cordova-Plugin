import { BatchSDK } from "../../types";
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
}
