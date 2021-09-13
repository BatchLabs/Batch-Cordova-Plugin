import { BatchSDK } from "../../../types";

export class BatchInboxFetchResult implements BatchSDK.InboxFetchResult {
  public notifications: BatchSDK.InboxNotification[];
  public endReached: boolean;

  constructor(
    notifications: BatchSDK.InboxNotification[],
    endReached: boolean
  ) {
    this.notifications = notifications;
    this.endReached = endReached;
  }
}
