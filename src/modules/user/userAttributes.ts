import { BatchSDK } from "../../../types";
import { BatchUserAttributeType } from "../user";

export class BatchUserAttribute implements BatchSDK.BatchUserAttribute {
  constructor(public type: BatchUserAttributeType, public value: unknown) {}

  getType(): BatchSDK.BatchUserAttributeType {
    return this.type;
  }

  getValue(): unknown {
    // Dates are mutable so they should be copied
    if (this.value instanceof Date) {
      return new Date(this.value.getTime());
    }
    return this.value;
  }

  getStringValue(): string | undefined {
    if (this.type == BatchUserAttributeType.STRING) {
      return this.value as string;
    }
    return undefined;
  }

  getBooleanValue(): boolean | undefined {
    if (this.type == BatchUserAttributeType.BOOLEAN) {
      return this.value as boolean;
    }
    return undefined;
  }

  getNumberValue(): number | undefined {
    if (
      this.type == BatchUserAttributeType.INTEGER ||
      this.type == BatchUserAttributeType.DOUBLE
    ) {
      return this.value as number;
    }
    return undefined;
  }

  getDateValue(): Date | undefined {
    if (this.type == BatchUserAttributeType.DATE) {
      return new Date((this.value as Date).getTime());
    }
    return undefined;
  }
}
