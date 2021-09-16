/* eslint-disable @typescript-eslint/no-explicit-any */
import { User as UserAction } from "../src/actions";
import { isNumber, isString } from "../src/helpers";

const expectations = {
  identifier: "username",
  installationID: "cac0efba-6430-427a-a764-55100a2a89a6",
  language: "fr",
  region: "FR",
};

let mockedUserGettersShouldReturnUndefined = false;

const mockedTrackEvent = jest.fn();
const mockedTrackLegacyEvent = jest.fn();
const mockedTrackTransaction = jest.fn();
const mockedTrackLocation = jest.fn();

export async function mockedSendToBridgePromise(
  method: string,
  args: unknown[] | null
): Promise<undefined | string> {
  return new Promise((resolve) => {
    mockedSendToBridge(
      (result) => {
        resolve(result);
      },
      method as any,
      args as any
    );
  });
}

function mockedSendToBridge(
  callback: ((result?: string) => void) | null,
  method: UserAction,
  args: any[]
) {
  const arg = (args || [])[0];

  if (method === UserAction.TrackEvent) {
    if (!isString(arg.name)) {
      throw new Error("TrackEvent: Invalid name argument");
    }
    if (arg.label && !isString(arg.label)) {
      throw new Error("TrackEvent: Invalid label argument");
    }
    if (arg.event_data && typeof arg.event_data !== "object") {
      throw new Error("TrackEvent: Invalid event_data argument");
    }
    mockedTrackEvent(arg.name, arg.label, arg.event_data);
  } else if (method === UserAction.TrackLegacyEvent) {
    if (!isString(arg.name)) {
      throw new Error("TrackLegacyEvent: Invalid name argument");
    }
    if (arg.label && !isString(arg.label)) {
      throw new Error("TrackLegacyEvent: Invalid label argument");
    }
    if (arg.data && !(typeof arg.data === "object")) {
      throw new Error("TrackLegacyEvent: Invalid data argument");
    }
    mockedTrackLegacyEvent(arg.name, arg.label, arg.data);
  } else if (method === UserAction.TrackLocation) {
    if (typeof arg !== "object") {
      throw new Error("TrackLocation: Invalid location argument");
    }
    mockedTrackLocation(arg);
  } else if (method === UserAction.TrackTransaction) {
    if (!isNumber(arg.amount)) {
      throw new Error("TrackTransaction: Invalid amount argument");
    }
    if (arg.data && !(typeof arg.data === "object")) {
      throw new Error("TrackTransaction: Invalid data argument");
    }
    mockedTrackTransaction(arg.amount, arg.data);
  } else if (method === UserAction.GetIdentifier) {
    if (mockedUserGettersShouldReturnUndefined) {
      callback?.(undefined);
    } else {
      callback?.(expectations.identifier);
    }
  } else if (method === UserAction.GetInstallationID) {
    if (mockedUserGettersShouldReturnUndefined) {
      callback?.(undefined);
    } else {
      callback?.(expectations.installationID);
    }
  } else if (method === UserAction.GetLanguage) {
    if (mockedUserGettersShouldReturnUndefined) {
      callback?.(undefined);
    } else {
      callback?.(expectations.language);
    }
  } else if (method === UserAction.GetRegion) {
    if (mockedUserGettersShouldReturnUndefined) {
      callback?.(undefined);
    } else {
      callback?.(expectations.region);
    }
  }
}

jest.doMock("../src/helpers", () => {
  const helpers = jest.requireActual("../src/helpers");
  // tslint:disable-next-line:only-arrow-functions
  return {
    ...helpers,
    sendToBridge: jest.fn(mockedSendToBridge),
    sendToBridgePromise: jest.fn(mockedSendToBridgePromise),
  };
});

import { UserModule } from "../src/modules/user";

afterEach(() => {
  mockedTrackEvent.mockClear();
  mockedTrackLegacyEvent.mockClear();
  mockedTrackTransaction.mockClear();
  mockedTrackLocation.mockClear();
});

test("it tracks events", () => {
  const userModule = new UserModule();
  userModule.trackEvent("foo");
  userModule.trackEvent("foo_2", "fooBAR");

  const eventData = new userModule.eventData();
  eventData
    .addTag("foo")
    .addTag("BAR")
    .put("foo", "bar")
    .put("bool", true)
    .put("float", 2.1)
    .put("int", 2)
    .put("date", new Date(1520352788000));
  userModule.trackEvent("foo_3", "foobar2", eventData);

  expect(mockedTrackEvent.mock.calls.length).toBe(3);
  expect(mockedTrackEvent).toBeCalledWith("foo", undefined, undefined);
  expect(mockedTrackEvent).toBeCalledWith("foo_2", "fooBAR", undefined);
  expect(mockedTrackEvent).toBeCalledWith("foo_3", "foobar2", {
    attributes: {
      bool: {
        type: "b",
        value: true,
      },
      float: {
        type: "f",
        value: 2.1,
      },
      foo: {
        type: "s",
        value: "bar",
      },
      int: {
        type: "i",
        value: 2,
      },
      date: {
        type: "d",
        value: 1520352788000,
      },
    },
    tags: ["foo", "bar"],
  });
});

test("it tracks legacy events", () => {
  const userModule = new UserModule();
  userModule.trackEvent("foo");
  userModule.trackEvent("foo_2", "fooBAR");
  userModule.trackEvent("foo_3", "foobar2", { foo: "bar" });

  expect(mockedTrackEvent.mock.calls.length).toBe(2);
  expect(mockedTrackLegacyEvent.mock.calls.length).toBe(1);
  expect(mockedTrackEvent).toBeCalledWith("foo", undefined, undefined);
  expect(mockedTrackEvent).toBeCalledWith("foo_2", "fooBAR", undefined);
  expect(mockedTrackLegacyEvent).toBeCalledWith("foo_3", "foobar2", {
    foo: "bar",
  });
});

test("it ignores invalid events", () => {
  // Remove console.log since invalid events log something to the console
  const oldConsoleLog = console.log;
  console.log = jest.fn();

  const userModule = new UserModule();
  userModule.trackEvent("");
  userModule.trackEvent("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  userModule.trackEvent("$09a");
  userModule.trackEvent(" ");
  (userModule as any).trackEvent(2);
  (userModule as any).trackEvent("foo", 2);

  console.log = oldConsoleLog;

  expect(mockedTrackLegacyEvent.mock.calls.length).toBe(0);
});

test("it tracks transactions", () => {
  const userModule = new UserModule();
  userModule.trackTransaction(2.5);
  userModule.trackTransaction(4, { foo: "bar" });

  expect(mockedTrackTransaction.mock.calls.length).toBe(2);
  expect(mockedTrackTransaction).toBeCalledWith(2.5, undefined);
  expect(mockedTrackTransaction).toBeCalledWith(4, { foo: "bar" });
});

test("it ignores invalid transactions", () => {
  // Remove console.log since invalid events log something to the console
  const oldConsoleLog = console.log;
  console.log = jest.fn();

  const userModule = new UserModule();

  (userModule as any).trackTransaction("foobar");
  (userModule as any).trackTransaction(NaN);

  console.log = oldConsoleLog;

  expect(mockedTrackTransaction.mock.calls.length).toBe(0);
});

test("it tracks locations", () => {
  const userModule = new UserModule();

  userModule.trackLocation({ latitude: 2.5, longitude: 4 });
  userModule.trackLocation({
    date: new Date(1520352788000),
    latitude: 2,
    longitude: 4.5,
  });
  userModule.trackLocation({
    date: new Date(1520352788000),
    latitude: 2,
    longitude: 4.5,
    precision: 10,
  });

  expect(mockedTrackLocation.mock.calls.length).toBe(3);

  expect(mockedTrackLocation).toBeCalledWith({ latitude: 2.5, longitude: 4 });
  expect(mockedTrackLocation).toBeCalledWith({
    date: 1520352788000,
    latitude: 2,
    longitude: 4.5,
  });
  expect(mockedTrackLocation).toBeCalledWith({
    date: 1520352788000,
    latitude: 2,
    longitude: 4.5,
    precision: 10,
  });
});

test("it ignores invalid locations", () => {
  // Remove console.log since invalid events log something to the console
  const oldConsoleLog = console.log;
  console.log = jest.fn();

  const userModule = new UserModule();

  userModule.trackLocation({ latitude: "foo", longitude: "bar" } as any);
  userModule.trackLocation({ latitude: 2 } as any);
  userModule.trackLocation({ latitude: 2, longitude: 3, date: 2 } as any);
  userModule.trackLocation({
    latitude: 2,
    longitude: 3,
    precision: "k",
  } as any);
  userModule.trackLocation({
    latitude: 2,
    longitude: 3,
    precision: "k",
  } as any);
  userModule.trackLocation({
    date: 12345,
    latitude: 2,
    longitude: 3,
  } as any);
  userModule.trackLocation({ latitude: NaN, longitude: NaN });

  console.log = oldConsoleLog;

  expect(mockedTrackLocation.mock.calls.length).toBe(0);
});

test("it can read back the installation ID", async () => {
  const userModule = new UserModule();

  mockedUserGettersShouldReturnUndefined = false;

  expect(await userModule.getInstallationID()).toBe(
    expectations.installationID
  );

  mockedUserGettersShouldReturnUndefined = true;

  expect(await userModule.getInstallationID()).toBeUndefined();
});

test("it can read back the Custom ID", async () => {
  const userModule = new UserModule();

  mockedUserGettersShouldReturnUndefined = false;

  expect(await userModule.getIdentifier()).toBe(expectations.identifier);

  mockedUserGettersShouldReturnUndefined = true;

  expect(await userModule.getIdentifier()).toBeUndefined();
});

test("it can read back the custom language", async () => {
  const userModule = new UserModule();

  mockedUserGettersShouldReturnUndefined = false;

  expect(await userModule.getLanguage()).toBe(expectations.language);

  mockedUserGettersShouldReturnUndefined = true;

  expect(await userModule.getLanguage()).toBeUndefined();
});

test("it can read back the custom region", async () => {
  const userModule = new UserModule();

  mockedUserGettersShouldReturnUndefined = false;

  expect(await userModule.getRegion()).toBe(expectations.region);

  mockedUserGettersShouldReturnUndefined = true;

  expect(await userModule.getRegion()).toBeUndefined();
});
