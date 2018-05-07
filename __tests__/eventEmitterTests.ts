import { EventEmitter } from "../src/eventEmitter";

test("it registers a subscriber", () => {
  const em = new EventEmitter();
  const listener = jest.fn();

  em.on("foo", listener);

  expect((em as any)._eventListeners.foo).toContain(listener);
});

test("it can unregister a subscriber", () => {
  const em = new EventEmitter();
  const listener = jest.fn();

  em.on("foo", listener);
  em.on("bar", listener);
  em.off("foo");

  expect((em as any)._eventListeners.foo.length).toBe(0);
});

test("it can unregister all subscribers", () => {
  const em = new EventEmitter();
  const listener = jest.fn();

  em.on("foo", listener);
  em.on("bar", listener);
  em.off();

  const listeners = (em as any)._eventListeners;
  Object.keys(listeners).forEach(event => {
    expect(listeners[event].length).toBe(0);
  });
});

test("it emits events to subscribers", () => {
  const oldConsoleDebug = console.debug;
  console.debug = jest.fn();

  const em = new EventEmitter();

  const listener = jest.fn();
  em.on("foo", listener);
  em.emit("foo", { foo: "bar" });

  expect(listener).toBeCalledWith("foo", { foo: "bar" });

  console.debug = oldConsoleDebug;
});
