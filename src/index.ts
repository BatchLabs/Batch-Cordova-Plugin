import { BatchSDK } from "../types";
import { Batch } from "./batch";
import { BatchStub } from "./batchStub";
import { CallbackHandler } from "./callback";
import Platform from "./platform";

let batchImpl: BatchSDK.Batch;
if (Platform.isCurrent(Platform.iOS) || Platform.isCurrent(Platform.Android)) {
  batchImpl = new Batch();
  new CallbackHandler().setup();
} else {
  batchImpl = new BatchStub();
}

export = batchImpl;
