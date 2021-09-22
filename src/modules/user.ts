import { User as UserAction } from "../actions";
import {
  invokeModernBridge,
  isNumber,
  isString,
  sendToBridge,
  sendToBridgePromise,
  writeBatchLog,
} from "../helpers";

import Consts from "../consts";
import { BatchEventData } from "./user/eventData";
import { BatchUserDataEditor } from "./user/userDataEditor";
import { BatchSDK } from "../../types";

export enum BatchUserAttributeType {
  STRING = 1,
  BOOLEAN = 1,
  INTEGER = 2,
  DOUBLE = 3,
  DATE = 4,
}

export class UserModule implements BatchSDK.UserModule {
  public eventData: typeof BatchSDK.BatchEventData;
  public BatchUserAttributeType: typeof BatchUserAttributeType;

  constructor() {
    this.eventData = BatchEventData;
    this.BatchUserAttributeType = BatchUserAttributeType;
  }

  public getInstallationID(): Promise<undefined | string> {
    return sendToBridgePromise(UserAction.GetInstallationID, null);
  }

  public getLanguage(): Promise<undefined | string> {
    return sendToBridgePromise(UserAction.GetLanguage, null);
  }

  public getRegion(): Promise<undefined | string> {
    return sendToBridgePromise(UserAction.GetRegion, null);
  }

  public getIdentifier(): Promise<undefined | string> {
    return sendToBridgePromise(UserAction.GetIdentifier, null);
  }

  public getAttributes(): Promise<{
    [key: string]: BatchSDK.BatchUserAttribute;
  }> {
    throw new Error("Method not implemented.");
  }

  public async getTagCollections(): Promise<{ [key: string]: string[] }> {
    const response = (await invokeModernBridge(
      UserAction.FetchTags
    )) as void | { tagCollections: { [key: string]: string[] } };

    if (!response) {
      throw new Error("Internal error: Failed to fetch tag collections");
    }

    return response.tagCollections;
  }

  public getEditor(): BatchUserDataEditor {
    return new BatchUserDataEditor(true);
  }

  public printDebugInformation(): void {
    sendToBridge(null, UserAction.DataDebug, null);
  }

  public trackEvent(
    name: string,
    label?: string,
    data?: { [key: string]: unknown } | BatchSDK.BatchEventData
  ): void {
    if (!isString(name) || !Consts.AttributeKeyRegexp.test(name || "")) {
      writeBatchLog(
        false,
        "BatchUser - Invalid event name. Please make sure that the name is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring event '" +
          name +
          "'"
      );
      return;
    }

    const parameters: {
      name: string;
      label?: string;
      event_data?: unknown;
      data?: BatchSDK.LegacyBatchEventData;
    } = { name };

    if (isString(label)) {
      if (
        label.length === 0 ||
        label.length > Consts.AttributeStringMaxLength
      ) {
        writeBatchLog(
          false,
          "BatchUserDataEditor - Label can't be longer than " +
            Consts.AttributeStringMaxLength +
            " characters. Ignoring event '" +
            name +
            "'."
        );
        return;
      }
      parameters.label = label;
    } else if (label != null && typeof label !== "undefined") {
      writeBatchLog(
        false,
        "BatchUser - If supplied, label argument must be a string. Ignoring event '" +
          name +
          "'."
      );
      return;
    }

    if (data instanceof BatchEventData) {
      parameters.event_data = data._toInternalRepresentation();
    } else if (typeof data === "object") {
      // Legacy codepath
      // TODO, the === "object" check might not work for the new object
      parameters.data = data as BatchSDK.LegacyBatchEventData;
      sendToBridge(null, UserAction.TrackLegacyEvent, [parameters]);
      return;
    }

    sendToBridge(null, UserAction.TrackEvent, [parameters]);

    return;
  }

  public trackTransaction(
    amount: number,
    data?: { [key: string]: unknown }
  ): void {
    if (typeof amount === "undefined") {
      writeBatchLog(
        false,
        "BatchUser - Amount must be a valid number. Ignoring transaction."
      );
      return;
    }

    if (!isNumber(amount) || isNaN(amount)) {
      writeBatchLog(
        false,
        "BatchUser - Amount must be a valid number. Ignoring transaction."
      );
      return;
    }

    const parameters: {
      amount: number;
      data?: unknown;
    } = { amount };

    if (typeof data === "object") {
      parameters.data = data;
    }

    sendToBridge(null, UserAction.TrackTransaction, [parameters]);

    return;
  }

  public trackLocation(location: BatchSDK.Location): void {
    if (typeof location !== "object") {
      writeBatchLog(
        false,
        "BatchUser - Invalid trackLocation argument. Skipping."
      );
      return;
    }

    if (typeof location.latitude !== "number" || isNaN(location.latitude)) {
      writeBatchLog(false, "BatchUser - Invalid latitude. Skipping.");
      return;
    }

    if (typeof location.longitude !== "number" || isNaN(location.longitude)) {
      writeBatchLog(false, "BatchUser - Invalid longitude. Skipping.");
      return;
    }

    if (
      location.precision &&
      (typeof location.precision !== "number" || isNaN(location.precision))
    ) {
      writeBatchLog(false, "BatchUser - Invalid precision. Skipping.");
      return;
    }

    if (location.date && !(location.date instanceof Date)) {
      writeBatchLog(false, "BatchUser - Invalid date. Skipping.");
      return;
    }

    sendToBridge(null, UserAction.TrackLocation, [
      {
        date: location.date ? location.date.getTime() : undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        precision: location.precision,
      },
    ]);
  }
}
