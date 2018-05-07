import { Core } from "../src/actions";
import { sendToBridge } from "../src/helpers";

declare var cordova: any;

test("can start", () => {
  sendToBridge(() => {}, Core.Start, null);
  expect(cordova.exec.mock.calls.length).toBe(1);
});
