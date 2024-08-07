package com.batch.cordova.android.interop;

import static com.batch.cordova.android.interop.BridgeUtils.convertSerializedEventDataToEventAttributes;
import static com.batch.cordova.android.interop.BridgeUtils.convertModernPromiseToLegacy;
import static com.batch.cordova.android.interop.BridgeUtils.getOptionalTypedParameter;
import static com.batch.cordova.android.interop.BridgeUtils.getTypedParameter;

import android.app.Activity;
import android.content.Intent;
import android.location.Location;
import android.util.Log;

import androidx.annotation.NonNull;

import com.batch.android.Batch;
import com.batch.android.BatchAttributesFetchListener;
import com.batch.android.BatchEmailSubscriptionState;
import com.batch.android.BatchEventAttributes;
import com.batch.android.BatchMessage;
import com.batch.android.BatchPushRegistration;
import com.batch.android.BatchTagCollectionsFetchListener;
import com.batch.android.BatchUserAttribute;
import com.batch.android.BatchProfileAttributeEditor;
import com.batch.android.LoggerDelegate;
import com.batch.android.PushNotificationType;

import com.batch.android.json.JSONException;
import com.batch.android.json.JSONObject;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Date;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Bridge that allows code to use Batch's APIs via an action+parameters request, to easily bridge it to some kind of JSON RPC
 */

public class Bridge {
    private static final String INVALID_PARAMETER = "Invalid parameter";

    private static final String BRIDGE_VERSION_ENVIRONEMENT_VAR = "batch.bridge.version";

    private static final String BRIDGE_VERSION = "Bridge/2.0";

    private static final InboxBridge inboxBridge = new InboxBridge();

    private static final String TAG = "BatchBridge";

    static {
        System.setProperty(BRIDGE_VERSION_ENVIRONEMENT_VAR, BRIDGE_VERSION);
    }

    @SuppressWarnings("unused")
    public static SimplePromise<String> call(String action, Map<String, Object> parameters, Callback callback, Activity activity) {
        SimplePromise<String> result = null;
        try {
            result = doAction(action, parameters, activity);
        } catch (Exception e) {
            Log.e("Batch Bridge", "Batch bridge raised an exception", e);
            if (callback != null) {
                final Map<String, Object> failResult = new HashMap<>();
                failResult.put("action", action);
                failResult.put("error", errorToMap(e));
                callback.callback(Result.BRIDGE_FAILURE.getName(), failResult);
            }
        }

        if (result == null) {
            result = SimplePromise.resolved("");
        }

        return result;
    }

    private static SimplePromise<String> doAction(String actionName, Map<String, Object> parameters, Activity activity) throws BridgeException, BatchBridgeNotImplementedException {
        if (actionName == null || actionName.isEmpty()) {
            throw new BridgeException(INVALID_PARAMETER + " : Empty or null action");
        }

        Action action;
        try {
            action = Action.fromName(actionName);
        } catch (IllegalArgumentException actionParsingException) {
            throw new BridgeException(INVALID_PARAMETER + " : Unknown action '" + actionName + "'", actionParsingException);
        }

        switch (action) {
            case SET_CONFIG:
                setConfig(parameters);
                break;
            case START:
                start(activity);
                break;
            case STOP:
                stop(activity);
                break;
            case DESTROY:
                destroy(activity);
                break;
            case ON_NEW_INTENT:
                onNewIntent(activity, getTypedParameter(parameters, "intent", Intent.class));
                break;
            case OPT_IN:
                optIn(activity);
                break;
            case OPT_OUT:
                optOut(activity, false);
                break;
            case OPT_OUT_AND_WIPE_DATA:
                optOut(activity, true);
                break;
            case MESSAGING_SET_DO_NOT_DISTURB_ENABLED:
                Batch.Messaging.setDoNotDisturbEnabled(getTypedParameter(parameters, "enabled", Boolean.class));
                break;
            case MESSAGING_SHOW_PENDING_MESSAGE:
                showPendingMessage(activity);
                break;
            case PUSH_GET_LAST_KNOWN_TOKEN:
                return SimplePromise.resolved(getLastKnownPushToken());
            case PUSH_DISMISS_NOTIFICATIONS:
                dismissNotifications();
                break;
            case PUSH_REGISTER:
                // iOS only, do nothing
                return null;
            case PUSH_CLEAR_BADGE:
                // iOS only, do nothing
                return null;
            case PUSH_SET_IOSNOTIF_TYPES:
                // iOS only, do nothing
                return null;
            case PUSH_SET_ANDROIDNOTIF_TYPES:
                setNotificationTypes(getTypedParameter(parameters, "notifTypes", Integer.class));
                break;
            case PUSH_SET_IOSSHOW_FOREGROUND:
                // iOS only, do nothing
                return null;
            case PUSH_IOS_REFRESH_TOKEN:
                // iOS only, do nothing
                return null;
            case PUSH_REQUEST_AUTHORIZATION:
                requestAuthorization(activity);
                break;
            case PUSH_IOS_REQUEST_PROVISIONAL_AUTH:
                // iOS only, do nothing
                return null;
            case PROFILE_IDENTIFY:
                identify(parameters);
                break;
            case PROFILE_EDIT:
                editProfileAttributes(parameters);
                break;
            case PROFILE_TRACK_EVENT:
                return convertModernPromiseToLegacy(trackEvent(parameters));
            case PROFILE_TRACK_LOCATION:
                trackLocation(parameters);
                break;
            case USER_GET_INSTALLATION_ID:
                return SimplePromise.resolved(Batch.User.getInstallationID());
            case USER_GET_LANGUAGE:
                return SimplePromise.resolved(Batch.User.getLanguage(activity));
            case USER_GET_REGION:
                return SimplePromise.resolved(Batch.User.getRegion(activity));
            case USER_GET_IDENTIFIER:
                return SimplePromise.resolved(Batch.User.getIdentifier(activity));
            case USER_FETCH_ATTRIBUTES:
                return convertModernPromiseToLegacy(userFetchAttributes(activity));
            case USER_FETCH_TAGS:
                return convertModernPromiseToLegacy(userFetchTags(activity));
            case INBOX_CREATE_INSTALLATION_FETCHER:
            case INBOX_CREATE_USER_FETCHER:
            case INBOX_RELEASE_FETCHER:
            case INBOX_FETCH_NEW_NOTIFICATIONS:
            case INBOX_FETCH_NEXT_PAGE:
            case INBOX_GET_FETCHED_NOTIFICATIONS:
            case INBOX_MARK_AS_READ:
            case INBOX_MARK_ALL_AS_READ:
            case INBOX_MARK_AS_DELETED:
            case INBOX_DISPLAY_LANDING_MESSAGE:
                return inboxBridge.compatDoAction(action, parameters, activity);
            default:
                throw new BridgeException(INVALID_PARAMETER + " : Action '" + actionName + "' is known, but not implemented");
        }

        return null;
    }

    private static Map<String, Object> errorToMap(Exception exception) {
        final Map<String, Object> errorMap = new HashMap<>();

        if (exception != null) {
            errorMap.put("cause", exception.getMessage());
            errorMap.put("kind", exception.toString());
        }

        return errorMap;
    }

    // region Core Module

    private static void setConfig(Map<String, Object> parameters) throws BridgeException {
        LoggerDelegate loggerDelegate = null;
        try {
            loggerDelegate = getTypedParameter(parameters, "logger", LoggerDelegate.class);
        } catch (BridgeException e) {
            // The parameter is optional, disregard the exception
            // TODO : Maybe improve this if the parameter is here but deserialization failed
        }

        if (loggerDelegate != null) {
            Batch.setLoggerDelegate(loggerDelegate);
        }
        Batch.start(getTypedParameter(parameters, "APIKey", String.class));
    }

    private static void start(Activity activity) {
        Batch.onStart(activity);
    }

    private static void stop(Activity activity) {
        Batch.onStop(activity);
    }

    private static void destroy(Activity activity) {
        Batch.onDestroy(activity);
    }

    private static void onNewIntent(Activity activity, Intent intent) {
        Batch.onNewIntent(activity, intent);
    }

    private static void optIn(Activity activity) {
        Batch.optIn(activity);
        Batch.onStart(activity);
    }

    private static void optOut(Activity activity, boolean wipeData) {
        if (wipeData) {
            Batch.optOutAndWipeData(activity);
        } else {
            Batch.optOut(activity);
        }
    }

    private static String getLastKnownPushToken() {
        BatchPushRegistration registration = Batch.Push.getRegistration();
        return registration != null ? registration.getToken() : "";
    }

    // endregion
    // region Push Module

    private static void dismissNotifications() {
        Batch.Push.dismissNotifications();
    }

    private static void setNotificationTypes(Integer types) {
        // Setup notification types.
        EnumSet<PushNotificationType> pushTypes = PushNotificationType.fromValue(types.intValue());
        Batch.Push.setNotificationsType(pushTypes);
    }

    private static void requestAuthorization(Activity activity) {
        // Ask for android 13 notification permission
        Batch.Push.requestNotificationPermission(activity);
    }

    // endregion
    //region Messaging Module

    private static void showPendingMessage(Activity activity) {
        BatchMessage msg = Batch.Messaging.popPendingMessage();
        if (msg != null) {
            Batch.Messaging.show(activity, msg);
        }
    }

    //endregion
    // region Profile Module

    private static void identify(Map<String, Object> parameters) {
        String identifier = getOptionalTypedParameter(parameters, "custom_user_id", String.class, null);
        Batch.Profile.identify(identifier);
    }

    @SuppressWarnings({"unchecked", "ConstantConditions"})
    private static void editProfileAttributes(Map<String, Object> parameters) throws BridgeException {
        try {
            //noinspection unchecked
            List<Map<String, Object>> operations = getTypedParameter(parameters, "operations", List.class);

            if (operations == null) {
                return;
            }

            BatchProfileAttributeEditor editor = Batch.Profile.editor();

            for (Map<String, Object> operationDescription : operations) {
                String operationName = getTypedParameter(operationDescription, "operation", String.class);

                switch (operationName) {
                    case "SET_LANGUAGE" -> {
                        Object value = operationDescription.get("value");
                        if (value != null && !(value instanceof String)) {
                            Log.e("Batch Bridge", "Invalid SET_LANGUAGE value: it can only be a string or null");
                            // Invalid value, continue. NULL is allowed though
                            continue;
                        }
                        editor.setLanguage((String) value);
                    }
                    case "SET_REGION" -> {
                        Object value = operationDescription.get("value");
                        if (value != null && !(value instanceof String)) {
                            Log.e("Batch Bridge", "Invalid SET_REGION value: it can only be a string or null");
                            // Invalid value, continue. NULL is allowed though
                            continue;
                        }
                        editor.setRegion((String) value);
                    }
                    case "SET_EMAIL_ADDRESS" -> {
                        Object value = operationDescription.get("value");
                        if (value != null && !(value instanceof String)) {
                            Log.e("Batch Bridge", "Invalid SET_EMAIL value: it can only be a string or null");
                            // Invalid value, continue. NULL is allowed though
                            continue;
                        }
                        editor.setEmailAddress((String) value);
                    }
                    case "SET_EMAIL_MARKETING_SUB" -> {
                        Object value = operationDescription.get("value");
                        if (value == null || !(value instanceof String)) {
                            Log.e("Batch Bridge", "Invalid SET_EMAIL_MARKETING_SUB value: it can only be a string");
                            // Invalid value, continue.
                            continue;
                        }

                        if ("subscribed".equals(value)) {
                            editor.setEmailMarketingSubscription(BatchEmailSubscriptionState.SUBSCRIBED);
                        } else if ("unsubscribed".equals(value)) {
                            editor.setEmailMarketingSubscription(BatchEmailSubscriptionState.UNSUBSCRIBED);
                        } else {
                            Log.e("Batch Bridge", "Invalid SET_EMAIL_MARKETING_SUBSCRIPTION value: it can only be `subscribed` or `unsubscribed`.");
                        }
                    }
                    case "SET_ATTRIBUTE" -> {
                        String key = getTypedParameter(operationDescription, "key", String.class);
                        String type = getTypedParameter(operationDescription, "type", String.class);

                        switch (type) {
                            case "string" ->
                                    editor.setAttribute(key, getTypedParameter(operationDescription, "value", String.class));
                            case "url" -> {
                                try {
                                    editor.setAttribute(key, new URI(getTypedParameter(operationDescription, "value", String.class)));
                                } catch (URISyntaxException e) {
                                    Log.e("Batch Bridge", "Invalid SET_ATTRIBUTE url value: couldn't parse value", e);
                                }
                            }
                            case "date" ->
                                    editor.setAttribute(key, new Date(getTypedParameter(operationDescription, "value", Number.class).longValue()));
                            case "integer" -> {
                                Object rawValue = operationDescription.get("value");

                                if (rawValue instanceof Number) {
                                    editor.setAttribute(key, ((Number) rawValue).longValue());
                                } else if (rawValue instanceof String) {
                                    try {
                                        editor.setAttribute(key, Long.parseLong((String) rawValue));
                                    } catch (NumberFormatException e) {
                                        Log.e("Batch Bridge", "Invalid SET_ATTRIBUTE integer value: couldn't parse value", e);
                                    }
                                }
                            }
                            case "float" -> {
                                Object rawValue = operationDescription.get("value");

                                if (rawValue instanceof Number) {
                                    editor.setAttribute(key, ((Number) rawValue).doubleValue());
                                } else if (rawValue instanceof String) {
                                    try {
                                        editor.setAttribute(key, Double.parseDouble((String) rawValue));
                                    } catch (NumberFormatException e) {
                                        Log.e("Batch Bridge", "Invalid SET_ATTRIBUTE float value: couldn't parse value", e);
                                    }
                                }
                            }
                            case "boolean" -> {
                                Object rawValue = operationDescription.get("value");

                                if (rawValue instanceof Boolean) {
                                    editor.setAttribute(key, (Boolean) rawValue);
                                } else if (rawValue instanceof String) {
                                    try {
                                        editor.setAttribute(key, Boolean.parseBoolean((String) rawValue));
                                    } catch (NumberFormatException e) {
                                        Log.e("Batch Bridge", "Invalid SET_ATTRIBUTE boolean value: couldn't parse value", e);
                                    }
                                }
                            }
                            case "array" -> {
                                List<String> value = getTypedParameter(operationDescription, "value", ArrayList.class);
                                if (value != null) {
                                    editor.setAttribute(key, new ArrayList<String>(value));
                                }
                            }
                        }
                    }
                    case "REMOVE_ATTRIBUTE" ->
                            editor.removeAttribute(getTypedParameter(operationDescription, "key", String.class));
                    case "ADD_TO_ARRAY" -> {
                        String key = getTypedParameter(operationDescription, "key", String.class);
                        String value = getOptionalTypedParameter(operationDescription, "value", String.class, null);
                        List<String> arrayValue = getOptionalTypedParameter(operationDescription, "value", ArrayList.class, null);
                        if (value != null) {
                            editor.addToArray(key, value);
                        } else if (arrayValue != null){
                            editor.addToArray(key, new ArrayList<>(arrayValue));
                        }
                    }
                    case "REMOVE_FROM_ARRAY" -> {
                        String key = getTypedParameter(operationDescription, "key", String.class);
                        String value = getOptionalTypedParameter(operationDescription, "value", String.class, null);
                        List<String> arrayValue = getOptionalTypedParameter(operationDescription, "value", ArrayList.class, null);
                        if (value != null) {
                            editor.removeFromArray(key, value);
                        } else if (arrayValue != null){
                            editor.removeFromArray(key, new ArrayList<>(arrayValue));
                        }
                    }
                }
            }
            editor.save();
        } catch (ClassCastException e) {
            throw new BridgeException("Error while reading operations ", e);
        }
    }

    private static SimplePromise<Object> trackEvent(Map<String, Object> parameters) {
        return new SimplePromise<>(promise -> {
            String name = null;
            try {
                name = getTypedParameter(parameters, "name", String.class);
            } catch (BridgeException e) {
                promise.reject(new BridgeException("Missing event name parameter.", e));
                return;
            }
            Map<String, Object>  data = null;
            try {
                data = getTypedParameter(parameters, "event_data", Map.class);
            } catch (BridgeException e) {
                // Event data are optionals, disregard the exception
            }
            if (data != null) {
                try {
                    BatchEventAttributes batchEventAttributes = convertSerializedEventDataToEventAttributes(data);
                    List<String> errors = batchEventAttributes.validateEventAttributes();
                    if (errors.isEmpty()) {
                        Batch.Profile.trackEvent(name, batchEventAttributes);
                        promise.resolve(null);
                    } else {
                        Log.w("Batch Bridge", "Invalid event attributes: " + errors);
                        promise.reject(new BridgeException("Invalid event attributes: " + errors));
                    }
                } catch (BridgeException e) {
                    promise.reject(e);
                }
            } else {
                Batch.Profile.trackEvent(name, null);
            }
        });
    }

    private static void trackLocation(Map<String, Object> parameters) throws BridgeException {
        double latitude = getTypedParameter(parameters, "latitude", Number.class).doubleValue();
        double longitude = getTypedParameter(parameters, "longitude", Number.class).doubleValue();

        Integer precision = null;
        try {
            precision = getTypedParameter(parameters, "precision", Integer.class);
        } catch (BridgeException e) {
            // The parameter is optional, disregard the exception
        }

        Number date = null;
        try {
            date = getTypedParameter(parameters, "date", Number.class);
        } catch (BridgeException e) {
            // The parameter is optional, disregard the exception
        }

        Location location = new Location("com.batch.android.cordova.bridge");
        location.setLatitude(latitude);
        location.setLongitude(longitude);

        if (precision != null) {
            location.setAccuracy(precision.floatValue());
        }

        if (date != null) {
            location.setTime(date.longValue());
        }
        Batch.Profile.trackLocation(location);
    }

    //endregion
    //region User Module

    private static SimplePromise<Object> userFetchAttributes(Activity activity) {
        return new SimplePromise<>(promise -> {
            Batch.User.fetchAttributes(activity, new BatchAttributesFetchListener() {
                @Override
                public void onSuccess(@NonNull Map<String, BatchUserAttribute> map) {
                    Map<String, Map<String, Object>> bridgeAttributes = new HashMap<>();

                    for (Map.Entry<String, BatchUserAttribute> attributeEntry : map.entrySet()) {
                        Map<String, Object> typedBrdigeAttribute = new HashMap<>();
                        BatchUserAttribute attribute = attributeEntry.getValue();

                        String type;
                        Object value = attribute.value;
                        switch (attribute.type) {
                            case BOOL:
                                type = "b";
                                break;
                            case DATE: {
                                type = "d";
                                Date dateValue = attribute.getDateValue();
                                if (dateValue == null) {
                                    promise.reject(new BridgeException("Fetch attribute: Could not parse date for key: " + attributeEntry.getKey()));
                                    return;
                                }
                                value = dateValue.getTime();
                                break;
                            }
                            case STRING:
                                type = "s";
                                break;
                            case LONGLONG:
                                type = "i";
                                break;
                            case DOUBLE:
                                type = "f";
                                break;
                            case URL:
                                type = "u";
                                URI uriValue = attribute.getUriValue();
                                if (uriValue == null) {
                                    promise.reject(new BridgeException("Fetch attribute: Could not parse URL for key: " + attributeEntry.getKey()));
                                    return;
                                }
                                value = uriValue.toString();
                                break;
                            default:
                                promise.reject(new BridgeException("Fetch attribute: Unknown attribute type " + attribute.type + " for key: " + attributeEntry.getKey()));
                                return;
                        }

                        typedBrdigeAttribute.put("type", type);
                        typedBrdigeAttribute.put("value", value);

                        bridgeAttributes.put(attributeEntry.getKey(), typedBrdigeAttribute);
                    }

                    final Map<String, Map<String, Map<String, Object>>> resultMap = new HashMap<>();
                    resultMap.put("attributes", bridgeAttributes);
                    promise.resolve(resultMap);
                }

                @Override
                public void onError() {
                    promise.reject(new BridgeException("Native fetchAttributes returned an error"));
                }
            });
        });
    }

    private static SimplePromise<Object> userFetchTags(Activity activity) {
        return new SimplePromise<>(promise -> {
            Batch.User.fetchTagCollections(activity, new BatchTagCollectionsFetchListener() {
                @Override
                public void onSuccess(@NonNull Map<String, Set<String>> map) {
                    Map<String, List<String>> bridgeTagCollections = new HashMap<>();

                    for (Map.Entry<String, Set<String>> tagCollection : map.entrySet()) {
                        bridgeTagCollections.put(tagCollection.getKey(), new ArrayList<>(tagCollection.getValue()));
                    }

                    final Map<String, Map<String, List<String>>> resultMap = new HashMap<>();
                    resultMap.put("tagCollections", bridgeTagCollections);
                    promise.resolve(resultMap);
                }

                @Override
                public void onError() {
                    promise.reject(new BridgeException("Native fetchTagCollections returned an error"));
                }
            });
        });
    }

    //endregion

}
