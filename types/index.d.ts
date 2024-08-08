/**
 * Batch SDK type definition file.
 * Can be imported using `import type {} from '@batch.com/cordova-plugin';`
 */

export declare namespace BatchSDK {
    /**
     * Batch Configuration object
     */
    interface Config {
        /**
         * Your Android API Key
         */
        androidAPIKey?: string | null;

        /**
         * Your iOS API Key
         */
        iOSAPIKey?: string | null;

        /**
         * Sets whether the SDK can use the advertising identifier or not (default: true)
         *
         * The advertising identifier is also called "IDFA" on iOS.
         */
        canUseAdvertisingIdentifier?: boolean;
    }

    type BatchEventCallback = (
        eventName: string,
        parameters: { [key: string]: unknown }
    ) => void;

    /**
     * Represents a locations, using lat/lng coordinates
     */
    interface Location {
        /**
         * Latitude
         */
        latitude: number;

        /**
         * Longitude
         */
        longitude: number;

        /**
         * Date of the tracked location
         */
        date?: Date;

        /**
         * Precision radius in meters
         */
        precision?: number;
    }

    /**
     * Object holding the configuration parameters for the automatic data collect.
     */
    export interface DataCollectionConfig {
        /**
         * Whether Batch can send the device brand information. (Android only)
         * @defaultValue false
         */
        deviceBrand?: boolean;
        /**
         * Whether Batch can send the device model information.
         * @defaultValue false
         */
        deviceModel?: boolean;
        /**
         * Whether Batch can resolve the GeoIP on server side.
         * @defaultValue false
         */
        geoIP?: boolean;
    }

    /**
     * Batch Cordova Module
     * @version 1.11.0
     * @exports batch
     */
    interface Batch {
        /**
         * Registers a listener for a given event. Multiple listeners can be set on an event.
         *
         * @param event The event name to listen to.
         * @param listener Function with two arguments : event name and parameters, called when an event occurs
         */
        on(event: string, listener: BatchEventCallback): void;

        /**
         * Unregisters all listeners for a given event, or all events.
         *
         * @param event The event name you wish to remove the listener for. If nothing is passed, all events are removed.
         */
        off(event?: string): void;

        /**
         * Set Batch's config. You're required to call this before start.
         *
         * If you don't want to specify one of the configuration options, simply omit the key.
         *
         * @param config The config to set
         */
        setConfig(config: Config): void;

        /**
         * Start Batch. You need to call setConfig beforehand.
         */
        start(): void;

        /**
         * Opt In to Batch SDK Usage.
         *
         * This method will be taken into account on next full application start (full process restart)
         *
         * Only useful if you called batch.optOut() or batch.optOutAndWipeData() or opted out by default in the manifest
         *
         * Some features might not be disabled until the next app start if you call this late into the application's life. It is strongly
         * advised to restart the application (or at least the current activity) after opting in.
         */
        optIn(): void;

        /**
         * Opt Out from Batch SDK Usage
         *
         * Note that calling the SDK when opted out is discouraged: Some modules might behave unexpectedly
         * when the SDK is opted-out from.
         *
         * Opting out will:
         * - Prevent batch.start()
         * - Disable any network capability from the SDK
         * - Disable all In-App campaigns
         * - Make the Inbox module return an error immediatly when used
         * - Make the SDK reject any editor calls
         * - Make the SDK reject calls to batch.user.trackEvent(), batch.user.trackTransaction(), batch.user.trackLocation() and any related methods
         *
         * Even if you opt in afterwards, data that has been generated while opted out WILL be lost.
         *
         * If you're also looking at deleting user data, please use batch.optOutAndWipeData()
         *
         * Note that calling this method will stop Batch.
         * Your app should be prepared to handle these cases.
         * Some features might not be disabled until the next app start.
         */
        optOut(): void;

        /**
         * Opt Out from Batch SDK Usage
         *
         * Same as batch.optOut(Context) but also wipes data.
         *
         * Note that calling this method will stop Batch.
         * Your app should be prepared to handle these cases.
         */
        optOutAndWipeData(): void;

        /**
         * Checks whether Batch has been opted out from or not.
         *
         * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating whether Batch has been
         * opted out from or not.
         */
        isOptedOut(): Promise<boolean>;

        /**
         * Control whether Batch should enable the Find My Installation feature (default = true)
         *
         * If enabled Batch will copy the current installation id in the clipboard when the application
         * is foregrounded 5 times within 12 seconds.
         * @param enabled Whether the feature is enabled or not.
         */
        setFindMyInstallationEnabled(enabled: boolean): void;

        /**
         * Update the SDK Automatic Data Collection.
         *
         * @param {DataCollectionConfig} dataCollection A configuration object to fine-tune the data you authorize to be tracked by Batch.
         * @see {@link DataCollectionConfig} for more info.
         * @example
         * Here's an example:
         * ```
         * batch.updateAutomaticDataCollection({
         *    geoIP: false, // Deny Batch from resolving the user's region from the ip address.
         *    deviceModel: true // Authorize Batch to use the user's device model information.
         * });
         * ```
         * @remarks Batch will persist the changes, so you can call this method at any time according to user consent.
         */
        updateAutomaticDataCollection(dataCollection: DataCollectionConfig): void ;

        /**
         * Push module
         */
        push: PushModule;

        /**
         * User module
         */
        profile: ProfileModule;

        /**
         * User module
         */
        user: UserModule;

        /**
         * Messaging module
         */
        messaging: MessagingModule;

        /**
         * Inbox module
         */
        inbox: InboxModule;
    }

    /**
     * User attribute types.
     *
     * This enum's implementation is available on batch.user.BatchUserAttributeType.
     */
    enum BatchUserAttributeType {
        STRING = 1,
        BOOLEAN = 1,
        INTEGER = 2,
        DOUBLE = 3,
        DATE = 4,
        URL = 5,
    }

    /**
     * Object representing a user attribute.
     * An attribute is represented by it's type, which maches the one you've used
     * when setting the attribute, and its value.
     *
     * You can get the attribute using the generic getter, or use the typed ones
     * that will cast the value or return undefined if the type doesn't match.
     */
    interface BatchUserAttribute {
        getType(): BatchUserAttributeType;

        getValue(): unknown;

        getStringValue(): string | undefined;

        getBooleanValue(): boolean | undefined;

        getNumberValue(): number | undefined;

        getDateValue(): Date | undefined;

        getURLValue(): URL | undefined;
    }

    /**
     * Batch's profile module
     */
    interface ProfileModule {
        eventData: typeof BatchEventAttributes;

        /**
         * Identifies this device with a profile using a Custom User ID.
         * If a profile already exists, this device will be attached to it. Must not be longer than 1024 characters.
         * @param {string | null} identifier - Custom user ID of the profile you want to identify against. Null to remove.
         */
        identify(identifier: string | null): void ;

        /**
         * Get the user data editor. Don't forget to call save when you're done.
         * @return Batch user data editor
         */
        getEditor(): BatchProfileAttributeEditor;

        /**
         * Track an event. Batch must be started at some point, or events won't be sent to the server.
         * @param name The event name. Must be a string.
         * @param data The event data (optional). Must be an object.
         */
        trackEvent(name: string, data?: BatchEventAttributes): Promise<string | undefined>;

        /**
         * Track a geolocation update
         * You can call this method from any thread. Batch must be started at some point, or location updates won't be sent to the server.
         * @param location User location object
         */
        trackLocation(location: Location): void;
    }

    /**
     * Batch's user module
     */
    interface UserModule {
        BatchUserAttributeType: typeof BatchUserAttributeType;

        /**
         * Get the unique installation ID, generated by Batch. Batch must be started to read it.
         * The promise will return the Batch-generated installation ID. Might be null/undefined if Batch isn't started.
         */
        getInstallationID(): Promise<undefined | string>;

        /**
         * Get the application language override set using BatchUserDataEditor. Batch must be started to read it.
         * The promise will return the language you have previously set, if any, or undefined. Might be null/undefined if Batch isn't started.
         * Might throw if Batch isn't started.
         */
        getLanguage(): Promise<undefined | string>;

        /**
         * Get the application region override set using BatchUserDataEditor. Batch must be started to read it.
         * The promise will return the region you have previously set, if any, or undefined. Might be null/undefined if Batch isn't started.
         */
        getRegion(): Promise<undefined | string>;

        /**
         * Get the user identifier set using BatchUserDataEditor. Batch must be started to read it.
         * The promise will return the user identifier you have previously set, if any, or undefined. Might be null/undefined if Batch isn't started.
         */
        getIdentifier(): Promise<undefined | string>;

        /**
         * Read the saved attributes.
         * Reading is asynchronous so as not to interfere with saving operations.
         */
        getAttributes(): Promise<{ [key: string]: BatchUserAttribute }>;

        /**
         * Read the saved tag collections.
         * Reading is asynchronous so as not to interfere with saving operations.
         */
        getTagCollections(): Promise<{ [key: string]: string[] }>;

        /**
         * Clear all tags and attributes set on an installation and their local cache returned by `getAttributes` and `getTagCollections`.
         * This does not affect data set on profiles using batch.profile.
         */
        clearInstallationData(): void;
    }

    /**
     * Batch's push module
     */
    interface PushModule {
        AndroidNotificationTypes: typeof AndroidNotificationTypes;
        iOSNotificationTypes: typeof iOSNotificationTypes;

        /**
         * Ask iOS users if they want to accept push notifications. Required to be able to push users.
         * No effect on Android.
         * @deprecated Use requestNotificationAuthorization/requestProvisionalNotificationAuthorization and refreshToken
         */
        registerForRemoteNotifications(): void;

        /**
         * Ask iOS to refresh the push token. If the app didn't prompt the user for consent yet, this will not be done.
         * You should call this at the start of your app, to make sure Batch always gets a valid token after app updates.
         */
        refreshToken(): void;

        /**
         * Call this method to trigger the iOS popup that asks the user if they want
         * to allow notifications to be displayed, then get a Push token.
         * The default registration is made with Badge, Sound and Alert.
         * You should call this at a strategic moment, like at the end of your onboarding.
         *
         * Batch will automatically ask for a push token if the user replies positively.
         * You should then call `refreshToken` on every application start.
         */
        requestNotificationAuthorization(): void;

        /**
         * Call this method to ask iOS for a provisional notification authorization.
         * Batch will then automatically ask for a push token.
         * You should then call `refreshToken` on every application start.
         *
         * Provisional authorization will NOT show a popup asking for user authorization,
         * but notifications will NOT be displayed on the lock screen, or as a banner
         * when the phone is unlocked.
         * They will directly be sent to the notification center,
         * accessible when the user swipes up on the lockscreen,
         * or down from the statusbar when unlocked.
         *
         * This method does nothing on iOS 11 or lower.
         */
        requestProvisionalNotificationAuthorization(): void;

        /**
         * Change the used remote notification types on Android. (Ex: sound, vibrate, alert)
         * Example : setAndroidNotificationTypes(batch.push.AndroidNotificationTypes.ALERT | batch.push.AndroidNotificationTypes.SOUND)
         * @param notifTypes Any combined value of the AndroidNotificationTypes enum.
         */
        setAndroidNotificationTypes(notifTypes: AndroidNotificationTypes): void;

        /**
         * Change the used remote notification types on iOS. (Ex: sound, vibrate, alert)
         * Example : setiOSNotificationTypes(batch.push.iOSNotificationTypes.ALERT | batch.push.iOSNotificationTypes.SOUND)
         * @param notifTypes Any combined value of the AndroidNotificationTypes enum.
         */
        setiOSNotificationTypes(notifTypes: iOSNotificationTypes): void;

        /**
         * Set whether notifications should be show in the foreground on iOS.
         * If true, notifications will be shown like if the user was outside of your application and
         * `batchPushReceived` will only be triggered when the notification is tapped.
         * @param showForegroundNotifications Show foreground notifications?
         */
        setiOSShowForegroundNotifications(
            showForegroundNotifications: boolean
        ): void;

        /**
         * Clear the app badge on iOS. No effect on Android.
         */
        clearBadge(): void;

        /**
         * Dismiss the app's shown notifications on iOS. Should be called on startup.
         * No effect on Android.
         */
        dismissNotifications(): void;

        /**
         * Gets the last known push token.
         * Batch MUST be started in order to use this method.
         *
         * The returned token might be outdated and invalid if this method is called
         * too early in your application lifecycle.
         *
         * On iOS, your application should still register for remote notifications
         * once per launch, in order to keep this value valid.
         *
         * @returns The last known push token (can be null or empty), wrapped in a promise.
         */
        getLastKnownPushToken(): Promise<undefined | string>;
    }

    /**
     * Batch's messaging module
     */
    interface MessagingModule {
        /**
         * Toogles whether Batch should enter its "do not disturb" (DnD) mode or exit it.
         * While in DnD, Batch will not display landings, not matter if they've been triggered by notifications or an In-App Campaign, even in automatic mode.
         *
         * This mode is useful for times where you don't want Batch to interrupt your user, such as during a splashscreen, a video or an interstitial ad.
         *
         * If a message should have been displayed during DnD, Batch will enqueue it, overwriting any previously enqueued message.
         * When exiting DnD, Batch will not display the message automatically: you'll have to call the queue management methods to display the message, if you want to.
         *
         * Use batch.messaging.showPendingMessage() to show a pending message, if any.
         *
         * @param enabled Whether to enable, or disable "Do Not Disturb" mode
         */
        setDoNotDisturbEnabled(enabled: boolean): void;

        /**
         * Shows the currently enqueued message, if any.
         */
        showPendingMessage(): void;
    }

    /**
     * Batch's inbox module
     */
    interface InboxModule {
        NotificationSource: typeof InboxNotificationSource;

        /**
         * Get an inbox fetcher for the current installation ID.
         *
         * The [maxPageSize] is the maximum of notifications to fetch on each call,
         * up to 100 messages per page. Note that the actual count of fetched
         * messages might differ from the value you've set here.
         *
         * Set [limit] to be the maximum number of notifications to fetch, ever.
         * This allows you to let Batch manage the upper limit itself, so you can
         * be sure not to use a crazy amount of memory.
         */
        getFetcherForInstallation(
            maxPageSize?: number,
            limit?: number
        ): Promise<InboxFetcher>;

        /**
         * Get an inbox fetcher for a user identifier.
         *
         * Set [userIdentifier] to the identifier for which you want the notifications:
         * this is usually the current user's identifier, set in `BatchUser`.
         *
         * The [authenticationKey] is the secret used to authenticate the request.
         * It should be computed by your backend. See the documentation for more info
         * on how to generate it.
         *
         * The [maxPageSize] is the maximum of notifications to fetch on each call,
         * up to 100 messages per page. Note that the actual count of fetched
         * messages might differ from the value you've set here.
         *
         * Set [limit] to be the maximum number of notifications to fetch, ever.
         * This allows you to let Batch manage the upper limit itself, so you can
         * be sure not to use a crazy amount of memory.
         */
        getFetcherForUser(
            userIdentifier: string,
            authenticationKey: string,
            maxPageSize?: number,
            limit?: number
        ): Promise<InboxFetcher>;
    }

    /**
     * BatchInboxFetcher allows you to fetch notifications that have been sent to a
     * user (or installation, more on that later) in their raw form, allowing you
     * to display them in a list, for example.
     * This is also useful to display messages to users who disabled notifications.
     *
     * Once you get your BatchInboxFetcher instance, you should call
     * {@link fetchNewNotifications()} to fetch the initial page of messages:
     * nothing is done automatically.
     * This method is also useful to refresh the list from the beginning, like in a
     * "pull to refresh" scenario.
     *
     * In an effort to minimize network and memory usage,
     * messages are fetched by page (batches of messages): this allows you to
     * easily create an infinite list, loading more messages on demand.
     *
     * While you can configure the maximum number of messages you want in a page,
     * the actual number of returned messages can differ, as the SDK may filter
     * some of the messages returned by the server
     * (such as duplicate notifications, etc...).
     *
     * Please MAKE SURE to call {@link dispose()} once you're done with the fetcher
     * (for example, when the user navigates away).
     * Failure to do so will leak memory, as Batch will not know that the associated
     * native object can be released, and the message channel freed.
     *
     * As BatchInboxFetcher caches answers from the server, instances
     * of this class should be tied to the lifecycle of
     * the UI consuming it (if applicable).
     *
     * Another reason to keep the object around, is that you cannot mark a
     * message as read with another BatchInboxFetcher instance that the one
     * that gave you the message in the first place, as this relies on internal
     * data structures that are only loaded in memory.
     *
     * You can also set a upper messages limit, after which BatchInbox will stop
     * fetching new messages, even if you call fetchNextPage.
     */
    interface InboxFetcher {
        /**
         * Get all of the notifications that have been fetched by this fetcher instance.
         *
         * Note: This doesn't cache anything on the javascript side, but always asks
         * the native code. Therefore, this is an expensive method to call: you should
         * cache the result on your end.
         */
        getAllFetchedNotifications(): Promise<BatchSDK.InboxNotification[]>;

        /**
         * Fetch new notifications.
         * While {@link fetchNextPage()} is used to fetch older notifications than the ones currently loaded, this method checks for new notifications.
         * For example, this is the method you would call on initial load, or on a "pull to refresh".
         * The previously loaded notifications will be cleared to ensure consistency.
         * Otherwise, a gap could be created between new notifications and your current set.
         * Upon calling this method, please clear your cache and fill it with this
         * method's results and ask again for more pages if you need.
         */
        fetchNewNotifications(): Promise<InboxFetchResult>;

        /**
         * Fetch a page of notifications.
         * Calling this method when no messages have been loaded will be equivalent
         * to calling {@link fetchNewNotifications()}
         */
        fetchNextPage(): Promise<InboxFetchResult>;

        /**
         * Marks a notification as read.
         *
         * Note: Please refresh your copy of the notifications using [allNotifications]
         * to update the read status.
         * Calling [fetchNewNotifications()]/[fetchNextPage()] right away
         * might cause notifications to come as unread, as the server needs time to
         * process your request.
         */
        markNotificationAsRead(notification: InboxNotification): Promise<void>;

        /**
         * Marks all notifications as read.
         * Note: Please refresh your copy of the notifications using [allNotifications]
         * to update the read status.
         * Calling [fetchNewNotifications()]/[fetchNextPage()] right away
         * might cause notifications to come as unread, as the server needs time to
         * process your request.
         */
        markAllNotificationsAsRead(): Promise<void>;

        /**
         * Marks a notification as deleted.
         *
         * Calling [fetchNewNotifications()]/[fetchNextPage()] right away
         * might cause notifications to still be present, as the server needs time to
         * process your request.
         */
        markNotificationAsDeleted(notification: InboxNotification): Promise<void>;

        /**
         * Display the landing message attached to the notification.
         *
         * Does nothing when no landing message is attached.
         */
        displayNotificationLandingMessage(
            notification: InboxNotification
        ): Promise<void>;

        /**
         * Call this once you're finished with this fetcher to release the native
         * object and free all memory. Usually, this should be called
         * in your State's dispose.
         * Due to javascript limitations, not calling this will leak memory.
         *
         * Calling any method after calling dispose will result in an error
         * being thrown.
         */
        dispose(): void;
    }

    /**
     * Describes an inbox fetch operation result
     */
    interface InboxFetchResult {
        /**
         * Fetched notifications
         */
        notifications: InboxNotification[];

        /**
         * Are more notifications available, or did we reach the end of the Inbox feed?
         */
        endReached: boolean;
    }

    /**
     * User data editor
     */
    interface BatchProfileAttributeEditor {
        /**
         * Set the application language. Overrides Batch's automatically detected language.
         * Send null to let Batch autodetect it again.
         * @param language Language code. 2 chars minimum, or null
         */
        setLanguage(language: string | null): BatchProfileAttributeEditor;

        /**
         * Set the application region. Overrides Batch's automatically detected region.
         * Send "null" to let Batch autodetect it again.
         * @param region Region code. 2 chars minimum, or null
         */
        setRegion(region: string | null): BatchProfileAttributeEditor;


        /**
         * Set the user email address.
         *
         * This requires to have a custom user ID registered
         * or to call the `setIdentifier` method on the editor instance beforehand.
         * @param email A valid email address. Null to erase.
         */
        setEmailAddress(email: string | null): BatchProfileAttributeEditor;

        /**
         * Set the user email marketing subscription state
         *
         * @param state The state of the marketing email subscription. Must be "subscribed" or "unsubscribed".
         */
        setEmailMarketingSubscription(
            state: "subscribed" | "unsubscribed"
        ): BatchProfileAttributeEditor;

        /**
         * Set an attribute for a key
         * @param key Attribute key. Cannot be null, empty or undefined. It should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value Attribute value. Accepted types are numbers, booleans, Date objects and strings. Strings must not be empty or longer than 64 characters.
         */
        setAttribute(
            key: string,
            value: string | number | boolean | Date | URL | Array<string>
        ): BatchProfileAttributeEditor;

        /**
         * Remove an attribute
         * @param key The key of the attribute to remove
         */
        removeAttribute(key: string): BatchProfileAttributeEditor;


        /**
         * Add value to an array attribute. If the array doesn't exist it will be created.
         * @param key Attribute key. Cannot be null, empty or undefined. It should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value The value to add. Cannot be null, undefined or empty. Must be an array of string or a string no longer than 64 characters.
         */
        addToArray(key: string, value: string | Array<string>): BatchProfileAttributeEditor;

        /**
         * Remove a value from an array attribute.
         * @param key Attribute key. Cannot be null, empty or undefined. It should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value The value to remove. Can be a String or an Array of String. Cannot be null, empty or undefined.
         */
        removeFromArray(key: string, value: string | Array<string>): BatchProfileAttributeEditor;

        /**
         * Save all the pending changes made in that editor. This action cannot be undone.
         */
        save(): BatchProfileAttributeEditor;
    }

    /**
     * Notification model from the Inbox module
     */
    interface InboxNotification {
        /**
         * Unique notification identifier. Do not make assumptions about its format: it can change at any time.
         */
        identifier: string;

        /**
         * Notification title (if present)
         */
        title?: string;

        /**
         * Notification alert body
         */
        body: string;

        /**
         * Raw notification user data (also called payload)
         */
        payload: { [key: string]: unknown };

        /**
         * Date at which the push notification has been sent to the device
         */
        date: Date;

        /**
         * Flag indicating whether this notification is unread or not
         */
        isUnread: boolean;

        /**
         * The push notification's source, indicating what made Batch send it. It can come from a push campaign via the API or the dashboard, or from the transactional API, for example.
         */
        source: InboxModule["NotificationSource"];

        /**
         * Flag indicating whether this notification has a landing message attached.
         */
        hasLandingMessage: boolean;
    }

    /**
     * Object holding attributes to be associated to an event
     * Keys should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
     */
    class BatchEventAttributes {
        /**
         * Add a date attribute for the specified key
         *
         * @param key   Attribute key. Should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value Date value to add.
         * @return Same BatchEventData instance, for chaining
         */
        put(key: string, value: Date): BatchEventAttributes;

        /**
         * Add a string attribute for the specified key
         *
         * @param key   Attribute key. Should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value String value to add. Can't be longer than 64 characters, and can't be empty or null. For better results, you should trim/lowercase your strings, and use slugs when possible.
         * @return Same BatchEventData instance, for chaining
         */
        put(key: string, value: string): BatchEventAttributes;

        /**
         * Add a number attribute for the specified key.
         *
         * Note that numbers with a decimal part might be handled differently. You might want to round the value before sending it to the SDK.
         *
         * @param key   Attribute key. Should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value Number value to add.
         * @return Same BatchEventData instance, for chaining
         */
        put(key: string, value: number): BatchEventAttributes;

        /**
         * Add a boolean attribute for the specified key
         *
         * @param key   Attribute key. Should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value URL value to add. Must be a URL instance, not be longer than 2048 characters and must follow the format scheme://[authority][path][?query][#fragment].
         * @return Same BatchEventData instance, for chaining
         */
        put(key: string, value: boolean): BatchEventAttributes;

        /**
         * Add a URL attribute for the specified key
         *
         * @param key   Attribute key. Should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value Boolean value to add.
         * @return Same BatchEventData instance, for chaining
         */
        put(key: string, value: URL): BatchEventAttributes;

        /**
         * Add an Object attribute for the specified key
         *
         * @param key   Attribute key. Should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value BatchEventAttributes value to add.
         * @return Same BatchEventData instance, for chaining
         */
        put(key: string, value: BatchEventAttributes): BatchEventAttributes;

        /**
         * Add an Array of Object attribute for the specified key
         *
         * @param key   Attribute key. Should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value Array<BatchEventAttributes> value to add.
         * @return Same BatchEventData instance, for chaining
         */
        put(key: string, value: Array<BatchEventAttributes>): BatchEventAttributes;

        /**
         * Add an Array of String attribute for the specified key
         *
         * @param key   Attribute key. Should be made of letters, numbers or underscores ([a-z0-9_]) and can't be longer than 30 characters.
         * @param value Array<String> value to add.
         * @return Same BatchEventData instance, for chaining
         */
        put(key: string, value: Array<String>): BatchEventAttributes;
    }

    /**
     * Android Notification Types enum.
     * This enum's implementation is available on batch.push.AndroidNotificationTypes.
     */
    enum AndroidNotificationTypes {
        NONE = 0,
        SOUND = 1 << 0,
        VIBRATE = 1 << 1,
        LIGHTS = 1 << 2,
        ALERT = 1 << 3,
    }

    /**
     * iOS Notification Types enum.
     * This enum's implementation is available on batch.push.iOSNotificationTypes.
     */
    enum iOSNotificationTypes {
        NONE = 0,
        BADGE = 1 << 0,
        SOUND = 1 << 1,
        ALERT = 1 << 2,
    }

    /**
     * Inbox Notification Source enum.
     * A notification source represents how the push was sent from Batch: via the Transactional API, or using a Push Campaign
     *
     * To be used with batch.inbox fetched notifications. This enum's implementation is available on batch.inbox.NotificationSource.
     */
    enum InboxNotificationSource {
        UNKNOWN = 0,
        CAMPAIGN = 1,
        TRANSACTIONAL = 2,
        TRIGGER = 3,
    }
}

declare global {
    const batch: BatchSDK.Batch;

    interface Window {
        batch: BatchSDK.Batch;
    }

    interface CordovaPlugins {
        batch: BatchSDK.Batch;
    }
}
