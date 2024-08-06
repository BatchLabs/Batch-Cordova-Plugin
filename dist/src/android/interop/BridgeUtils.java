package com.batch.cordova.android.interop;

import android.util.Log;

import androidx.annotation.NonNull;

import com.batch.android.BatchEventAttributes;
import com.batch.android.json.JSONException;
import com.batch.android.json.JSONObject;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

public class BridgeUtils {

    @SuppressWarnings("unchecked")
    static <T> T getTypedParameter(Map<String, Object> parameters, String parameterName, Class<T> parameterClass) throws BridgeException {
        Object result = null;

        if (parameters != null) {
            result = parameters.get(parameterName);
        }

        if (result == null) {
            throw new BridgeException("Invalid parameter : Required parameter '" + parameterName + "' missing");
        }

        if (!parameterClass.isInstance(result)) {
            throw new BridgeException("Invalid parameter : Required parameter '" + parameterName + "' of wrong type");
        }

        return (T) result;
    }

    @SuppressWarnings("unchecked")
    static <T> T getOptionalTypedParameter(Map<String, Object> parameters, String parameterName, Class<T> parameterClass, T fallback) {
        Object result = null;

        if (parameters != null) {
            result = parameters.get(parameterName);
        }

        if (result == null || !parameterClass.isInstance(result)) {
            return fallback;
        }

        return (T) result;
    }

    @SuppressWarnings("unchecked")
    static BatchEventAttributes convertSerializedEventDataToEventAttributes(Map<String, Object> eventData) throws BridgeException {
        BatchEventAttributes batchEventAttributes = null;
        if (eventData != null) {
            batchEventAttributes = new BatchEventAttributes();

            for (Map.Entry<String, Object> attributeEntry : eventData.entrySet()) {
                Object entryKey = attributeEntry.getKey();
                Object entryValue = attributeEntry.getValue();
                if (!(entryKey instanceof String entryStringKey)) {
                    continue;
                }
                if (!(entryValue instanceof Map)) {
                    continue;
                }
                Map<String, Object> entryMapValue = (Map<String, Object>) entryValue;
                String type = getTypedParameter(entryMapValue, "type", String.class);

                switch (type) {
                    case "s" ->
                            batchEventAttributes.put(entryStringKey, getTypedParameter(entryMapValue, "value", String.class));
                    case "b" ->
                            batchEventAttributes.put(entryStringKey, getTypedParameter(entryMapValue, "value", Boolean.class));
                    case "i" ->
                            batchEventAttributes.put(entryStringKey, getTypedParameter(entryMapValue, "value", Number.class).longValue());
                    case "f" ->
                            batchEventAttributes.put(entryStringKey, getTypedParameter(entryMapValue, "value", Number.class).doubleValue());
                    case "d" -> {
                        long timestamp = getTypedParameter(entryMapValue, "value", Number.class).longValue();
                        batchEventAttributes.put(entryStringKey, new Date(timestamp));
                    }
                    case "u" -> {
                        String rawURI = getTypedParameter(entryMapValue, "value", String.class);
                        try {
                            batchEventAttributes.put(entryStringKey, new URI(rawURI));
                        } catch (URISyntaxException e) {
                            throw new BridgeException("Invalid parameter: Bad URL event data syntax", e);
                        }
                    }
                    case "o" ->
                            batchEventAttributes.put(entryStringKey, convertSerializedEventDataToEventAttributes(getTypedParameter(entryMapValue, "value", Map.class)));
                    case "sa" ->
                            batchEventAttributes.putStringList(entryStringKey, getTypedParameter(entryMapValue, "value", List.class));
                    case "oa" -> {
                        List<BatchEventAttributes> eventAttributesList = new ArrayList<>();
                        List<Map<String, Object>> list = getTypedParameter(entryMapValue, "value", List.class);
                        for (int i = 0; i < list.size(); i++) {
                            BatchEventAttributes object = convertSerializedEventDataToEventAttributes(list.get(i));
                            if (object != null) {
                                eventAttributesList.add(object);
                            }
                        }
                        batchEventAttributes.putObjectList(entryStringKey, eventAttributesList);
                    }
                    default ->
                            throw new BridgeException("Invalid parameter: Unknown event_data.attributes type");
                }
            }
        }
        return batchEventAttributes;
    }

    // Translates a modern Promise (that returns complex objects or throw) to a "legacy" bridge one (for older base bridges)
    // To do this, it serializes Maps (arrays and numbers are not supported) to JSON strings
    // and also wraps errors as the Bridge doesn't support catching and expects the Promise to always
    // be resolved with a JSON message, even if it's an error object.
    @SuppressWarnings({"unchecked", "rawtypes"})
    @NonNull
    public static SimplePromise<String> convertModernPromiseToLegacy(@NonNull SimplePromise<Object> originalPromise) {
        SimplePromise<String> resultPromise = new SimplePromise<>();

        originalPromise.then(value -> {
            Object finalValue = value;
            if (value instanceof Map) {
                try {
                    finalValue = JSONHelper.fromMap((Map) value);
                } catch (JSONException e) {
                    Log.d("BatchBridge", "Could not convert error", e);
                    finalValue = "{'error':'Internal native error (-1100)', 'code': -1100}";
                }
            }
            resultPromise.resolve(finalValue != null ? finalValue.toString() : null);
        });
        originalPromise.catchException(e -> {
            String finalValue;
            try {
                JSONObject errorObject = new JSONObject();
                errorObject.put("error", e.getMessage());
                errorObject.put("code", -1101); // Error codes are not yet supported on Android
                finalValue = errorObject.toString();
            } catch (JSONException jsonException) {
                finalValue = "{'error':'Internal native error (-1200)', 'code': -1200}";
            }
            resultPromise.resolve(finalValue);
        });
        return resultPromise;
    }
}
