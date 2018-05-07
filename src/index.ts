import batch from "./batch";
import batchStub from "./batchStub";
import { CallbackHandler } from "./callback";
import Platform from "./platform";

let batchImpl: BatchSDK.Batch;
if (Platform.isCurrent(Platform.iOS) || Platform.isCurrent(Platform.Android)) {
  batchImpl = new batch();
  new CallbackHandler().setup();
} else {
  batchImpl = new batchStub();
}

export = batchImpl;
