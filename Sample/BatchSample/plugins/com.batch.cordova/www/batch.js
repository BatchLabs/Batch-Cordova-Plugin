var BATCH_PLUGIN_NAME = "Batch";

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

var ACTION_USER_EDIT                             = "user.edit";
var ACTION_USER_TRACK_EVENT                      = "user.track.event";
var ACTION_USER_TRACK_TRANSACTION                = "user.track.transaction";
var ACTION_USER_DATA_DEBUG                       = "user.data.debug";
var ACTION_USER_GET_INSTALLATION_ID              = "user.getInstallationID";

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

var ACTION_INTERNAL_SETUP_CALLBACK          = "_setupCallback";

var ATTRIBUTE_KEY_REGEXP                         = /^[a-zA-Z0-9_]{1,30}$/;
var ATTRIBUTE_STRING_MAX_LENGTH                  = 64;

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
 * @version 1.5
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
     * @deprecated
     */
    userProfile: {
        /**
         * Gets the custom identifier that you've previously set (null if none set).
         * You will get the result in a callback you need to provide to this function
         * @param resultCallback Callback function. First and only argument is the custom identifier.
         * @deprecated Please use Batch.User
         */
        getCustomIdentifier: function(resultCallback) {
            sendToBridge(resultCallback, ACTION_GET_CUSTOM_USER_ID, null);
        },

        /**
         * Set a custom user identifier to Batch, you should use this method if you have your own login system.
         * Be careful: Do not use it if you don't know what you are doing, giving a bad custom user ID can result
         * in failure of targeted push notifications delivery or offer delivery and restore.
         * @param {string} customIdentifier Your custom identifier.
         * @deprecated Please use Batch.User
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
         * @deprecated Please use Batch.User
         */
        getLanguage: function(resultCallback) {
            sendToBridge(resultCallback, ACTION_GET_APP_LANGUAGE, null);
        },

        /**
         * Set the application language. Overrides Batch's automatically detected language.
         * Send "null" to let Batch autodetect it again.
         * @param {string} language Language code. 2 chars minimum.
         * @deprecated Please use Batch.User
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
         * @deprecated Please use Batch.User
         */
        getRegion: function(resultCallback) {
            sendToBridge(resultCallback, ACTION_GET_APP_REGION, null);
        },

        /**
         * Set the application region. Overrides Batch's automatically detected region.
         * Send "null" to let Batch autodetect it again.
         * @param {string} region Region code. 2 chars minimum.
         * @deprecated Please use Batch.User
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
         * Example : setAndroidNotificationTypes(batch.push.AndroidNotificationTypes.ALERT | batch.push.AndroidNotificationTypes.SOUND) 
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
         * Example : setiOSNotificationTypes(batch.push.iOSNotificationTypes.ALERT | batch.push.iOSNotificationTypes.SOUND) 
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
    },

    /**
     * Batch's User Module
     * @type {object}
     * @namespace
     */
    user: {
        /**
         * Get the unique installation ID, generated by Batch. Batch must be started to read it.
         * You will get the result in a callback you need to provide to this function.
         * @param {installationIDResultCallback} resultCallback Callback function. First and only argument is the Batch-generated installation ID. Might be null/undefined if Batch isn't started.
         */
        getInstallationID:function(resultCallback) {
            sendToBridge(resultCallback, ACTION_USER_GET_INSTALLATION_ID, null);
            return this;
        },
        /**
         * Get the user data editor. Don't forget to call save when you're done.
         * @return {BatchUserDataEditor} Batch user data editor
         */
        getEditor:function() {
            return new BatchUserDataEditor();
        },
        /**
         * Print the currently known attributes and tags for a user to the logs.
         */
        printDebugInformation:function() {
            sendToBridge(null, ACTION_USER_DATA_DEBUG, null);
            return this;
        },
        /**
         * Track an event. Batch must be started at some point, or events won't be sent to the server.
         * @param {string} name The event name. Must be a string.
         * @param {string} label The event label (optional). Must be a string.
         * @param {object} data The event data (optional). Must be an object.
         * @return {batch.user}
         */
        trackEvent:function(name, label, data) {
            if (ATTRIBUTE_KEY_REGEXP.test(event||"")) {
                writeBatchLog(false, "BatchUserDataEditor - Invalid event name. Please make sure that the name is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring event '" + name + "'");
                return this;
            }

            var parameters = {"name": name};

            if (label instanceof String || typeof label === "string") {
                if (label.length == 0 || label.length > ATTRIBUTE_STRING_MAX_LENGTH) {
                    writeBatchLog(false, "BatchUserDataEditor - Label can't be longer than " + ATTRIBUTE_STRING_MAX_LENGTH + " characters. Ignoring event '" + name + "'.");
                    return this;
                }
                parameters["label"] = label;
            } else if (label != null && typeof label !== "undefined") {
                writeBatchLog(false, "BatchUserDataEditor - If supplied, label argument must be a string. Ignoring event '" + name + "'.");
                return this;
            }

            if (typeof data === "object") {
                parameters["data"] = data;
            }

            sendToBridge(null, ACTION_USER_TRACK_EVENT, [parameters]);

            return this;
        },
        /**
         * Track a transaction. Batch must be started at some point, or events won't be sent to the server.
         * @param {number} amount Transaction's amount.
         * @param {object} data The transaction data (optional). Must be an object.
         * @return {batch.user}
         */
        trackTransaction:function(amount, data) {

            if (typeof amount === "undefined") {
                writeBatchLog(false, "BatchUserDataEditor - Amount must be a valid number. Ignoring transaction.");
                return this;
            }

            if (!(amount instanceof Number || typeof amount === "number") || isNaN(amount)) {
                writeBatchLog(false, "BatchUserDataEditor - Amount must be a valid number. Ignoring transaction.");
                return this;
            }

            var parameters = {"amount": amount};

            if (typeof data === "object") {
                parameters["data"] = data;
            }

            sendToBridge(null, ACTION_USER_TRACK_TRANSACTION, [parameters]);

            return this;
        }
    }
};

// BatchUserDataEditor "class"

/**
 * Batch User Data Editor Operation actions
 * @enum
 * @readonly
 */
BatchUserDataOperation = {
    SET_LANGUAGE: "SET_LANGUAGE",
    SET_REGION: "SET_REGION",
    SET_IDENTIFIER: "SET_IDENTIFIER",
    SET_ATTRIBUTE: "SET_ATTRIBUTE",
    REMOVE_ATTRIBUTE: "REMOVE_ATTRIBUTE",
    CLEAR_ATTRIBUTES: "CLEAR_ATTRIBUTES",
    ADD_TAG: "ADD_TAG",
    REMOVE_TAG: "REMOVE_TAG",
    CLEAR_TAGS: "CLEAR_TAGS",
    CLEAR_TAG_COLLECTION: "CLEAR_TAG_COLLECTION"
};

/**
 * Private constructor. Please get your instance using batch.user.getEditor()
 * @constructor
 */
BatchUserDataEditor = function() {
    this._operationQueue = [];
};

/**
 * Add an operation to the queue.
 * Private method.
 * @param operation {BatchUserDataOperation} operation action to enqueue
 * @param arguments {object}
 * @private
 */
BatchUserDataEditor.prototype._enqueueOperation = function(operation, arguments) {
    var operationObject = {"operation": operation};

    if (typeof arguments !== "undefined") {
        for (var arg in arguments) {
            if (!arguments.hasOwnProperty(arg)) {
                continue;
            }
            operationObject[arg] = arguments[arg];
        }
    }

    this._operationQueue.push(operationObject);
};

/**
 * Set the application language. Overrides Batch's automatically detected language.
 * Send "null" to let Batch autodetect it again.
 * @param {string} language Language code. 2 chars minimum.
 */
BatchUserDataEditor.prototype.setLanguage = function(language) {
    if (typeof language !== "string" && language !== null) {
        writeBatchLog(false, "BatchUserDataEditor - Language must be a string or null");
        return this;
    }

    this._enqueueOperation(BatchUserDataOperation.SET_LANGUAGE, {"value": language});

    return this;
};

/**
 * Set the application region. Overrides Batch's automatically detected region.
 * Send "null" to let Batch autodetect it again.
 * @param {string} region Region code. 2 chars minimum.
 */
BatchUserDataEditor.prototype.setRegion = function(region) {
    if (typeof region !== "string" && region !== null) {
        writeBatchLog(false, "BatchUserDataEditor - Region must be a string or null");
        return this;
    }

    this._enqueueOperation(BatchUserDataOperation.SET_REGION, {"value": region});

    return this;
};

/**
 * Set a custom user identifier to Batch, you should use this method if you have your own login system.
 * Be careful: Do not use it if you don't know what you are doing, giving a bad custom user ID can result
 * in failure of targeted push notifications delivery or offer delivery and restore.
 * @param {string} identifier Your custom identifier.
 */
BatchUserDataEditor.prototype.setIdentifier = function(identifier) {
    if (typeof identifier !== "string" && identifier !== null) {
        writeBatchLog(false, "BatchUserDataEditor - Identifier must be a string or null");
        return this;
    }

    this._enqueueOperation(BatchUserDataOperation.SET_IDENTIFIER, {"value": identifier});

    return this;
};

/**
 * Set an attribute for a key
 * @param key Attribute key. Cannot be null, empty or undefined. It should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
 * @param value Attribute value. Accepted types are numbers, booleans, Date objects and strings. Strings must not be empty or longer than 64 characters.
 * @return {BatchUserDataEditor}
 */
BatchUserDataEditor.prototype.setAttribute = function(key, value) {
    if (!ATTRIBUTE_KEY_REGEXP.test(key||"")) {
        writeBatchLog(false, "BatchUserDataEditor - Invalid key. Please make sure that the key is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring attribute '" + key + "'");
        return this;
    }

    if (typeof key === "undefined" || key === null) {
        writeBatchLog(false, "BatchUserDataEditor - Value argument cannot be undefined or null");
        return this;
    }

    if (typeof value === "undefined") {
        writeBatchLog(false, "BatchUserDataEditor - A value is required");
        return this;
    }

    var operationData = {"value": value, "key": key};

    // Lets guess the type
    if (value instanceof Date) {
        // It's a date, yay
        operationData["value"] = value.getTime();
        operationData["type"] = "date";
    } else if (value instanceof Number || typeof value === "number") {
        if (isNaN(value)) {
            writeBatchLog(false, "BatchUserDataEditor - Value cannot be NaN");
            return this;
        }
        operationData["type"] = (value % 1 === 0) ? "integer" : "float";
    } else if (value instanceof String || typeof value === "string") {
        if (value.length == 0 || value.length > ATTRIBUTE_STRING_MAX_LENGTH) {
            writeBatchLog(false, "BatchUserDataEditor - String attributes can't be empty or longer than " + ATTRIBUTE_STRING_MAX_LENGTH +" characters. Ignoring attribute '" + key + "'.");
            return this;
        }
        operationData["type"] = "string";
    } else if (value instanceof Boolean || typeof value === "boolean") {
        operationData["type"] = "boolean";
    } else {
        writeBatchLog(false, "BatchUserDataEditor - Value argument must be one of these types: number, string, boolean, date");
        return this;
    }

    this._enqueueOperation(BatchUserDataOperation.SET_ATTRIBUTE, operationData);

    return this;
};

/**
 * Remove an attribute
 * @param {string} key The key of the attribute to remove
 * @return {BatchUserDataEditor}
 */
BatchUserDataEditor.prototype.removeAttribute = function(key) {
    if (!ATTRIBUTE_KEY_REGEXP.test(key||"")) {
        writeBatchLog(false, "BatchUserDataEditor - Invalid key. Please make sure that the key is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring attribute '" + key + "'");
        return this;
    }

    this._enqueueOperation(BatchUserDataOperation.REMOVE_ATTRIBUTE, {"key": key});

    return this;
};

/**
 * Remove all attributes
 * @return {BatchUserDataEditor}
 */
BatchUserDataEditor.prototype.clearAttributes = function() {
    this._enqueueOperation(BatchUserDataOperation.CLEAR_ATTRIBUTES, {});

    return this;
};

/**
 * Add a tag to a collection. If the collection doesn't exist it will be created.
 * @param {string} collection The tag collection name. Cannot be null or undefined. Must be a string of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
 * @param {string} tag The tag to add. Cannot be null, undefined or empty. Must be a string no longer than 64 characters.
 * @return {BatchUserDataEditor}
 */
BatchUserDataEditor.prototype.addTag = function(collection, tag) {
    if (typeof collection !== "string" && !(collection instanceof String)) {
        writeBatchLog(false, "BatchUserDataEditor - Collection argument must be a string");
        return this;
    }

    if (!ATTRIBUTE_KEY_REGEXP.test(collection||"")) {
        writeBatchLog(false, "BatchUserDataEditor - Invalid collection. Please make sure that the collection is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring collection '" + collection + "'");
        return this;
    }

    if (typeof tag === "undefined") {
        writeBatchLog(false, "BatchUserDataEditor - A tag is required");
        return this;
    }

    if (tag instanceof String || typeof tag === "string") {
        if (tag.length == 0 || tag.length > ATTRIBUTE_STRING_MAX_LENGTH) {
            writeBatchLog(false, "BatchUserDataEditor - Tags can't be empty or longer than " + ATTRIBUTE_STRING_MAX_LENGTH + " characters. Ignoring tag '" + tag + "'.");
            return this;
        }
    } else {
        writeBatchLog(false, "BatchUserDataEditor - Tag argument must be a string");
        return this;
    }

    this._enqueueOperation(BatchUserDataOperation.ADD_TAG, {"collection": collection, "tag": tag});

    return this;
};

/**
 * Remove a tag
 * @param {string} collection The tag collection name. Cannot be null or undefined. Must be a string of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
 * @param {string} tag The tag name. Cannot be null, empty or undefined. If the tag doesn't exist, this method will do nothing.
 * @return {BatchUserDataEditor}
 */
BatchUserDataEditor.prototype.removeTag = function(collection, tag) {
    if (typeof collection !== "string" && !(collection instanceof String)) {
        writeBatchLog(false, "BatchUserDataEditor - Collection argument must be a string");
        return this;
    }

    if (!ATTRIBUTE_KEY_REGEXP.test(collection||"")) {
        writeBatchLog(false, "BatchUserDataEditor - Invalid collection. Please make sure that the collection is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring collection '" + collection + "'");
        return this;
    }

    if (typeof tag === "undefined") {
        writeBatchLog(false, "BatchUserDataEditor - A tag is required");
        return this;x
    }

    if (tag instanceof String || typeof tag === "string") {
        if (tag.length == 0 || tag.length > ATTRIBUTE_STRING_MAX_LENGTH) {
            writeBatchLog(false, "BatchUserDataEditor - Tags can't be empty or longer than " + ATTRIBUTE_STRING_MAX_LENGTH + " characters. Ignoring tag '" + tag + "'.");
            return this;
        }
    } else {
        writeBatchLog(false, "BatchUserDataEditor - Tag argument must be a string");
    }

    this._enqueueOperation(BatchUserDataOperation.REMOVE_TAG, {"collection": collection, "tag": tag});

    return this;
};

/**
 * Removes all tags
 * @return {BatchUserDataEditor}
 */
BatchUserDataEditor.prototype.clearTags = function() {
    this._enqueueOperation(BatchUserDataOperation.CLEAR_TAGS, {});

    return this;
};

/**
 * Removes all tags from a collection
 * @param {string} collection The tag collection name. Cannot be null or undefined. Must be a string of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
 * @return {BatchUserDataEditor}
 */
BatchUserDataEditor.prototype.clearTagCollection = function(collection) {
    if (typeof collection !== "string" && !(collection instanceof String)) {
        writeBatchLog(false, "BatchUserDataEditor - Collection argument must be a string");
        return this;
    }

    if (!ATTRIBUTE_KEY_REGEXP.test(collection||"")) {
        writeBatchLog(false, "BatchUserDataEditor - Invalid collection. Please make sure that the collection is made of letters, underscores and numbers only (a-zA-Z0-9_). It also can't be longer than 30 characters. Ignoring collection '" + collection + "'");
        return this;
    }

    this._enqueueOperation(BatchUserDataOperation.CLEAR_TAG_COLLECTION, {"collection": collection});

    return this;
};

/**
 * Save all of the pending changes made in that editor. This action cannot be undone.
 * @return {BatchUserDataEditor}
 */
BatchUserDataEditor.prototype.save = function() {
    sendToBridge(null, ACTION_USER_EDIT, [{
        'operations': this._operationQueue
    }]);

    this._operationQueue = [];

    return this;
};

// Generate a BatchUserDataEditor stub for unsupported platforms

BatchUserDataEditorStub = function() {};
for (var editorPrototypeFunction in BatchUserDataEditor.prototype) {
    //noinspection JSUnfilteredForInLoop
    BatchUserDataEditorStub.prototype[editorPrototypeFunction] = function() { return this; };
}

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
        },
        user: {
            getInstallationID:function () {return this;},
            getEditor:function () {return new BatchUserDataEditorStub();},
            trackEvent:function () {return this;},
            trackTransaction:function () {return this;},
        }
    }
}

/**
 * Callback for Batch User's Installation ID getter
 * @callback installationIDResultCallback
 * @param {?string} result Variable value
 */

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