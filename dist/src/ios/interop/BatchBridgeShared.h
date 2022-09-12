// Defines that are useful anywhere in the plugin

#define BATCH_INIT_AND_BLANK_ERROR_IF_NEEDED(error) \
if (error == NULL) {\
    __autoreleasing NSError *fakeOutErr;\
    error = &fakeOutErr;\
}\
*error = nil;


// Bridge actions

#define SET_CONFIG                      @"setConfig"
#define START                           @"start"
#define OPT_IN                          @"optIn"
#define OPT_OUT                         @"optOut"
#define OPT_OUT_AND_WIPE_DATA           @"optOutAndWipeData"
#define PUSH_GET_LAST_KNOWN_TOKEN          @"push.getLastKnownPushToken"
#define SET_GCM_SENDER_ID               @"push.setGCMSenderID"
#define SET_IOS_SHOW_FOREGROUND_NOTIFS  @"push.setIOSShowForegroundNotifications"
#define SET_IOSNOTIF_TYPES              @"push.setIOSNotifTypes"
#define SET_ANDROIDNOTIF_TYPES          @"push.setAndroidNotifTypes"
#define PUSH_REFRESH_TOKEN              @"push.iOS.refreshToken"
#define PUSH_REQUEST_AUTHORIZATION      @"push.requestAuthorization"
#define PUSH_REQUEST_PROVISIONAL_AUTH   @"push.iOS.requestProvisionalAuthorization"

#define REGISTER_NOTIFS                 @"push.register"
#define DISMISS_NOTIFS                  @"push.dismissNotifications"
#define CLEAR_BADGE                     @"push.clearBadge"

#define USER_EDIT                       @"user.edit"
#define USER_TRACK_EVENT                @"user.track.event"
#define USER_TRACK_LEGACY_EVENT         @"user.track.legacy_event"
#define USER_TRACK_TRANSACTION          @"user.track.transaction"
#define USER_TRACK_LOCATION             @"user.track.location"
#define USER_DATA_DEBUG                 @"user.data.debug"
#define USER_GET_INSTALLATION_ID        @"user.getInstallationID"
#define USER_GET_REGION                 @"user.getRegion"
#define USER_GET_LANGUAGE               @"user.getLanguage"
#define USER_GET_IDENTIFIER             @"user.getIdentifier"
#define USER_FETCH_ATTRIBUTES           @"user.fetch.attributes"
#define USER_FETCH_TAGS                 @"user.fetch.tags"

#define MESSAGING_SET_DND_ENABLED       @"messaging.setDoNotDisturbEnabled"
#define MESSAGING_SHOW_PENDING_MSG      @"messaging.showPendingMessage"

#define INBOX_PREFIX                         @"inbox."
#define INBOX_CREATE_INSTALLATION_FETCHER    @"inbox.createInstallationFetcher"
#define INBOX_CREATE_USER_FETCHER            @"inbox.createUserFetcher"
#define INBOX_RELEASE_FETCHER                @"inbox.releaseFetcher"
#define INBOX_FETCH_NEW_NOTIFICATIONS        @"inbox.fetchNewNotifications"
#define INBOX_FETCH_NEXT_PAGE                @"inbox.fetchNextPage"
#define INBOX_GET_FETCHED_NOTIFICATIONS      @"inbox.getFetchedNotifications"
#define INBOX_MARK_AS_READ                   @"inbox.markAsRead"
#define INBOX_MARK_ALL_AS_READ               @"inbox.markAllAsRead"
#define INBOX_MARK_AS_DELETED                @"inbox.markAsDeleted"
