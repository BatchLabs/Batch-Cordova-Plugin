import { Profile } from "../actions";
import { sendToBridge, sendToBridgePromise, writeBatchLog } from "../helpers";

import { BatchEventAttributes } from "./profile/batchEventAttributes";
import { BatchProfileAttributeEditor } from "./profile/profileAttributeEditor";
import { BatchSDK } from "../../types";

export class ProfileModule implements BatchSDK.ProfileModule {
  public eventAttributes: typeof BatchSDK.BatchEventAttributes;

  constructor() {
    this.eventAttributes = BatchEventAttributes;
  }

  identify(identifier: string | null): void {
    if (typeof identifier === "undefined") {
      writeBatchLog(
        false,
        "BatchProfile - Identifier cannot be undefined, please use explicit null if you want to logout. Aborting."
      );
      return;
    }
    sendToBridge(null, Profile.Identify, [{ custom_user_id: identifier }]);
  }

  public getEditor(): BatchProfileAttributeEditor {
    return new BatchProfileAttributeEditor(true);
  }

  public trackEvent(
    name: string,
    data?: BatchSDK.BatchEventAttributes
  ): Promise<string | undefined> {
    const parameters: {
      name: string;
      event_data?: unknown;
    } = { name };
    parameters.event_data =
      data instanceof BatchEventAttributes
        ? data._toInternalRepresentation()
        : null;
    return sendToBridgePromise(Profile.TrackEvent, [parameters]);
  }

  public trackLocation(location: BatchSDK.Location): void {
    if (typeof location !== "object") {
      writeBatchLog(
        false,
        "BatchProfile - Invalid trackLocation argument. Skipping."
      );
      return;
    }

    if (typeof location.latitude !== "number" || isNaN(location.latitude)) {
      writeBatchLog(false, "BatchProfile - Invalid latitude. Skipping.");
      return;
    }

    if (typeof location.longitude !== "number" || isNaN(location.longitude)) {
      writeBatchLog(false, "BatchProfile - Invalid longitude. Skipping.");
      return;
    }

    if (
      location.precision &&
      (typeof location.precision !== "number" || isNaN(location.precision))
    ) {
      writeBatchLog(false, "BatchProfile - Invalid precision. Skipping.");
      return;
    }

    if (location.date && !(location.date instanceof Date)) {
      writeBatchLog(false, "BatchProfile - Invalid date. Skipping.");
      return;
    }

    sendToBridge(null, Profile.TrackLocation, [
      {
        date: location.date ? location.date.getTime() : undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        precision: location.precision,
      },
    ]);
  }
}
