import { User as UserAction, UserDataOperation } from "../actions";
import { isNumber, isString, sendToBridge, writeBatchLog } from "../helpers";

import Consts from "../consts";

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

interface IOperation {
  operation: UserDataOperation;
  [key: string]: any;
}

export class BatchUserDataEditor implements BatchUserDataEditor {
  private _operationQueue: IOperation[]; // tslint:disable-line

  constructor(fromSdk: boolean) {
    if (fromSdk !== true) {
      throw new Error(
        "Do not instanciate BatchUserDataEditor yourself: use batch.user.getEditor()"
      );
    }
    this._operationQueue = [];
  }

  public setLanguage(language: string | null) {
    if (typeof language !== "string" && language !== null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Language must be a string or null"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.SetLanguage, {
      value: language
    });

    return this;
  }

  public setRegion(region: string | null) {
    if (typeof region !== "string" && region !== null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Region must be a string or null"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.SetRegion, {
      value: region
    });

    return this;
  }

  public setIdentifier(identifier: string | null) {
    if (typeof identifier !== "string" && identifier !== null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Identifier must be a string or null"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.SetIdentifier, {
      value: identifier
    });

    return this;
  }

  public setAttribute(key: string, value: string | number | boolean | Date) {
    if (!Consts.AttributeKeyRegexp.test(key || "")) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Invalid key. Please make sure that the key is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring attribute '" +
          key +
          "'"
      );
      return this;
    }

    if (typeof key === "undefined" || key === null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Value argument cannot be undefined or null"
      );
      return this;
    }

    if (typeof value === "undefined") {
      writeBatchLog(false, "BatchUserDataEditor - A value is required");
      return this;
    }

    const operationData = { value, key, type: "" };

    // Lets guess the type
    if (value instanceof Date) {
      // It's a date, yay
      operationData.value = value.getTime();
      operationData.type = "date";
    } else if (isNumber(value)) {
      if (isNaN(value)) {
        writeBatchLog(false, "BatchUserDataEditor - Value cannot be NaN");
        return this;
      }
      operationData.type = (value as number) % 1 === 0 ? "integer" : "float";
    } else if (isString(value)) {
      if (
        value.length === 0 ||
        value.length > Consts.AttributeStringMaxLength
      ) {
        writeBatchLog(
          false,
          "BatchUserDataEditor - String attributes can't be empty or longer than " +
            Consts.AttributeStringMaxLength +
            " characters. Ignoring attribute '" +
            key +
            "'."
        );
        return this;
      }
      operationData.type = "string";
    } else if (
      (value as any) instanceof Boolean ||
      typeof value === "boolean"
    ) {
      operationData.type = "boolean";
    } else {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Value argument must be one of these types: number, string, boolean, date"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.SetAttribute, operationData);

    return this;
  }

  public removeAttribute(key: string) {
    if (!Consts.AttributeKeyRegexp.test(key || "")) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Invalid key. Please make sure that the key is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring attribute '" +
          key +
          "'"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.RemoveAttribute, {
      key
    });

    return this;
  }

  public clearAttributes() {
    this._enqueueOperation(UserDataOperation.ClearAttribute, {});

    return this;
  }

  public addTag(collection: string, tag: string) {
    if (!isString(collection)) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Collection argument must be a string"
      );
      return this;
    }

    if (!Consts.AttributeKeyRegexp.test(collection || "")) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Invalid collection. Please make sure that the collection is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring collection '" +
          collection +
          "'"
      );
      return this;
    }

    if (typeof tag === "undefined") {
      writeBatchLog(false, "BatchUserDataEditor - A tag is required");
      return this;
    }

    if (isString(tag)) {
      if (tag.length === 0 || tag.length > Consts.AttributeStringMaxLength) {
        writeBatchLog(
          false,
          "BatchUserDataEditor - Tags can't be empty or longer than " +
            Consts.AttributeStringMaxLength +
            " characters. Ignoring tag '" +
            tag +
            "'."
        );
        return this;
      }
    } else {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Tag argument must be a string"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.AddTag, {
      collection,
      tag
    });

    return this;
  }

  public removeTag(collection: string, tag: string) {
    if (
      typeof collection !== "string" &&
      !((collection as any) instanceof String)
    ) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Collection argument must be a string"
      );
      return this;
    }

    if (!Consts.AttributeKeyRegexp.test(collection || "")) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Invalid collection. Please make sure that the collection is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring collection '" +
          collection +
          "'"
      );
      return this;
    }

    if (typeof tag === "undefined") {
      writeBatchLog(false, "BatchUserDataEditor - A tag is required");
      return this;
    }

    if (isString(tag)) {
      if (tag.length === 0 || tag.length > Consts.AttributeStringMaxLength) {
        writeBatchLog(
          false,
          "BatchUserDataEditor - Tags can't be empty or longer than " +
            Consts.AttributeStringMaxLength +
            " characters. Ignoring tag '" +
            tag +
            "'."
        );
        return this;
      }
    } else {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Tag argument must be a string"
      );
    }

    this._enqueueOperation(UserDataOperation.RemoveTag, {
      collection,
      tag
    });

    return this;
  }

  public clearTags() {
    this._enqueueOperation(UserDataOperation.ClearTags, {});

    return this;
  }

  public clearTagCollection(collection: string) {
    if (typeof collection !== "string") {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Collection argument must be a string"
      );
      return this;
    }

    if (!Consts.AttributeKeyRegexp.test(collection || "")) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Invalid collection. Please make sure that the collection is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring collection '" +
          collection +
          "'"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.ClearTagCollection, {
      collection
    });

    return this;
  }

  public save() {
    sendToBridge(null, UserAction.Edit, [
      {
        operations: this._operationQueue
      }
    ]);

    this._operationQueue = [];

    return this;
  }

  /**
   * Add an operation to the queue.
   * @private
   * @param operation Operation name to add
   * @param args Operation arguments object
   */
  private _enqueueOperation(
    operation: UserDataOperation,
    args: { [key: string]: any }
  ) {
    const operationObject = {
      operation,
      ...args
    };

    this._operationQueue.push(operationObject);
  }
}
