import { User as UserAction } from "../actions";
import {
    invokeModernBridge, sendToBridge,
    sendToBridgePromise,
} from "../helpers";

import { BatchSDK } from "../../types";
import { BatchUserAttribute } from "./user/userAttributes";

export enum BatchUserAttributeType {
  STRING = 1,
  BOOLEAN = 1,
  INTEGER = 2,
  DOUBLE = 3,
  DATE = 4,
  URL = 5,
}

export class UserModule implements BatchSDK.UserModule {
  public BatchUserAttributeType: typeof BatchUserAttributeType;

  constructor() {
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

  public async getAttributes(): Promise<{
    [key: string]: BatchSDK.BatchUserAttribute;
  }> {
    const response = (await invokeModernBridge(
      UserAction.FetchAttributes
    )) as void | {
      attributes: { [key: string]: { type: string; value: unknown } };
    };

    if (!response) {
      throw new Error("Internal error: Failed to fetch attributes");
    }

    const outAttributes: { [key: string]: BatchSDK.BatchUserAttribute } = {};
    const rawAttributes = response.attributes;

    for (const key of Object.keys(rawAttributes)) {
      if (!Object.prototype.hasOwnProperty.call(rawAttributes, key)) {
        continue;
      }

      const rawAttribute = rawAttributes[key];
      let type: BatchUserAttributeType = BatchUserAttributeType.STRING;
      let value = rawAttribute.value;

      switch (rawAttribute.type) {
        case "u":
          type = BatchUserAttributeType.URL;
          value = new URL(rawAttribute.value as string);
          break;
        case "d":
          type = BatchUserAttributeType.DATE;
          value = new Date(rawAttribute.value as number);
          break;
        case "i":
          type = BatchUserAttributeType.INTEGER;
          break;
        case "f":
          type = BatchUserAttributeType.DOUBLE;
          break;
        case "b":
          type = BatchUserAttributeType.BOOLEAN;
          value = !!rawAttribute.value;
          break;
        case "s":
          type = BatchUserAttributeType.STRING;
          break;
        default:
          throw new Error(
            "Internal error: unknown user attribute type. Is the native SDK too new for this plugin?"
          );
      }

      outAttributes[key] = new BatchUserAttribute(type, value);
    }

    return outAttributes;
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

  public clearInstallationData(): void {
    sendToBridge(null, UserAction.ClearInstallationData, null)
  }
}
