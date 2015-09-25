cordova.define("com.batch.cordova.batch", function(require, exports, module) { var BATCH_PLUGIN_NAME = "Batch";

var ACTION_SET_CONFIG                            = "setConfig";
var ACTION_START                                 = "start";
var ACTION_UNLOCK_SETUP                          = "unlock.setup";
var ACTION_REDEEM_URL                            = "redeemURL";
var ACTION_REDEEM_CODE                           = "redeemCode";
var ACTION_RESTORE                               = "restore";
var ACTION_IS_DEV_MODE                           = "isDevMode";
var ACTION_GET_CUSTOM_USER_ID                    = "getCustomID";
var ACTION_SET_CUSTOM_USER_ID                    = "setCustomID";
var ACTION_GET_APP_LANGUAGE                      = "getAppLanguage";
var ACTION_SET_APP_LANGUAGE                      = "setAppLanguage";
var ACTION_GET_APP_REGION                        = "getAppRegion";
var ACTION_SET_APP_REGION                        = "setAppRegion";
var ACTION_PUSH_SETUP                            = "push.setup";
var ACTION_PUSH_GET_LAST_KNOWN_TOKEN             = "push.getLastKnownPushToken";
var ACTION_SET_GCM_SENDER_ID                     = "push.setGCMSenderID";
var ACTION_SET_IOSNOTIF_TYPES                    = "push.setIOSNotifTypes";
var ACTION_SET_ANDROIDNOTIF_TYPES                = "push.setAndroidNotifTypes";
var ACTION_REGISTER_NOTIFS                       = "push.register";
var ACTION_DISMISS_NOTIFS                        = "push.dismissNotifications";
var ACTION_CLEAR_BADGE                           = "push.clearBadge";

var CALLBACK_LOG                                 = "_log";
var CALLBACK_EVAL                                = "_eval";
var CALLBACK_DISPATCH_PUSH                       = "_dispatchPush";
var CALLBACK_ON_FAILURE                          = "onBridgeFailure";
var CALLBACK_ON_REDEEM_AUTOMATIC_OFFER           = "onRedeemAutomaticOffer";
var CALLBACK_ON_REDEEM_URL_SUCCESS               = "onRedeemURLSuccess";
var CALLBACK_ON_REDEEM_URL_FAILED                = "onRedeemURLFailed";
var CALLBACK_ON_REDEEM_URL_CODEFOUND             = "onRedeemURLCodeFound";
var CALLBACK_ON_REDEEM_CODE_SUCCESS              = "onRedeemCodeSuccess";
var CALLBACK_ON_REDEEM_CODE_FAILED               = "onRedeemCodeFailed";
var CALLBACK_ON_RESTORE_SUCCESS                  = "onRestoreSuccess";
var CALLBACK_ON_RESTORE_FAILED                   = "onRestoreFailed";
var CALLBACK_ON_AD_INTERSTITIAL_READY            = "adListener_onInterstitialReady";
var CALLBACK_ON_AD_FAILED_TO_LOAD_INTERSTITIAL   = "adListener_onFailedToLoadInterstitial";

var ACTION_INTERNAL_SETUP_CALLBACK          = "_setupCallback";

var channel = require('cordova/channel');

var DEV_MODE = false;

function isPlatformType(type) {
    return cordova.platformId.toLowerCase() === type;
}

function writeBatchLog(debug, message) {
    var args = ["[Batch]"].concat(Array.prototype.slice.call(arguments, 1));
    if (DEV_MODE === true && debug === true) {
        console.debug.apply(console, args);
    } else if (debug === false) {
        console.log.apply(console, args);
    }
}

function sendToBridge(callback, method, args) {
    // The Bridge never fails as far as Cordova is concerned, but the callback can have a negative response
    // It will need to be handled on a per-case basis
	cordova.exec(callback, null, BATCH_PLUGIN_NAME, "BA_" + method, args != null ? args : [{}]);
}

function handleCallback(callbackData) {
    writeBatchLog(true, "Got callback from Batch", callbackData);

    switch (callbackData.action) {
        case CALLBACK_DISPATCH_PUSH:
            var pushPayload = callbackData.payload;
            for (var key in pushPayload) {
                var value = pushPayload[key];
                if (pushPayload.hasOwnProperty(key)) {
                    if (typeof value === "string") {
                        try {
                            pushPayload[key] = JSON.parse(value);
                            // If the result is not an object (and an array is an object), rollback
                            if (typeof pushPayload[key] !== "object") {
                                pushPayload[key] = value;
                            }
                        } catch (err) {
                            // Decoding JSON can fail on strings that aren't meant to be objects,
                            // so silently ignore this
                        }
                    } else if (typeof value === "number" || typeof value === "boolean") {
                        pushPayload[key] = String(value);
                    }
                }
            }
            cordova.fireDocumentEvent('batchPushReceived', {"payload": pushPayload});
            break;
        case CALLBACK_LOG:
            // Don't use writeBatchLog on purpose
            console.log(callbackData.message);
            break;
        case CALLBACK_EVAL:
            // This case is because Cordova Android's evaljs is deprecated.
            // Using a callback to eval is their recommended solution
            eval(callbackData.command);
            break;
        case CALLBACK_ON_FAILURE:
            writeBatchLog(false, "Internal Bridge error", callbackData.result);
            break;
        case CALLBACK_ON_REDEEM_AUTOMATIC_OFFER:
            fireBatchEvent("redeemAutomaticOffer", callbackData.result);
            break;
        case CALLBACK_ON_REDEEM_URL_SUCCESS:
            fireBatchEvent("redeemURLSuccess", callbackData.result);
            break;
        case CALLBACK_ON_REDEEM_URL_FAILED:
            fireBatchEvent("redeemURLFailed", callbackData.result);
            break;
        case CALLBACK_ON_REDEEM_URL_CODEFOUND:
            fireBatchEvent("redeemURLCodeFound", callbackData.result);
            break;
        case CALLBACK_ON_REDEEM_CODE_SUCCESS:
            fireBatchEvent("redeemCodeSuccess", callbackData.result);
            break;
        case CALLBACK_ON_REDEEM_CODE_FAILED:
            fireBatchEvent("redeemCodeFailed", callbackData.result);
            break;
        case CALLBACK_ON_RESTORE_SUCCESS:
            fireBatchEvent("restoreSuccess", callbackData.result);
            break;
        case CALLBACK_ON_RESTORE_FAILED:
            fireBatchEvent("restoreFailed", callbackData.result);
            break;
        case CALLBACK_ON_AD_INTERSTITIAL_READY:
            fireBatchEvent("interstitialReady", callbackData.result);
            break;
        case CALLBACK_ON_AD_FAILED_TO_LOAD_INTERSTITIAL:
            fireBatchEvent("failedToLoadInterstitial", callbackData.result);
            break;
    }
}

function fireBatchEvent(action, parameters) {
    writeBatchLog(true, "Calling back developer implementation - " + action, parameters);
    var listeners = batch._eventListeners[action] || [];
    listeners.forEach(function(listener) {
        listener(action, parameters);
    });
}

/**
 * Batch Cordova Module
 * @version 1.4
 * @exports batch
 */
var batch = {

    /**
     * Registered event listeners
     * For private use only.
     * @private
     */
    _eventListeners: {},

    /**
     * Registered event listeners
     * For private use only.
     * @private
     */
    _config: null,

	/**
	 * Setup Batch's callback so that the plugin gets a callbackId to send events to the app using the SDK.
	 * For private use only.
	 * @private
	 */
	_setupCallback:function() {
        // Don't call sendToBridge because we don't want to have the BA_ prefix
        cordova.exec(handleCallback, null, BATCH_PLUGIN_NAME, ACTION_INTERNAL_SETUP_CALLBACK, [{}]);
	},

    /**
     * Registers a listener for a given event. Multiple listeners can be set on an event.
     *
     * @param {String} event The event name to listen to.
     * @param {eventCallback} listener Function with two arguments : event name and parameters.
     * @return {batch} Returns itself so you can chain calls
     */
    on:function(event, listener) {
        if (typeof event !== "string") {
            writeBatchLog(false, "Event name must be a string if supplied");
            return this;
        }

        // Make sure this exists
        this._eventListeners[event] = this._eventListeners[event] || [];

        this._eventListeners[event].push(listener);

        return this;
    },

    /**
     * Unregisters all listeners for a given event.
     *
     * @param {?String} event The event name you wish to remove the listener for. If nothing is passed, all events are removed.
     * @return {batch} Returns itself so you can chain calls
     */
    off:function(event) {
        if (typeof event === "undefined") {
            this._eventListeners = {};
            return this;
        }
        if (typeof event !== "string") {
            writeBatchLog(false, "Event name must be a string if supplied");
            return this;
        }
        this._eventListeners[event] = [];
        return this;
    },

	/**
	 * Set Batch's config. you're required to call this before start
	 *
     * The config object is a literal that has 4 variables
     *  {?string} androidAPIKey Your Android API Key (default null)
     *  {?string} iOSAPIKey Your iOS API Key (default null)
     *  {boolean} canUseIDFA Whether Batch can use the IDFA/Advertising ID or not (default: true)
     *  {boolean} canUseAndroidID Whether Batch can use the Android ID or not (default: true)
     *
     * If you don't want to specify one of the configuration options, simply omit the key.
     *
     * @param {Object} config Your Batch config
     * @return {batch} Returns itself so you can chain calls
	 */
	setConfig:function(config) {
        if (typeof config !== "object") {
            writeBatchLog(false, "Config must be an object.");
            return this;
        }

        // Use a base config
        var baseConfig = {
            "androidAPIKey":null,
            "iOSAPIKey":null,
            "canUseIDFA":true,
            "canUseAndroidID":true
        };

        for (var key in config) {
            if (!baseConfig.hasOwnProperty(key)) {
                writeBatchLog(false, "Unknown key found in the config object : " + key);
                continue;
            }
            // TODO : Maybe add better checks
            baseConfig[key] = config[key];
        }

        this._config = baseConfig;

        return this;
	},

    /**
     * Start Batch. You need to call setConfig beforehand.
     */
	start:function() {
        if (this._config === null) {
            writeBatchLog(false, "You must call setConfig before calling start.");
            return this;
        }

        var apiKey = isPlatformType("android") ? this._config.androidAPIKey : this._config.iOSAPIKey;
        if (typeof apiKey !== "string") {
            writeBatchLog(false, "No API key was specified for the current platform.");
            return this;
        }

        // Set the config first
        sendToBridge(null, ACTION_SET_CONFIG, [{
            'APIKey':apiKey,
            'useIDFA':this._config.canUseIDFA === true, // Handles "undefined" or "null"
            'useAndroidID':this._config.useAndroidID === true
        }]);

		sendToBridge(null, ACTION_START, null);
        return this;
	},

    /**
     * Batch's User profile data
     * @type {object}
     * @namespace
     */
    userProfile: {
        /**
         * Gets the custom identifier that you've previously set (null if none set).
         * You will get the result in a callback you need to provide to this function
         * @param resultCallback Callback function. First and only argument is the custom identifier.
         */
        getCustomIdentifier: function(resultCallback) {
            sendToBridge(resultCallback, ACTION_GET_CUSTOM_USER_ID, null);
        },

        /**
         * Set a custom user identifier to Batch, you should use this method if you have your own login system.
         * Be careful: Do not use it if you don't know what you are doing, giving a bad custom user ID can result
         * in failure of targeted push notifications delivery or offer delivery and restore.
         * @param {userProfileResultCallback} customIdentifier Your custom identifier.
         */
        setCustomIdentifier: function(customIdentifier) {
            if (customIdentifier !== null && typeof customIdentifier !== "string") {
                writeBatchLog(false, "Custom identifier must be a string or null");
                return;
            }
            sendToBridge(null, ACTION_SET_CUSTOM_USER_ID, [{"customID": customIdentifier}]);
        },

        /**
         * Gets the application language. If you didn't override it manually, it is the device's language.
         * You will get the result in a callback you need to provide to this function.
         * @param {userProfileResultCallback} resultCallback Callback function. First and only argument is the language code.
         */
        getLanguage: function(resultCallback) {
            sendToBridge(resultCallback, ACTION_GET_APP_LANGUAGE, null);
        },

        /**
         * Set the application language. Overrides Batch's automatically detected language.
         * Send "null" to let Batch autodetect it again.
         * @param {string} language Language code. 2 chars minimum.
         */
        setLanguage: function(language) {
            if (language !== null && typeof language !== "string") {
                writeBatchLog(false, "Language must be a string or null");
                return;
            }
            sendToBridge(null, ACTION_SET_APP_LANGUAGE, [{"language": language}]);
        },

        /**
         * Gets the application region. If you didn't override it manually, it is the device's region.
         * You will get the result in a callback you need to provide to this function.
         * @param {userProfileResultCallback} resultCallback Callback function. First and only argument is the region code.
         */
        getRegion: function(resultCallback) {
            sendToBridge(resultCallback, ACTION_GET_APP_REGION, null);
        },

        /**
         * Set the application region. Overrides Batch's automatically detected region.
         * Send "null" to let Batch autodetect it again.
         * @param {string} region Region code. 2 chars minimum.
         */
        setRegion: function(region) {
            if (region !== null && typeof region !== "string") {
                writeBatchLog(false, "Region must be a string or null");
                return;
            }
            sendToBridge(null, ACTION_SET_APP_REGION, [{"region": region}]);
        }
    },

    /**
     * Batch's Push Module
     * @type {object}
     * @namespace
     */
	push: {

        /**
         * Android Notification Types enum.
         * To be used with batch.push.setAndroidNotificationTypes
         */
        AndroidNotificationTypes: {
            NONE: 0,
            SOUND: 1 << 0,
            VIBRATE: 1 << 1,
            LIGHTS: 1 << 2,
            ALERT: 1 << 3
        },

        /**
         * iOS Notification Types enum.
         * To be used with batch.push.setAndroidNotificationTypes
         */
        iOSNotificationTypes: {
            NONE: 0,
            BADGE: 1 << 0,
            SOUND: 1 << 1,
            ALERT: 1 << 2
        },

        /**
         * Setup Batch Push. You're required to call this method on every application start to ensure that all
         * push features work.
         * @return {batch.push} Returns itself so you can chain calls
         */
        setup:function() {
            sendToBridge(null, ACTION_PUSH_SETUP, null);
            return this;
        },

        /**
         * Sets the GCM Sender ID. Required to make the push work on Android.
         * @param {string} senderID The GCM sender ID
         * @return {batch.push}
         */
		setGCMSenderID:function(senderID) {
			sendToBridge(null, ACTION_SET_GCM_SENDER_ID, [{'senderID':senderID}]);
            return this;
		},

        /**
         * Ask iOS users if they want to accept push notifications. Required to be able to push users. No effect on Android.
         * @return {batch.push}
         */
		registerForRemoteNotifications:function() {
            sendToBridge(null, ACTION_REGISTER_NOTIFS, null);
            return this;
		},

        /**
         * Change the used remote notification types on Android. (Ex: sound, vibrate, alert)
         * Example : setAndroidNotificationTypes(batch.push.AndroidNotificationTypes.ALERT | batch.push.AndroidNotificationTypes.ALERT) 
         * @param {batch.push.AndroidNotificationTypes} notifTypes Any combined value of the AndroidNotificationTypes enum.
         * @return {batch.push}
         */
        setAndroidNotificationTypes:function(notifTypes) {
            if (typeof notifTypes !== "number") {
                writeBatchLog(false, "notifTypes must be a number (of the AndroidNotificationTypes enum)");
                return this;
            }
            sendToBridge(null, ACTION_SET_ANDROIDNOTIF_TYPES, [{'notifTypes':notifTypes}]);
            return this;
        },

        /**
         * Change the used remote notification types on iOS. (Ex: sound, vibrate, alert)
         * Example : setiOSNotificationTypes(batch.push.iOSNotificationTypes.ALERT | batch.push.iOSNotificationTypes.ALERT) 
         * @param notifTypes
         * @return {batch.push}
         */
        setiOSNotificationTypes:function(notifTypes) {
            if (typeof notifTypes !== "number") {
                writeBatchLog(false, "notifTypes must be a number (of the iOSNotificationTypes enum)");
                return this;
            }
            sendToBridge(null, ACTION_SET_IOSNOTIF_TYPES, [{'notifTypes':notifTypes}]);
            return this;
        },

        /**
         * Clear the app badge on iOS. No effect on Android.
         * @return {batch.push}
         */
        clearBadge:function() {
            sendToBridge(null, ACTION_CLEAR_BADGE, null);
            return this;
        },

        /**
         * Dismiss the app's shown notifications on iOS. Should be called on startup. No effect on Android.
         * @return {batch.push}
         */
        dismissNotifications:function() {
            sendToBridge(null, ACTION_DISMISS_NOTIFS, null);
            return this;
        },

        /**
         * Gets the last known push token.
         * Batch MUST be started in order to use this method.
         * You will get the result in a callback you need to provide to this function.
         *
         * The returned token might be outdated and invalid if this method is called
         * too early in your application lifecycle.
         *
         * On iOS, your application should still register for remote notifications
         * once per launch, in order to keep this value valid.
         *
         * @param {pushTokenResultCallback} resultCallback Callback function. First and only argument is the last known push token (can be null or empty).
         */
        getLastKnownPushToken: function(resultCallback) {
            sendToBridge(resultCallback, ACTION_PUSH_GET_LAST_KNOWN_TOKEN, null);
        }
	},

    /**
     * Batch's Unlock Module
     * @type {object}
     * @namespace
     */
    unlock: {
        /**
         * Setup Batch Unlock. Required before any Batch Unlock call and for automatic redeems to work.
         * @return {batch.unlock}
         */
        setup:function() {
            sendToBridge(null, ACTION_UNLOCK_SETUP, null);
            return this;
        },

        /**
         * Redeem an offer using a code.
         * @param {string} code Code to redeem.
         * @return {batch.unlock}
         */
        redeemCode:function(code) {
            if (typeof code !== "string") {
                writeBatchLog(false, "The code to redeem must be a string.");
                return this;
            }
            sendToBridge(null, ACTION_REDEEM_CODE, [{"code": code}]);
            return this;
        },

        /**
         * Restore redeemed features.
         * @param {string} code Code to redeem.
         * @return {batch.unlock}
         */
        restore:function() {
            sendToBridge(null, ACTION_RESTORE, null);
            return this;
        }
    }
};

// Freeze the enums
if (typeof Object.freeze === "function") {
    Object.freeze(batch.push.AndroidNotificationTypes);
    Object.freeze(batch.push.iOSNotificationTypes);
}

// Setup the callback ASAP
channel.onCordovaReady.subscribe(function() {
    batch._setupCallback();
});


if (isPlatformType("android") || isPlatformType("ios")) {
    module.exports = batch;
} else {
    writeBatchLog(false, "Batch did not load since the current platform is unsupported");
    module.exports = {
        _setupCallback:function () {},
        on:function () {return this;},
        off:function () {return this;},
        setConfig:function () {return this;},
        start:function () {return this;},
        userProfile: {
            getCustomIdentifier:function() {},
            setCustomIdentifier:function() {},
            getLanguage:function() {},
            setLanguage:function() {},
            getRegion:function() {},
            setRegion:function() {}
        },
        push: {
            AndroidNotificationTypes: batch.push.AndroidNotificationTypes,
            iOSNotificationTypes: batch.push.iOSNotificationTypes,
            setup:function () {return this;},
            setGCMSenderID:function () {return this;},
            registerForRemoteNotifications:function () {return this;},
            setAndroidNotificationTypes:function () {return this;},
            setiOSNotificationTypes:function () {return this;},
            clearBadge:function () {return this;},
            dismissNotifications:function () {return this;},
            getLastKnownPushToken:function () {return this;}
        },
        unlock: {
            setup:function () {return this;},
            redeemCode:function () {return this;},
            restore:function () {return this;}
        }
    }
}

/**
 * Callback for Batch User Profile getters
 * @callback userProfileResultCallback
 * @param {?string} result Variable value
 */

/**
 * Callback for Batch events
 * @callback eventCallback
 * @param {string} name Event name
 * @param {?object} parameters Event parameters
 */

/**
 * Callback for Batch Push Token getter
 * @callback pushTokenResultCallback
 * @param {?string} result Last known token
 */
});
