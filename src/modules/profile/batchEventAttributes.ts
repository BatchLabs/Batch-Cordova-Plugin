import { BatchSDK } from "../../../types";
import {isBoolean, isNumber, isObject, isObjectArray, isString, isStringArray, writeBatchLog} from "../../helpers";

export enum TypedEventAttributeType {
  String = "s",
  Boolean = "b",
  Integer = "i",
  Float = "f",
  Date = "d",
  URL = "u",
  Object = "o",
  ObjectArray = "oa",
  StringArray = "sa",
}

export type TypedEventAttributeValue = string | boolean | number | string[] | TypedEventAttributes | TypedEventAttributes[];

export type TypedEventAttributes = { [key: string]: ITypedEventAttribute };

export interface ITypedEventAttribute {
    type: TypedEventAttributeType;
    value: TypedEventAttributeValue;
}

export class BatchEventAttributes implements BatchSDK.BatchEventAttributes {
  private readonly _attributes: { [key: string]: ITypedEventAttribute };

  constructor() {
    this._attributes = {};
  }

  public put(
    key: string,
    value: string | number | boolean | Date | URL |  Array<String> | BatchSDK.BatchEventAttributes | Array<BatchSDK.BatchEventAttributes>
  ): BatchEventAttributes {
    key = key.toLowerCase();

    let typedAttrValue: ITypedEventAttribute | undefined;

    if (value instanceof Date) {
      typedAttrValue = {
        type: TypedEventAttributeType.Date,
        value: value.getTime(),
      };
    } else if (value instanceof URL) {
      typedAttrValue = {
        type: TypedEventAttributeType.URL,
        value: URL.prototype.toString.call(value),
      };
    } else if (isString(value)) {
      typedAttrValue = {
        type: TypedEventAttributeType.String,
        value,
      };
    } else if (isNumber(value)) {
      typedAttrValue = {
        type:
          value % 1 === 0
            ? TypedEventAttributeType.Integer
            : TypedEventAttributeType.Float,
        value,
      };
    } else if (isBoolean(value)) {
      typedAttrValue = {
        type: TypedEventAttributeType.Boolean,
        value,
      };
    } else if (isObject(value)) {
        typedAttrValue = {
            type: TypedEventAttributeType.Object,
            value: value._attributes,
        };
    } else if (isStringArray(value)) {
        typedAttrValue = {
            type: TypedEventAttributeType.StringArray,
            value,
        };
    } else if (isObjectArray(value)) {
        const array:  { [key: string]: ITypedEventAttribute }[]  = [];
        value.forEach(item => {
            array.push(item._attributes);
        });
        typedAttrValue = {
            type: TypedEventAttributeType.ObjectArray,
            value: array,
        };
    } else {
      writeBatchLog(
        false,
        "BatchEventData - Invalid attribute value type. Must be a string, number, date, URL or boolean"
      );
      return this;
    }

    if (typedAttrValue) {
      this._attributes[key] = typedAttrValue;
    }

    return this;
  }

  public _toInternalRepresentation():  { [key: string]: ITypedEventAttribute } {
    return this._attributes;
  }
}
