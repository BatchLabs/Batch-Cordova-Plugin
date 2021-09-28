import { BatchSDK } from "../../../types";
import { BatchUserAttributeType } from "../user";

export class BatchUserAttribute implements BatchSDK.BatchUserAttribute {
  constructor(private _type: BatchUserAttributeType, private _value: unknown) {}

  getType(): BatchSDK.BatchUserAttributeType {
    return this._type;
  }

  getValue(): unknown {
    // Dates are mutable so they should be copied
    if (this._value instanceof Date) {
      return new Date(this._value.getTime());
    }
    return this._value;
  }

  getStringValue(): string | undefined {
    if (this._type == BatchUserAttributeType.STRING) {
      return this._value as string;
    }
    return undefined;
  }

  getBooleanValue(): boolean | undefined {
    if (this._type == BatchUserAttributeType.BOOLEAN) {
      return this._value as boolean;
    }
    return undefined;
  }

  getNumberValue(): number | undefined {
    if (
      this._type == BatchUserAttributeType.INTEGER ||
      this._type == BatchUserAttributeType.DOUBLE
    ) {
      return this._value as number;
    }
    return undefined;
  }

  getDateValue(): Date | undefined {
    if (this._type == BatchUserAttributeType.DATE) {
      return new Date((this._value as Date).getTime());
    }
    return undefined;
  }
}
