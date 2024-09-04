/* eslint-disable @typescript-eslint/no-explicit-any */
import {Profile as ProfileAction} from "../src/actions";
import { isString } from "../src/helpers";

const mockedTrackEvent = jest.fn();
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
  method: ProfileAction,
  args: any[]
) {
  const arg = (args || [])[0];

  if (method === ProfileAction.TrackEvent) {
    if (!isString(arg.name)) {
      throw new Error("TrackEvent: Invalid name argument");
    }
    if (arg.event_data && typeof arg.event_data !== "object") {
      throw new Error("TrackEvent: Invalid event_data argument");
    }
    mockedTrackEvent(arg.name, arg.event_data);
  } else if (method === ProfileAction.TrackLocation) {
    if (typeof arg !== "object") {
      throw new Error("TrackLocation: Invalid location argument");
    }
    mockedTrackLocation(arg);
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

import { ProfileModule } from "../src/modules/profile";


afterEach(() => {
  mockedTrackEvent.mockClear();
  mockedTrackLocation.mockClear();
});

test("it tracks events", () => {
  const profileModule = new ProfileModule();
  profileModule.trackEvent("foo");
  profileModule.trackEvent("foo_2", new profileModule.eventAttributes().put("$label","fooBAR"));

  const eventData = new profileModule.eventAttributes();
  eventData
    .put("$tags", ["foo", "bar"])
    .put("foo", "bar")
    .put("bool", true)
    .put("float", 2.1)
    .put("int", 2)
    .put("date", new Date(1520352788000))
    .put("url", new URL("https://batch.com"))
    .put("object", new profileModule.eventAttributes().put("foo","bar"))
    .put("object_array", [new profileModule.eventAttributes().put("foo","bar"), new profileModule.eventAttributes().put("foo","bar") ]);
  profileModule.trackEvent("foo_3", eventData);

  expect(mockedTrackEvent.mock.calls.length).toBe(3);
  expect(mockedTrackEvent).toBeCalledWith("foo", null);
  expect(mockedTrackEvent).toBeCalledWith("foo_2", {
      "$label": {
          type: "s",
          value: "fooBAR",
      }
  });
  expect(mockedTrackEvent).toBeCalledWith("foo_3", {
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
      url: {
        type: "u",
        value: "https://batch.com/",
      },
      object: {
          type: "o",
          value: {
              foo: {
                  type: "s",
                  value: "bar",
              },
          },
      },
      object_array: {
          type: "oa",
          value: [
              {
                  foo: {
                      type: "s",
                      value: "bar",
                  },
              },
              {
                  foo: {
                      type: "s",
                      value: "bar",
                  },
              },
          ],
      },
      "$tags": {
        type: "sa",
        value:  ["foo", "bar"],
      },
  });
});

test("it tracks locations", () => {
  const profileModule = new ProfileModule();

  profileModule.trackLocation({ latitude: 2.5, longitude: 4 });
  profileModule.trackLocation({
    date: new Date(1520352788000),
    latitude: 2,
    longitude: 4.5,
  });
  profileModule.trackLocation({
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

  const profileModule = new ProfileModule();

  profileModule.trackLocation({ latitude: "foo", longitude: "bar" } as any);
  profileModule.trackLocation({ latitude: 2 } as any);
  profileModule.trackLocation({ latitude: 2, longitude: 3, date: 2 } as any);
  profileModule.trackLocation({
    latitude: 2,
    longitude: 3,
    precision: "k",
  } as any);
  profileModule.trackLocation({
    latitude: 2,
    longitude: 3,
    precision: "k",
  } as any);
  profileModule.trackLocation({
    date: 12345,
    latitude: 2,
    longitude: 3,
  } as any);
  profileModule.trackLocation({ latitude: NaN, longitude: NaN });

  console.log = oldConsoleLog;

  expect(mockedTrackLocation.mock.calls.length).toBe(0);
});
