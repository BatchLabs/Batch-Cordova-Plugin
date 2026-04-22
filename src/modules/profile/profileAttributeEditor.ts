import { BatchSDK } from "../../../types";
import { Profile, ProfileAttributeOperation } from "../../actions";
import {
  isBoolean,
  isNumber,
  isString,
  isStringArray,
  sendToBridge,
  writeBatchLog,
} from "../../helpers";

interface IOperation {
  operation: ProfileAttributeOperation;

  [key: string]: unknown;
}

export class BatchProfileAttributeEditor
  implements BatchSDK.BatchProfileAttributeEditor {
  private _operationQueue: IOperation[];

  constructor(fromSdk: boolean) {
    if (fromSdk !== true) {
      throw new Error(
        "Do not instantiate BatchUserDataEditor yourself: use batch.user.getEditor()"
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

    this._enqueueOperation(ProfileAttributeOperation.SetLanguage, {
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

    this._enqueueOperation(ProfileAttributeOperation.SetRegion, {
      value: region,
    });

    return this;
  }

  public setEmailAddress(email: string | null): this {
    if (typeof email !== "string" && email !== null) {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - Email must be a string or null"
      );
      return this;
    }
    this._enqueueOperation(ProfileAttributeOperation.SetEmail, {
      value: email,
    });
    return this;
  }

  public setEmailMarketingSubscription(
    state: "subscribed" | "unsubscribed"
  ): this {
    if (
      typeof state !== "string" ||
      (state !== "subscribed" && state !== "unsubscribed")
    ) {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - Email marketing subscription state must be `subscribed` or `unsubscribed`."
      );
      return this;
    }
    this._enqueueOperation(
      ProfileAttributeOperation.SetEmailMarketingSubscription,
      {
        value: state,
      }
    );
    return this;
  }

  public setPhoneNumber(phoneNumber: string | null): this {
    if (typeof phoneNumber !== "string" && phoneNumber !== null) {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - Phone number must be a string or null"
      );
      return this;
    }
    this._enqueueOperation(ProfileAttributeOperation.SetPhoneNumber, {
      value: phoneNumber,
    });
    return this;
  }

  public setSMSMarketingSubscription(
    state: "subscribed" | "unsubscribed"
  ): this {
    if (
      typeof state !== "string" ||
      (state !== "subscribed" && state !== "unsubscribed")
    ) {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - SMS marketing subscription state must be `subscribed` or `unsubscribed`."
      );
      return this;
    }
    this._enqueueOperation(
      ProfileAttributeOperation.SetSMSMarketingSubscription,
      {
        value: state,
      }
    );
    return this;
  }

  public setTopicPreferences(topics: Array<string> | null): this {
    this._enqueueOperation(ProfileAttributeOperation.SetTopicPreferences, {
      value: topics,
    });
    return this;
  }

  public addToTopicPreferences(topics: Array<string>): this {
    this._enqueueOperation(ProfileAttributeOperation.AddToTopicPreferences, {
      value: topics,
    });
    return this;
  }

  public removeFromTopicPreferences(topics: Array<string>): this {
    this._enqueueOperation(
      ProfileAttributeOperation.RemoveFromTopicPreferences,
      {
        value: topics,
      }
    );
    return this;
  }

  public setAttribute(
    key: string,
    value: string | number | boolean | Date | URL | Array<string>
  ): this {
    if (typeof key === "undefined" || key === null) {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - Value argument cannot be undefined or null"
      );
      return this;
    }

    if (typeof value === "undefined") {
      writeBatchLog(false, "BatchProfileAttributeEditor - A value is required");
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
      writeBatchLog(false, "BatchProfileAttributeEditor - Value cannot be NaN");
      return this;
    } else if (isNumber(value)) {
      operationData.type = (value as number) % 1 === 0 ? "integer" : "float";
    } else if (isString(value)) {
      operationData.type = "string";
    } else if (isStringArray(value)) {
      operationData.type = "array";
    } else if (isBoolean(value)) {
      operationData.type = "boolean";
    } else {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - Value argument must be one of these types: number, string, boolean, date, array"
      );
      return this;
    }

    this._enqueueOperation(
      ProfileAttributeOperation.SetAttribute,
      operationData
    );

    return this;
  }

  public removeAttribute(key: string): this {
    if (!isString(key)) {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - Key argument must be a string"
      );
      return this;
    }
    this._enqueueOperation(ProfileAttributeOperation.RemoveAttribute, {
      key,
    });

    return this;
  }

  public addToArray(key: string, value: string | Array<string>): this {
    if (!isString(key)) {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - Key argument must be a string"
      );
      return this;
    }

    if (typeof value === "undefined") {
      writeBatchLog(false, "BatchProfileAttributeEditor - A value is required");
      return this;
    }

    this._enqueueOperation(ProfileAttributeOperation.AddToArray, {
      key,
      value,
    });

    return this;
  }

  public removeFromArray(key: string, value: string | Array<string>): this {
    if (!isString(key)) {
      writeBatchLog(
        false,
        "BatchProfileAttributeEditor - Key argument must be a string"
      );
      return this;
    }

    if (typeof value === "undefined") {
      writeBatchLog(false, "BatchProfileAttributeEditor - A value is required");
      return this;
    }

    this._enqueueOperation(ProfileAttributeOperation.RemoveFromArray, {
      key,
      value,
    });
    return this;
  }

  public save(): this {
    sendToBridge(null, Profile.Edit, [
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
    operation: ProfileAttributeOperation,
    args: { [key: string]: unknown }
  ) {
    const operationObject = {
      operation,
      ...args,
    };

    this._operationQueue.push(operationObject);
  }
}
