import {BatchSDK} from "../../../types";
import {Profile, UserDataOperation} from "../../actions";
import Consts from "../../consts";
import {isNumber, isString, isStringArray, sendToBridge, writeBatchLog} from "../../helpers";

interface IOperation {
    operation: UserDataOperation;

    [key: string]: unknown;
}

export class BatchProfileAttributeEditor implements BatchSDK.BatchProfileAttributeEditor {
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


    public setEmailAddress(email: string | null): this {
        if (typeof email !== "string" && email !== null) {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Email must be a string or null"
            );
            return this;
        }
        this._enqueueOperation(UserDataOperation.SetEmail, {
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
        this._enqueueOperation(UserDataOperation.SetEmailMarketingSubscription, {
            value: state,
        });
        return this;
    }

    public setAttribute(
        key: string,
        value: string | number | boolean | Date | URL | Array<string>
    ): this {
        if (!Consts.AttributeKeyRegexp.test(key || "")) {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Invalid key. Please make sure that the key is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring attribute '" +
                key +
                "'"
            );
            return this;
        }

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

        const operationData = {value, key, type: ""};

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
            if (
                value.length === 0 ||
                value.length > Consts.AttributeStringMaxLength
            ) {
                writeBatchLog(
                    false,
                    "BatchProfileAttributeEditor - String attributes can't be empty or longer than " +
                    Consts.AttributeStringMaxLength +
                    " characters. Ignoring attribute '" +
                    key +
                    "'."
                );
                return this;
            }
            operationData.type = "string";
        } else if (isStringArray(value)) {
            if (
                value.length === 0 ||
                value.length > Consts.AttributeStringArrayMaxSize
            ) {
                writeBatchLog(
                    false,
                    "BatchProfileAttributeEditor - String Array attributes can't be empty or longer than " +
                    Consts.AttributeStringArrayMaxSize +
                    " characters. Ignoring attribute '" +
                    key +
                    "'."
                );
                return this;
            }
            operationData.type = "array";
        } else if (
            (value as unknown) instanceof Boolean || typeof value === "boolean") {
            operationData.type = "boolean";
        } else {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Value argument must be one of these types: number, string, boolean, date, array"
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
                "BatchProfileAttributeEditor - Invalid key. Please make sure that the key is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring attribute '" +
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


    public addToArray(key: string, value: string | Array<string>): this {
        if (!isString(key)) {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Key argument must be a string"
            );
            return this;
        }

        if (!Consts.AttributeKeyRegexp.test(key || "")) {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Invalid Key. Please make sure that the key is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring key '" +
                key +
                "'"
            );
            return this;
        }

        if (typeof value === "undefined") {
            writeBatchLog(false, "BatchProfileAttributeEditor - A value is required");
            return this;
        }

        if (isString(value)) {
            if (value.length === 0 || value.length > Consts.AttributeStringMaxLength) {
                writeBatchLog(
                    false,
                    "BatchProfileAttributeEditor - String item can't be empty or longer than " +
                    Consts.AttributeStringMaxLength +
                    " characters. Ignoring item '" +
                    value +
                    "'."
                );
                return this;
            }
        } else if (isStringArray(value)) {
            if (value.length === 0 || value.length > Consts.AttributeStringArrayMaxSize) {
                writeBatchLog(
                    false,
                    "BatchProfileAttributeEditor - String Array attribute can't be empty or longer than " +
                    Consts.AttributeStringMaxLength
                    + "'."
                );
                return this;
            }
        } else {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Value argument must be a string or an array of string"
            );
        }

        this._enqueueOperation(UserDataOperation.AddToArray, {
            key,
            value,
        });

        return this;
    }

    public removeFromArray(key: string, value: string | Array<string>): this {
        if (typeof key !== "string" && !((key as unknown) instanceof String)
        ) {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Key argument must be a string"
            );
            return this;
        }

        if (!Consts.AttributeKeyRegexp.test(key || "")) {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Invalid key. Please make sure that the key is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring key '" +
                key +
                "'"
            );
            return this;
        }

        if (typeof value === "undefined") {
            writeBatchLog(false, "BatchProfileAttributeEditor - A value is required");
            return this;
        }

        if (isString(value)) {
            if (value.length === 0 || value.length > Consts.AttributeStringMaxLength) {
                writeBatchLog(
                    false,
                    "BatchProfileAttributeEditor - Array item can't be empty or longer than " +
                    Consts.AttributeStringMaxLength +
                    " characters. Ignoring item '" +
                    value +
                    "'."
                );
                return this;
            }
        } else if (isStringArray(value)) {
            if (value.length === 0 || value.length > Consts.AttributeStringArrayMaxSize) {
                writeBatchLog(
                    false,
                    "BatchProfileAttributeEditor - String Array attribute can't be empty or longer than " +
                    Consts.AttributeStringMaxLength
                    + "'."
                );
                return this;
            }
        } else {
            writeBatchLog(
                false,
                "BatchProfileAttributeEditor - Value argument must be a string or an array of string"
            );
        }
        this._enqueueOperation(UserDataOperation.RemoveFromArray, {key, value});
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
