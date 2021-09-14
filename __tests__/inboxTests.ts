/* eslint-disable @typescript-eslint/no-explicit-any */
// tslint:disable:object-literal-sort-keys

import { Inbox as InboxAction } from "../src/actions";
import { isString } from "../src/helpers";

const MAX_PAGE_SIZE = 10;
const LIMIT = 20;

async function mockedInvokeModernBridge(
  method: InboxAction,
  args?: unknown | null
): Promise<{ [key: string]: unknown } | void> {
  return new Promise((resolve, reject) => {
    mockedSendToBridge(
      (result?: string | null) => {
        // Bridge supports empty results
        if (result === undefined || result === null || result === "") {
          resolve();
          return;
        }

        const resultObj = JSON.parse(result);

        if (typeof resultObj !== "object") {
          reject("Internal error: malformed modern bridge response");
          return;
        }

        if (isString(resultObj.error)) {
          reject(resultObj.error);
          return;
        }

        resolve(resultObj);
      },
      method,
      args !== undefined ? [args] : null
    );
  });
}

function mockedSendToBridge(
  callback: ((result: string) => void) | null,
  method: InboxAction,
  args: unknown[] | null
) {
  if (args === null) {
    args = [];
  }

  if (callback == null) {
    throw new Error("Callback shouldn't be null");
  }

  if (method === InboxAction.CreateInstallationFetcher) {
    const argObject: any = args[0];

    if (argObject.maxPageSize !== MAX_PAGE_SIZE && argObject.limit !== LIMIT) {
      callback(JSON.stringify({ error: "Unexpected limit and page size" }));
      return;
    }

    callback(JSON.stringify({ fetcherID: "abcdef" }));
  } else if (method === InboxAction.CreateUserFetcher) {
    const argObject: any = args[0];

    if (argObject.maxPageSize !== MAX_PAGE_SIZE && argObject.limit !== LIMIT) {
      callback(JSON.stringify({ error: "Unexpected limit and page size" }));
      return;
    }

    if (argObject.user === "testuser" && argObject.authKey === "testauth") {
      callback(JSON.stringify({ fetcherID: "abcdef" }));
    } else {
      callback(JSON.stringify({ error: "Inbox: Invalid user" }));
    }
  } else if (method === InboxAction.FetchNewNotifications) {
    callback(
      JSON.stringify({ notifications: fakeNotifications, endReached: false })
    );
  } else if (method === InboxAction.FetchNextPage) {
    callback(
      JSON.stringify({ notifications: fakeNotifications, endReached: true })
    );
  } else if (method == InboxAction.GetFetchedNotifications) {
    callback(JSON.stringify({ notifications: fakeNotifications }));
  } else if (method == InboxAction.MarkAllAsRead) {
    callback("{}");
  } else if (
    method == InboxAction.MarkAsRead ||
    method == InboxAction.MarkAsDeleted
  ) {
    const argObject: any = args[0];

    if (argObject.notifID !== "1") {
      callback(JSON.stringify({ error: "Wrong notif id" }));
      return;
    }

    callback("{}");
  }
}

jest.doMock("../src/helpers", () => {
  const helpers = jest.requireActual("../src/helpers");
  // tslint:disable-next-line:only-arrow-functions
  return {
    ...helpers,
    sendToBridge: jest.fn(mockedSendToBridge),
    invokeModernBridge: jest.fn(mockedInvokeModernBridge),
  };
});

import { InboxModule } from "../src/modules/inbox";
import { BatchSDK } from "../types";

test("can fetch notifications for the current installation ID", async () => {
  const fetcher = await new InboxModule().getFetcherForInstallation(
    MAX_PAGE_SIZE,
    LIMIT
  );
  const result = await fetcher.fetchNewNotifications();
  expect(result.endReached).toBe(false);
  checkNotificationsContent(result.notifications);
});

test("can fetch notifications by custom ID", async () => {
  const fetcher = await new InboxModule().getFetcherForUser(
    "testuser",
    "testauth",
    MAX_PAGE_SIZE,
    LIMIT
  );
  const result = await fetcher.fetchNewNotifications();
  expect(result.endReached).toBe(false);
  checkNotificationsContent(result.notifications);
});

test("fails on bad custom ID authkey", async () => {
  expect.assertions(1);
  try {
    const fetcher = await new InboxModule().getFetcherForUser(
      "testuser",
      "failure",
      MAX_PAGE_SIZE,
      LIMIT
    );
    await fetcher.fetchNewNotifications();
  } catch (e) {
    expect(e).toBeDefined();
  }
});

test("can mark as read", async () => {
  const fetcher = await new InboxModule().getFetcherForInstallation(
    MAX_PAGE_SIZE,
    LIMIT
  );
  const result = await fetcher.fetchNewNotifications();
  await fetcher.markNotificationAsRead(result.notifications[0]);
});

test("can mark all as read", async () => {
  const fetcher = await new InboxModule().getFetcherForInstallation(
    MAX_PAGE_SIZE,
    LIMIT
  );
  await fetcher.fetchNewNotifications();

  await fetcher.markAllNotificationsAsRead();
});

test("can mark as deleted", async () => {
  const fetcher = await new InboxModule().getFetcherForInstallation(
    MAX_PAGE_SIZE,
    LIMIT
  );
  const result = await fetcher.fetchNewNotifications();
  await fetcher.markNotificationAsDeleted(result.notifications[0]);
});

test("throws if using when disposed", async () => {
  expect.assertions(1);
  const fetcher = await new InboxModule().getFetcherForInstallation(
    MAX_PAGE_SIZE,
    LIMIT
  );
  fetcher.dispose();
  try {
    await fetcher.getAllFetchedNotifications();
  } catch (e) {
    expect(e).toBeDefined();
  }
});

const NotificationSource = new InboxModule().NotificationSource;

const fakeNotifications = [
  // Minimal notification
  {
    id: "1",
    body: "Notification1",
    isUnread: true,
    date: 1520352788000,
    source: NotificationSource.CAMPAIGN,
  },
  // Full notification
  {
    id: "2",
    title: "Title2",
    body: "Notification2",
    isUnread: false,
    date: 1520352788001,
    source: NotificationSource.TRANSACTIONAL,
    payload: {
      foo: "bar",
    },
  },
];

function checkNotificationsContent(
  notifications: BatchSDK.InboxNotification[]
) {
  expect(notifications.length).toBe(2);

  let notif = notifications[0];
  expect(notif.identifier).toBe("1");
  expect(notif.body).toBe("Notification1");
  expect(notif.isUnread).toBe(true);
  expect(notif.date.getTime()).toBe(1520352788000);
  expect(notif.source).toBe(NotificationSource.CAMPAIGN);
  expect(notif.title).toBeUndefined();
  expect(notif.payload).toEqual({});

  notif = notifications[1];
  expect(notif.identifier).toBe("2");
  expect(notif.title).toBe("Title2");
  expect(notif.body).toBe("Notification2");
  expect(notif.isUnread).toBe(false);
  expect(notif.date.getTime()).toBe(1520352788001);
  expect(notif.source).toBe(NotificationSource.TRANSACTIONAL);
  expect(notif.payload).toEqual({
    foo: "bar",
  });
}
