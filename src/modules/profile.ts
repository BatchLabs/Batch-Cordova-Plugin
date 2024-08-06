import {Profile} from "../actions";
import {
    isString,
    sendToBridge, sendToBridgePromise,
    writeBatchLog,
} from "../helpers";

import Consts from "../consts";
import { BatchEventAttributes } from "./profile/batchEventAttributes";
import { BatchProfileAttributeEditor } from "./profile/profileAttributeEditor";
import { BatchSDK } from "../../types";


export class ProfileModule implements BatchSDK.ProfileModule {
    public eventData: typeof BatchSDK.BatchEventAttributes;

    constructor() {
        this.eventData = BatchEventAttributes;
    }

    public getEditor(): BatchProfileAttributeEditor {
        return new BatchProfileAttributeEditor(true);
    }

    public trackEvent(
        name: string,
        data?: BatchSDK.BatchEventAttributes
    ): Promise<string | undefined> {
        const parameters: {
            name: string;
            event_data?: unknown;
        } = { name };
        parameters.event_data = data instanceof BatchEventAttributes ? data._toInternalRepresentation() : null;
        return sendToBridgePromise(Profile.TrackEvent, [parameters]);
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

        sendToBridge(null, Profile.TrackLocation, [
            {
                date: location.date ? location.date.getTime() : undefined,
                latitude: location.latitude,
                longitude: location.longitude,
                precision: location.precision,
            },
        ]);
    }
}
