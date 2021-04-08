package com.batch.cordova.interop;

import android.app.Activity;
import android.content.Intent;
import android.location.Location;
import android.util.Log;

import com.batch.android.Batch;
import com.batch.android.BatchEventData;
import com.batch.android.BatchMessage;
import com.batch.android.BatchUserDataEditor;
import com.batch.android.BatchUserProfile;
import com.batch.android.Config;
import com.batch.android.LoggerDelegate;
import com.batch.android.PushNotificationType;

import com.batch.android.json.JSONObject;

import java.lang.RuntimeException;
import java.util.Date;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Bridge that allows code to use Batch's APIs via an action+parameters request, to easily bridge it to some kind of JSON RPC
 */

public class Bridge
{
	private static final String INVALID_PARAMETER = "Invalid parameter";

	private static final String BRIDGE_VERSION_ENVIRONEMENT_VAR = "batch.bridge.version";

	private static final String BRIDGE_VERSION = "Bridge/2.0";

	static
	{
		System.setProperty(BRIDGE_VERSION_ENVIRONEMENT_VAR, BRIDGE_VERSION);
	}

	@SuppressWarnings("unused")
    public static SimplePromise<String> call(String action, Map<String, Object> parameters, Callback callback, Activity activity)
    {
        SimplePromise<String> result = null;
		try
		{
			result = doAction(action, parameters, activity);
		}
		catch (Exception e)
		{
			Log.e("Batch Bridge", "Batch bridge raised an exception", e);
			if( callback != null )
			{
				final Map<String, Object> failResult = new HashMap<>();
				failResult.put("action", action);
				failResult.put("error", errorToMap(e));
				callback.callback(Result.BRIDGE_FAILURE.getName(), failResult);
			}
		}

        if (result == null)
        {
            result = SimplePromise.resolved("");
        }

        return result;
    }

	private static SimplePromise<String> doAction(String actionName, Map<String, Object> parameters, Activity activity) throws BridgeException
	{
		if( actionName == null || actionName.length() == 0 )
		{
			throw new BridgeException(INVALID_PARAMETER + " : Empty or null action");
		}

		Action action;
		try
		{
			action = Action.fromName(actionName);
		}
		catch (IllegalArgumentException actionParsingException)
		{
			throw new BridgeException(INVALID_PARAMETER + " : Unknown action '" + actionName + "'", actionParsingException);
		}

        switch( action )
		{
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
			case SET_CUSTOM_USER_ID:
				setCustomUserID(getTypedParameter(parameters, "customID", String.class));
				break;
            case GET_CUSTOM_USER_ID:
                return SimplePromise.resolved(getCustomUserID());
            case SET_APP_LANGUAGE:
                setAppLanguage(getTypedParameter(parameters, "language", String.class));
                break;
            case GET_APP_LANGUAGE:
                return SimplePromise.resolved(getAppLanguage());
            case SET_APP_REGION:
                setAppRegion(getTypedParameter(parameters, "region", String.class));
                break;
            case GET_APP_REGION:
                return SimplePromise.resolved(getAppRegion());
			case INBOX_FETCH:
				return InboxBridge.fetchNotifications(activity);
			case INBOX_FETCH_FOR_USER_ID:
				return InboxBridge.fetchNotifications(
					activity,
					getTypedParameter(parameters, "id", String.class),
					getTypedParameter(parameters, "auth", String.class)
				);
			case MESSAGING_SET_DO_NOT_DISTURB_ENABLED:
				Batch.Messaging.setDoNotDisturbEnabled(getTypedParameter(parameters, "enabled", Boolean.class));
				break;
			case MESSAGING_SHOW_PENDING_MESSAGE:
				showPendingMessage(activity);
				break;
            case PUSH_SET_GCM_SENDER_ID:
                setGCMSenderID(getTypedParameter(parameters, "senderID", String.class));
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
			case USER_EDIT:
				userDataEdit(parameters);
				break;
			case USER_TRACK_EVENT:
				trackEvent(parameters);
				break;
			case USER_TRACK_LEGACY_EVENT:
				trackLegacyEvent(parameters);
				break;
			case USER_TRACK_TRANSACTION:
				trackTransaction(parameters);
				break;
			case USER_TRACK_LOCATION:
				trackLocation(parameters);
				break;
			case USER_DATA_DEBUG:
				Batch.User.printDebugInformation();
				break;
			case USER_GET_INSTALLATION_ID:
				return SimplePromise.resolved(Batch.User.getInstallationID());
			default:
				throw new BridgeException(INVALID_PARAMETER + " : Action '" + actionName + "' is known, but not implemented");
		}

        return null;
	}

	@SuppressWarnings("unchecked")
	private static <T> T getTypedParameter(Map<String, Object> parameters, String parameterName, Class<T> parameterClass) throws BridgeException
	{
		Object result = null;

		if( parameters != null )
		{
			result = parameters.get(parameterName);
		}

		if( result == null )
		{
			throw new BridgeException(INVALID_PARAMETER + " : Required parameter '" + parameterName + "' missing");
		}

		if( !parameterClass.isInstance(result) )
		{
			throw new BridgeException(INVALID_PARAMETER + " : Required parameter '" + parameterName + "' of wrong type");
		}

		return (T) result;
	}

	private static Map<String, Object> errorToMap(Exception exception)
	{
		final Map<String, Object> errorMap = new HashMap<>();

		if( exception != null )
		{
			errorMap.put("cause", exception.getMessage());
			errorMap.put("kind", exception.toString());
		}

		return errorMap;
	}

	private static void setConfig(Map<String, Object> parameters) throws BridgeException
	{
		Boolean useIDFA = null;
		try
		{
			useIDFA = getTypedParameter(parameters, "useIDFA", Boolean.class);
		}
		catch (BridgeException e)
		{
			// The parameter is optional, disregard the exception
			// TODO : Maybe improve this if the parameter is here but deserialization failed
		}

        LoggerDelegate loggerDelegate = null;
        try
        {
            loggerDelegate = getTypedParameter(parameters, "logger", LoggerDelegate.class);
        }
        catch (BridgeException e)
        {
            // The parameter is optional, disregard the exception
            // TODO : Maybe improve this if the parameter is here but deserialization failed
        }

		Config batchConfig = new Config(getTypedParameter(parameters, "APIKey", String.class));
		if( useIDFA != null )
		{
			batchConfig.setCanUseAdvertisingID(useIDFA);
		}
        if( loggerDelegate != null )
        {
            batchConfig.setLoggerDelegate(loggerDelegate);
        }

		batchConfig.setCanUseAndroidID(false);
		Batch.setConfig(batchConfig);
	}

	private static void start(Activity activity)
	{
		Batch.onStart(activity);
	}

	private static void stop(Activity activity)
	{
		Batch.onStop(activity);
	}

	private static void destroy(Activity activity)
	{
		Batch.onDestroy(activity);
	}

	private static void onNewIntent(Activity activity, Intent intent)
	{
		Batch.onNewIntent(activity, intent);
	}

	private static void optIn(Activity activity)
	{
		Batch.optIn(activity);
		Batch.onStart(activity);
	}

	private static void optOut(Activity activity, boolean wipeData)
	{
		if (wipeData) {
			Batch.optOutAndWipeData(activity);
		} else {
			Batch.optOut(activity);
		}
	}

	private static void setCustomUserID(String userId)
	{
        BatchUserProfile profile = Batch.getUserProfile();
        if (profile != null)
        {
            Batch.getUserProfile().setCustomID(userId);
        }
	}

    private static String getCustomUserID()
    {
        BatchUserProfile profile = Batch.getUserProfile();
        if (profile != null)
        {
            return Batch.getUserProfile().getCustomID();
        }

        return null;
    }

    private static void setAppLanguage(String language)
    {
        BatchUserProfile profile = Batch.getUserProfile();
        if (profile != null)
        {
            Batch.getUserProfile().setLanguage(language);
        }
    }

    private static String getAppLanguage()
    {
        BatchUserProfile profile = Batch.getUserProfile();
        if (profile != null)
        {
            return Batch.getUserProfile().getLanguage();
        }

        return null;
    }

    private static void setAppRegion(String region)
    {
        BatchUserProfile profile = Batch.getUserProfile();
        if (profile != null)
        {
            Batch.getUserProfile().setRegion(region);
        }
    }

    private static String getAppRegion()
    {
        BatchUserProfile profile = Batch.getUserProfile();
        if (profile != null)
        {
            return Batch.getUserProfile().getRegion();
        }

        return null;
    }

    private static String getLastKnownPushToken()
    {
        String token = Batch.Push.getLastKnownPushToken();
        return token != null ? token : "";
    }

    private static void setGCMSenderID(String senderId)
    {
        Batch.Push.setGCMSenderId(senderId);
    }

    private static void dismissNotifications()
    {
        Batch.Push.dismissNotifications();
    }

    private static void setNotificationTypes(Integer types)
    {
        // Setup notification types.
        EnumSet<PushNotificationType> pushTypes =  PushNotificationType.fromValue(types.intValue());
        Batch.Push.setNotificationsType(pushTypes);
    }

//region User Data

	private static void userDataEdit(Map<String, Object> parameters) throws BridgeException
	{
		try
		{
			//noinspection unchecked
			List<Map<String, Object>> operations = getTypedParameter(parameters, "operations", List.class);

			if (operations == null)
			{
				return;
			}

			BatchUserDataEditor editor = Batch.User.getEditor();

			for (Map<String, Object> operationDescription : operations)
			{
				String operationName = getTypedParameter(operationDescription, "operation", String.class);

				if ("SET_LANGUAGE".equals(operationName))
				{
					Object value = operationDescription.get("value");

					if (value != null && !(value instanceof String))
					{
						Log.e("Batch Bridge", "Invalid SET_LANGUAGE value: it can only be a string or null");
						// Invalid value, continue. NULL is allowed though
						continue;
					}

					editor.setLanguage((String) value);
				}
				else if ("SET_REGION".equals(operationName))
				{
					Object value = operationDescription.get("value");

					if (value != null && !(value instanceof String))
					{
						Log.e("Batch Bridge", "Invalid SET_REGION value: it can only be a string or null");
						// Invalid value, continue. NULL is allowed though
						continue;
					}

					editor.setRegion((String) value);
				}
				else if ("SET_IDENTIFIER".equals(operationName))
				{
					Object value = operationDescription.get("value");

					if (value != null && !(value instanceof String))
					{
						Log.e("Batch Bridge", "Invalid SET_IDENTIFIER value: it can only be a string or null");
						// Invalid value, continue. NULL is allowed though
						continue;
					}

					editor.setIdentifier((String) value);
				}
				else if ("SET_ATTRIBUTE".equals(operationName))
				{
					String key = getTypedParameter(operationDescription, "key", String.class);
					String type = getTypedParameter(operationDescription, "type", String.class);

					if ("string".equals(type))
					{
						editor.setAttribute(key, getTypedParameter(operationDescription, "value", String.class));
					}
					else if ("date".equals(type))
					{
						editor.setAttribute(key, new Date(getTypedParameter(operationDescription, "value", Number.class).longValue()));
					}
					else if ("integer".equals(type))
					{
						Object rawValue = operationDescription.get("value");

						if (rawValue instanceof Number)
						{
							editor.setAttribute(key, ((Number) rawValue).longValue());
						}
						else if (rawValue instanceof String)
						{
							try
							{
								editor.setAttribute(key, Long.parseLong((String) rawValue));
							}
							catch (NumberFormatException e)
							{
								Log.e("Batch Bridge", "Invalid SET_ATTRIBUTE integer value: couldn't parse value", e);
							}
						}
					}
					else if ("float".equals(type))
					{
						Object rawValue = operationDescription.get("value");

						if (rawValue instanceof Number)
						{
							editor.setAttribute(key, ((Number) rawValue).doubleValue());
						}
						else if (rawValue instanceof String)
						{
							try
							{
								editor.setAttribute(key, Double.parseDouble((String) rawValue));
							}
							catch (NumberFormatException e)
							{
								Log.e("Batch Bridge", "Invalid SET_ATTRIBUTE float value: couldn't parse value", e);
							}
						}
					}
					else if ("boolean".equals(type))
					{
						Object rawValue = operationDescription.get("value");

						if (rawValue instanceof Boolean)
						{
							editor.setAttribute(key, (Boolean) rawValue);
						}
						else if (rawValue instanceof String)
						{
							try
							{
								editor.setAttribute(key, Boolean.parseBoolean((String) rawValue));
							}
							catch (NumberFormatException e)
							{
								Log.e("Batch Bridge", "Invalid SET_ATTRIBUTE boolean value: couldn't parse value", e);
							}
						}
					}
				}
				else if ("REMOVE_ATTRIBUTE".equals(operationName))
				{
					editor.removeAttribute(getTypedParameter(operationDescription, "key", String.class));
				}
				else if ("CLEAR_ATTRIBUTES".equals(operationName))
				{
					editor.clearAttributes();
				}
				else if ("ADD_TAG".equals(operationName))
				{
					String tag = getTypedParameter(operationDescription, "tag", String.class);
					String collection = getTypedParameter(operationDescription, "collection", String.class);

					editor.addTag(collection, tag);
				}
				else if ("REMOVE_TAG".equals(operationName))
				{
					String tag = getTypedParameter(operationDescription, "tag", String.class);
					String collection = getTypedParameter(operationDescription, "collection", String.class);

					editor.removeTag(collection, tag);
				}
				else if ("CLEAR_TAGS".equals(operationName))
				{
					editor.clearTags();
				}
				else if ("CLEAR_TAG_COLLECTION".equals(operationName))
				{
					editor.clearTagCollection(getTypedParameter(operationDescription, "collection", String.class));
				}
			}

			editor.save();
		}
		catch (ClassCastException e)
		{
			throw new BridgeException("Error while reading operations ", e);
		}
	}

	private static void trackEvent(Map<String, Object> parameters) throws BridgeException
	{
		String name = getTypedParameter(parameters, "name", String.class);

		String label = null;
		try
		{
			label = getTypedParameter(parameters, "label", String.class);
		}
		catch (BridgeException e)
		{
			// The parameter is optional, disregard the exception
		}

		Map data = null;
		try
		{
			data = getTypedParameter(parameters, "event_data", Map.class);
		}
		catch (BridgeException e)
		{
			// The parameter is optional, disregard the exception
		}

		BatchEventData batchEventData = null;

		if (data != null)
		{
			batchEventData = new BatchEventData();
			List tags = getTypedParameter(data, "tags", List.class);
			Map<String, Object> attributes = getTypedParameter(data, "attributes", Map.class);

			for (Object tag : tags) {
				if (tag instanceof String) {
					batchEventData.addTag((String)tag);
				}
			}

			for (Map.Entry<String, Object> attributeEntry : attributes.entrySet()) {
				Object entryKey = attributeEntry.getKey();
				Object entryValue = attributeEntry.getValue();
				if (!(entryKey instanceof String)) {
					continue;
				}
				if (!(entryValue instanceof Map)) {
					continue;
				}
				String entryStringKey = (String)entryKey;
				Map<String, Object> entryMapValue = (Map<String, Object>)entryValue;
				String type = getTypedParameter(entryMapValue, "type", String.class);
				
				if ("s".equals(type)) {
					batchEventData.put(entryStringKey, getTypedParameter(entryMapValue, "value", String.class));
				} else if ("b".equals(type)) {
					batchEventData.put(entryStringKey, getTypedParameter(entryMapValue, "value", Boolean.class));
				} else if ("i".equals(type)) {
					batchEventData.put(entryStringKey, getTypedParameter(entryMapValue, "value", Number.class).longValue());
				} else if ("f".equals(type)) {
					batchEventData.put(entryStringKey, getTypedParameter(entryMapValue, "value", Number.class).doubleValue());
				} else {
					throw new BridgeException(INVALID_PARAMETER + " : Unknown event_data.attributes type");
				}
			}
		}
		
		Batch.User.trackEvent(name, label, batchEventData);
	}

	private static void trackLegacyEvent(Map<String, Object> parameters) throws BridgeException
	{
		String name = getTypedParameter(parameters, "name", String.class);

		String label = null;
		try
		{
			label = getTypedParameter(parameters, "label", String.class);
		}
		catch (BridgeException e)
		{
			// The parameter is optional, disregard the exception
		}

		Map data = null;
		try
		{
			data = getTypedParameter(parameters, "data", Map.class);
		}
		catch (BridgeException e)
		{
			// The parameter is optional, disregard the exception
		}

		JSONObject jsonData = null;

		if (data != null)
		{
			jsonData = new JSONObject(data);
		}

		Batch.User.trackEvent(name, label, jsonData);
	}

	private static void trackTransaction(Map<String, Object> parameters) throws BridgeException
	{
		double amount = getTypedParameter(parameters, "amount", Number.class).doubleValue();

		Map data = null;
		try
		{
			data = getTypedParameter(parameters, "data", Map.class);
		}
		catch (BridgeException e)
		{
			// The parameter is optional, disregard the exception
		}

		JSONObject jsonData = null;

		if (data != null)
		{
			jsonData = new JSONObject(data);
		}

		Batch.User.trackTransaction(amount, jsonData);
	}

	private static void trackLocation(Map<String, Object> parameters) throws BridgeException
	{
		double latitude = getTypedParameter(parameters, "latitude", Number.class).doubleValue();
		double longitude = getTypedParameter(parameters, "longitude", Number.class).doubleValue();

		Integer precision = null;
		try
		{
			precision = getTypedParameter(parameters, "precision", Integer.class);
		}
		catch (BridgeException e)
		{
			// The parameter is optional, disregard the exception
		}

		Number date = null;
		try
		{
			Number rawDate = getTypedParameter(parameters, "date", Number.class);
		}
		catch (BridgeException e)
		{
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

		Batch.User.trackLocation(location);
	}

	private static void showPendingMessage(Activity activity)
	{
		BatchMessage msg = Batch.Messaging.popPendingMessage();
		if (msg != null) {
			Batch.Messaging.show(activity, msg);
		}
	}

//endregion
}
