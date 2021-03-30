// tslint:disable:object-literal-sort-keys

import { Inbox as InboxAction } from "../src/actions";

function mockedSendToBridge(
  callback: ((result: string) => void) | null,
  method: InboxAction,
  args: any[]
) {
  if (callback == null) {
    throw new Error("Callback shouldn't be null");
  }
  if (method === InboxAction.Fetch) {
    callback(fakeNotifications);
  } else if (method === InboxAction.FetchForUserID) {
    const arg = args[0];

    if (!arg.id || !arg.auth) {
      callback(JSON.stringify({ error: "Missing credentials" }));
    } else if (arg.id === "invalid") {
      callback(JSON.stringify({ error: "Invalid auth" }));
    } else {
      callback(fakeNotifications);
    }
  }
}

jest.doMock("../src/helpers", () => {
  const helpers = jest.requireActual("../src/helpers");
  // tslint:disable-next-line:only-arrow-functions
  return {
    ...helpers,
    sendToBridge: jest.fn(mockedSendToBridge)
  };
});

import { InboxModule } from "../src/modules/inbox";

test("can fetch notifications for the current installation ID", done => {
  new InboxModule().fetchNotifications((err, notifications) => {
    expect(err).toBeUndefined();
    expect(notifications).toBeInstanceOf(Array);
    checkNotificationsContent(notifications as BatchSDK.InboxNotification[]);

    done();
  });
});

test("can fetch notifications by custom ID", done => {
  new InboxModule().fetchNotificationsForUserIdentifier(
    "foo",
    "bar",
    (err, notifications) => {
      expect(err).toBeUndefined();
      expect(notifications).toBeInstanceOf(Array);
      checkNotificationsContent(notifications as BatchSDK.InboxNotification[]);

      done();
    }
  );
});

test("correctly fails on invalid id/auth", done => {
  new InboxModule().fetchNotificationsForUserIdentifier(
    "invalid",
    "invalid",
    (err, notifications) => {
      expect(err).toBeInstanceOf(Error);
      expect(notifications).toBeUndefined();

      done();
    }
  );
});

const NotificationSource = new InboxModule().NotificationSource;

const fakeNotifications = JSON.stringify({
  notifications: [
    // Invalid notification
    { foo: "bar" },
    // Minimal notification
    {
      identifier: "1",
      body: "Notification1",
      is_unread: true,
      date: 1520352788000,
      source: NotificationSource.CAMPAIGN
    },
    // Full notification
    {
      identifier: "2",
      title: "Title2",
      body: "Notification2",
      is_unread: false,
      date: 1520352788001,
      source: NotificationSource.TRANSACTIONAL,
      ios_attachment_url: "https://batch.com/attachment.png",
      payload: {
        foo: "bar"
      }
    }
  ]
});

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
  expect(notif.iOSAttachmentURL).toBeUndefined();

  notif = notifications[1];
  expect(notif.identifier).toBe("2");
  expect(notif.title).toBe("Title2");
  expect(notif.body).toBe("Notification2");
  expect(notif.isUnread).toBe(false);
  expect(notif.date.getTime()).toBe(1520352788001);
  expect(notif.source).toBe(NotificationSource.TRANSACTIONAL);
  expect(notif.payload).toEqual({
    foo: "bar"
  });
  expect(notif.iOSAttachmentURL).toBe("https://batch.com/attachment.png");
}
