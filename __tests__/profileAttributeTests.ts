import {ProfileAttributeOperation, Profile} from "../src/actions";

const mockSendToBridge = jest.fn();

jest.doMock("../src/helpers", () => {
  const helpers = jest.requireActual("../src/helpers");
  // tslint:disable-next-line:only-arrow-functions
  return {
    ...helpers,
    sendToBridge: mockSendToBridge,
  };
});

import { BatchProfileAttributeEditor } from "../src/modules/profile/profileAttributeEditor";

beforeAll(() => {
  mockSendToBridge.mockClear();
});

describe("it enqueues operations correctly", () => {
  const editor = new BatchProfileAttributeEditor(true);
  const enqueueMock = jest.fn();
  (editor as any)._enqueueOperation = enqueueMock;

  const oldConsoleLog = console.log;

  beforeAll(() => {
    console.log = jest.fn();
  });

  afterAll(() => {
    console.log = oldConsoleLog;
  });

  beforeEach(() => {
    enqueueMock.mockClear();
  });

  it("can set language", () => {
    editor.setLanguage("en");
    (editor as any).setLanguage(2);
    editor.setLanguage(null);

    expect(enqueueMock.mock.calls.length).toBe(2);
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetLanguage, {
      value: "en",
    });
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetLanguage, {
      value: null,
    });
  });

  it("can set region", () => {
    editor.setRegion("en");
    (editor as any).setRegion(2);
    editor.setRegion(null);

    expect(enqueueMock.mock.calls.length).toBe(2);
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetRegion, {
      value: "en",
    });
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetRegion, {
      value: null,
    });
  });

  it("can set attribute", () => {
    editor.setAttribute("foo", "bar");
    editor.setAttribute("foo", 2);
    editor.setAttribute("foo", 2.5);
    editor.setAttribute("foo", true);
    editor.setAttribute("foo", new Date(1520352788000));
    editor.setAttribute("foo", new URL("https://batch.com"));
    editor.setAttribute("foo", ["bar", "baz"]);
    editor.setAttribute("foo", NaN);
    (editor as any).setAttribute(null, null);
    (editor as any).setAttribute("foo", null);

    expect(enqueueMock.mock.calls.length).toBe(7);
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetAttribute, {
      key: "foo",
      type: "string",
      value: "bar",
    });
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetAttribute, {
      key: "foo",
      type: "integer",
      value: 2,
    });
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetAttribute, {
      key: "foo",
      type: "float",
      value: 2.5,
    });
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetAttribute, {
      key: "foo",
      type: "boolean",
      value: true,
    });
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetAttribute, {
      key: "foo",
      type: "date",
      value: 1520352788000,
    });
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetAttribute, {
      key: "foo",
      type: "url",
      value: "https://batch.com/",
    });
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.SetAttribute, {
      key: "foo",
      type: "array",
      value: ["bar", "baz"],
      });
  });

  it("can remove attribute", () => {
    editor.removeAttribute("foo");
    (editor as any).removeAttribute(null);

    expect(enqueueMock.mock.calls.length).toBe(1);
    expect(enqueueMock).toBeCalledWith(ProfileAttributeOperation.RemoveAttribute, {
      key: "foo",
    });
  });
});

test("can save operations", () => {
  new BatchProfileAttributeEditor(true)
    .setAttribute("foo", "bar")
    .setAttribute("foo2", ["bar"])
    .save();

  expect(mockSendToBridge.mock.calls.length).toBe(1);
  expect(mockSendToBridge).toBeCalledWith(null, Profile.Edit, [
    {
      operations: [
        {
          key: "foo",
          operation: ProfileAttributeOperation.SetAttribute,
          type: "string",
          value: "bar",
        },
        { operation: ProfileAttributeOperation.SetAttribute, type: "array", key: "foo2", value: ["bar"] },
      ],
    },
  ]);
});
