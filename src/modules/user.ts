import { User as UserAction, UserDataOperation } from "../actions";
import { isNumber, isString, sendToBridge, writeBatchLog } from "../helpers";

import Consts from "../consts";
import { BatchUserDataEditor } from "./user/userDataEditor";

export class UserModule implements BatchSDK.UserModule {
  public getInstallationID(resultCallback: (installationID: string) => void) {
    sendToBridge(resultCallback, UserAction.GetInstallationID, null);
  }

  public getEditor(): BatchUserDataEditor {
    return new BatchUserDataEditor(true);
  }

  public printDebugInformation() {
    sendToBridge(null, UserAction.DataDebug, null);
  }

  public trackEvent(
    name: string,
    label?: string,
    data?: { [key: string]: any }
  ) {
    if (!isString(name) || !Consts.AttributeKeyRegexp.test(name || "")) {
      writeBatchLog(
        false,
        "BatchUser - Invalid event name. Please make sure that the name is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring event '" +
          name +
          "'"
      );
      return;
    }

    const parameters: any = { name };

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

    // Legacy codepath
    // TODO, the === "object" check might not work for the new object
    if (typeof data === "object") {
      parameters.data = data;
      sendToBridge(null, UserAction.TrackLegacyEvent, [parameters]);
      return;
    }

    // TODO: implement new event data class

    sendToBridge(null, UserAction.TrackEvent, [parameters]);

    return;
  }

  public trackTransaction(amount: number, data?: { [key: string]: any }) {
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

    const parameters: any = { amount };

    if (typeof data === "object") {
      parameters.data = data;
    }

    sendToBridge(null, UserAction.TrackTransaction, [parameters]);

    return;
  }

  public trackLocation(location: BatchSDK.Location) {
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
        precision: location.precision
      }
    ]);
  }
}
