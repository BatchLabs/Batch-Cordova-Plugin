package com.batch.cordova.android.interop;

/**
 * Enum that wraps the supported action names.
 *
 * @author Arnaud Barisain-Monrose
 */
public enum Action
{
	SET_CONFIG("setConfig"),
	START("start"),
	STOP("stop"),
	DESTROY("destroy"),
	ON_NEW_INTENT("onNewIntent"),
    OPT_IN("optIn"),
    OPT_OUT("optOut"),
    OPT_OUT_AND_WIPE_DATA("optOutAndWipeData"),
    INBOX_FETCH("inbox.fetch"),
    INBOX_FETCH_FOR_USER_ID("inbox.fetchForUserIdentifier"),
    MESSAGING_SET_DO_NOT_DISTURB_ENABLED("messaging.setDoNotDisturbEnabled"),
    MESSAGING_SHOW_PENDING_MESSAGE("messaging.showPendingMessage"),
    PUSH_GET_LAST_KNOWN_TOKEN("push.getLastKnownPushToken"),
    PUSH_REGISTER("push.register"),
    PUSH_SET_GCM_SENDER_ID("push.setGCMSenderID"),
    PUSH_CLEAR_BADGE("push.clearBadge"),
    PUSH_DISMISS_NOTIFICATIONS("push.dismissNotifications"),
    PUSH_SET_IOSNOTIF_TYPES("push.setIOSNotifTypes"),
    PUSH_SET_ANDROIDNOTIF_TYPES("push.setAndroidNotifTypes"),
    PUSH_SET_IOSSHOW_FOREGROUND("push.setIOSShowForegroundNotifications"),
    PUSH_IOS_REFRESH_TOKEN("push.iOS.refreshToken"),
    PUSH_IOS_REQUEST_AUTHORIZATION("push.iOS.requestAuthorization"),
    PUSH_IOS_REQUEST_PROVISIONAL_AUTH("push.iOS.requestProvisionalAuthorization"),
	USER_EDIT("user.edit"),
	USER_TRACK_EVENT("user.track.event"),
    USER_TRACK_LEGACY_EVENT("user.track.legacy_event"),
	USER_TRACK_TRANSACTION("user.track.transaction"),
    USER_TRACK_LOCATION("user.track.location"),
	USER_DATA_DEBUG("user.data.debug"),
	USER_GET_INSTALLATION_ID("user.getInstallationID"),
    USER_GET_LANGUAGE("user.getLanguage"),
    USER_GET_REGION("user.getRegion"),
    USER_GET_IDENTIFIER("user.getIdentifier");

    /**
     * Action name, the one passed as a paremeter in {@link com.batch.android.interop.Bridge}
     */
    private String name;

    /**
     * Init an action with its string representation
     */
    private Action(String name)
    {
        this.name = name;
    }

    /**
     * Get the name associated with this action
     */
    public String getName()
    {
        return name;
    }

    /**
     * Create an Action from its string name.
     *
     * @throws IllegalArgumentException Thrown when the supplied name doesn't match any known action
     * @param actionName Action name
     * @return Action
     */
    public static Action fromName(String actionName) throws IllegalArgumentException
    {
        for (Action parameterValue : values())
        {
            if (parameterValue.getName().equalsIgnoreCase(actionName))
            {
                return parameterValue;
            }
        }

        throw new IllegalArgumentException("Unknown action.");
    }
}
