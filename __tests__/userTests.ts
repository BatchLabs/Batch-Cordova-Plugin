import { User as UserAction } from "../src/actions";
import { isNumber, isString } from "../src/helpers";

const mockedTrackEvent = jest.fn();
const mockedTrackLegacyEvent = jest.fn();
const mockedTrackTransaction = jest.fn();
const mockedTrackLocation = jest.fn();

function mockedSendToBridge(
  callback: ((result: string) => void) | null,
  method: UserAction,
  args: any[]
) {
  if (callback !== null) {
    throw new Error("Callback should be null");
  }

  if (args.length !== 1) {
    throw new Error(
      "Incorrect arguments count (expected 1, got " + args.length + " )"
    );
  }

  const arg = args[0];

  if (method === UserAction.TrackEvent) {
    if (!isString(arg.name)) {
      throw new Error("TrackEvent: Invalid name argument");
    }
    if (arg.label && !isString(arg.label)) {
      throw new Error("TrackEvent: Invalid label argument");
    }
    // TODO: uncomment this when BatchEventData has been implemented
    /*if (arg.data && !(typeof arg.data instanceof BatchEventData)) {
      throw new Error("TrackEvent: Invalid data argument");
    }*/
    mockedTrackEvent(arg.name, arg.label, arg.data);
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
  }
}

jest.doMock("../src/helpers", () => {
  const helpers = require.requireActual("../src/helpers");
  // tslint:disable-next-line:only-arrow-functions
  return {
    ...helpers,
    sendToBridge: jest.fn(mockedSendToBridge)
  };
});

import { UserModule, BatchUserDataEditor } from "../src/modules/user";

afterEach(() => {
  mockedTrackEvent.mockClear();
  mockedTrackLegacyEvent.mockClear();
  mockedTrackTransaction.mockClear();
  mockedTrackLocation.mockClear();
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
    foo: "bar"
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
    longitude: 4.5
  });
  userModule.trackLocation({
    date: new Date(1520352788000),
    latitude: 2,
    longitude: 4.5,
    precision: 10
  });

  expect(mockedTrackLocation.mock.calls.length).toBe(3);

  expect(mockedTrackLocation).toBeCalledWith({ latitude: 2.5, longitude: 4 });
  expect(mockedTrackLocation).toBeCalledWith({
    date: 1520352788000,
    latitude: 2,
    longitude: 4.5
  });
  expect(mockedTrackLocation).toBeCalledWith({
    date: 1520352788000,
    latitude: 2,
    longitude: 4.5,
    precision: 10
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
    precision: "k"
  } as any);
  userModule.trackLocation({
    latitude: 2,
    longitude: 3,
    precision: "k"
  } as any);
  userModule.trackLocation({
    date: 12345,
    latitude: 2,
    longitude: 3
  } as any);
  userModule.trackLocation({ latitude: NaN, longitude: NaN });

  console.log = oldConsoleLog;

  expect(mockedTrackLocation.mock.calls.length).toBe(0);
});
