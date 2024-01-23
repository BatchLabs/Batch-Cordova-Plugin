import { BatchSDK } from "../../../types";
import { User as UserAction, UserDataOperation } from "../../actions";
import Consts from "../../consts";
import { isNumber, isString, sendToBridge, writeBatchLog } from "../../helpers";

interface IOperation {
  operation: UserDataOperation;
  [key: string]: unknown;
}

export class BatchUserDataEditor implements BatchSDK.BatchUserDataEditor {
  private _operationQueue: IOperation[]; // tslint:disable-line

  constructor(fromSdk: boolean) {
    if (fromSdk !== true) {
      throw new Error(
        "Do not instanciate BatchUserDataEditor yourself: use batch.user.getEditor()"
      );
    }
    this._operationQueue = [];
  }

  public setLanguage(language: string | null): this {
    if (typeof language !== "string" && language !== null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Language must be a string or null"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.SetLanguage, {
      value: language,
    });

    return this;
  }

  public setRegion(region: string | null): this {
    if (typeof region !== "string" && region !== null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Region must be a string or null"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.SetRegion, {
      value: region,
    });

    return this;
  }

  public setIdentifier(identifier: string | null): this {
    if (typeof identifier !== "string" && identifier !== null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Identifier must be a string or null"
      );
      return this;
    }

    this._enqueueOperation(UserDataOperation.SetIdentifier, {
      value: identifier,
    });

    return this;
  }

  public setAttributionIdentifier(identifier: string | null): this {
    if (typeof identifier !== "string" && identifier !== null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Attribution identifier must be a string or null"
      );
      return this;
    }
    this._enqueueOperation(UserDataOperation.SetAttributionId, {
      value: identifier,
    });
    return this;
  }

  public setEmail(email: string | null): this {
    if (typeof email !== "string" && email !== null) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Email must be a string or null"
      );
      return this;
    }
    this._enqueueOperation(UserDataOperation.SetEmail, {
      value: email,
    });
    return this;
  }

  public setEmailMarketingSubscriptionState(
    state: "subscribed" | "unsubscribed"
  ): this {
    if (typeof state !== "string" || (state !== "subscribed" && state !== "unsubscribed")) {
      writeBatchLog(
        false,
        "BatchUserDataEditor - Email marketing subscription state must be `subscribed` or `unsubscribed`."
      );
      return this;
    }
    this._enqueueOperation(UserDataOperation.SetEmailMarketingSubscription, {
      value: state,
    });
    return this;
  }

  public setAttribute(
    key: string,
    value: string | number | boolean | Date | URL
  ): this {
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
    } else if (value instanceof URL) {
      operationData.value = URL.prototype.toString.call(value);
      operationData.type = "url";
    } else if (typeof value === "number" && isNaN(value)) {
      writeBatchLog(false, "BatchUserDataEditor - Value cannot be NaN");
      return this;
    } else if (isNumber(value)) {
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
      (value as unknown) instanceof Boolean ||
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

  public removeAttribute(key: string): this {
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
      key,
    });

    return this;
  }

  public clearAttributes(): this {
    this._enqueueOperation(UserDataOperation.ClearAttribute, {});

    return this;
  }

  public addTag(collection: string, tag: string): this {
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
      tag,
    });

    return this;
  }

  public removeTag(collection: string, tag: string): this {
    if (
      typeof collection !== "string" &&
      !((collection as unknown) instanceof String)
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
      tag,
    });

    return this;
  }

  public clearTags(): this {
    this._enqueueOperation(UserDataOperation.ClearTags, {});

    return this;
  }

  public clearTagCollection(collection: string): this {
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
      collection,
    });

    return this;
  }

  public save(): this {
    sendToBridge(null, UserAction.Edit, [
      {
        operations: this._operationQueue,
      },
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
    args: { [key: string]: unknown }
  ) {
    const operationObject = {
      operation,
      ...args,
    };

    this._operationQueue.push(operationObject);
  }
}
