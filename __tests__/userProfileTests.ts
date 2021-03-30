import { User as UserAction, UserDataOperation } from "../src/actions";

const mockSendToBridge = jest.fn();

jest.doMock("../src/helpers", () => {
  const helpers = jest.requireActual("../src/helpers");
  // tslint:disable-next-line:only-arrow-functions
  return {
    ...helpers,
    sendToBridge: mockSendToBridge
  };
});

import { BatchUserDataEditor } from "../src/modules/user/userDataEditor";

beforeAll(() => {
  mockSendToBridge.mockClear();
});

describe("it enqueues operations correctly", () => {
  const editor = new BatchUserDataEditor(true);
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
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetLanguage, {
      value: "en"
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetLanguage, {
      value: null
    });
  });

  it("can set region", () => {
    editor.setRegion("en");
    (editor as any).setRegion(2);
    editor.setRegion(null);

    expect(enqueueMock.mock.calls.length).toBe(2);
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetRegion, {
      value: "en"
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetRegion, {
      value: null
    });
  });

  it("can set identifier", () => {
    editor.setIdentifier("foo");
    (editor as any).setIdentifier(2);
    editor.setIdentifier(null);

    expect(enqueueMock.mock.calls.length).toBe(2);
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetIdentifier, {
      value: "foo"
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetIdentifier, {
      value: null
    });
  });

  it("can set attribute", () => {
    editor.setAttribute("foo", "bar");
    editor.setAttribute("foo", 2);
    editor.setAttribute("foo", 2.5);
    editor.setAttribute("foo", true);
    editor.setAttribute("foo", new Date(1520352788000));
    editor.setAttribute("foo", NaN);
    (editor as any).setAttribute(null, null);
    (editor as any).setAttribute("foo", null);

    expect(enqueueMock.mock.calls.length).toBe(5);
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetAttribute, {
      key: "foo",
      type: "string",
      value: "bar"
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetAttribute, {
      key: "foo",
      type: "integer",
      value: 2
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetAttribute, {
      key: "foo",
      type: "float",
      value: 2.5
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetAttribute, {
      key: "foo",
      type: "boolean",
      value: true
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.SetAttribute, {
      key: "foo",
      type: "date",
      value: 1520352788000
    });
  });

  it("can remove attribute", () => {
    editor.removeAttribute("foo");
    (editor as any).removeAttribute(null);

    expect(enqueueMock.mock.calls.length).toBe(1);
    expect(enqueueMock).toBeCalledWith(UserDataOperation.RemoveAttribute, {
      key: "foo"
    });
  });

  it("can add tags in collections", () => {
    editor.addTag("foo", "bar");
    editor.addTag("foo", "bar bar$");
    editor.addTag("foo qsd qd", "bar qsdq dq");
    editor.addTag("foo$", "bar");
    (editor as any).addTag(2, "bar");
    (editor as any).addTag(null, null);

    expect(enqueueMock.mock.calls.length).toBe(2);
    expect(enqueueMock).toBeCalledWith(UserDataOperation.AddTag, {
      collection: "foo",
      tag: "bar"
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.AddTag, {
      collection: "foo",
      tag: "bar bar$"
    });
  });

  it("can remove tags from collections", () => {
    editor.removeTag("foo", "bar");
    editor.removeTag("foo", "bar bar$");
    editor.removeTag("foo qsd qd", "bar qsdq dq");
    editor.removeTag("foo$", "bar");
    (editor as any).removeTag(2, "bar");
    (editor as any).removeTag(null, null);

    expect(enqueueMock.mock.calls.length).toBe(2);
    expect(enqueueMock).toBeCalledWith(UserDataOperation.RemoveTag, {
      collection: "foo",
      tag: "bar"
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.RemoveTag, {
      collection: "foo",
      tag: "bar bar$"
    });
  });

  it("can do bulk tag operations", () => {
    editor.clearTagCollection("foo");
    editor.clearTagCollection("foo$");
    (editor as any).clearTagCollection(2);
    (editor as any).clearTagCollection(null);

    editor.clearTags();

    expect(enqueueMock.mock.calls.length).toBe(2);
    expect(enqueueMock).toBeCalledWith(UserDataOperation.ClearTagCollection, {
      collection: "foo"
    });
    expect(enqueueMock).toBeCalledWith(UserDataOperation.ClearTags, {});
  });
});

test("can save operations", () => {
  new BatchUserDataEditor(true)
    .addTag("foo", "bar")
    .setAttribute("foo", "bar")
    .save();

  expect(mockSendToBridge.mock.calls.length).toBe(1);
  expect(mockSendToBridge).toBeCalledWith(null, UserAction.Edit, [
    {
      operations: [
        { operation: UserDataOperation.AddTag, collection: "foo", tag: "bar" },
        {
          key: "foo",
          operation: UserDataOperation.SetAttribute,
          type: "string",
          value: "bar"
        }
      ]
    }
  ]);
});
