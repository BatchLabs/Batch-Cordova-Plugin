//
//  BatchBridge.m
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import "BatchBridge.h"

#import <CoreLocation/CoreLocation.h>

#import <Batch/Batch.h>
#import <Batch/BatchUser.h>
#import <Batch/BatchPush.h>

#import "BatchBridgeShared.h"
#import "BatchInboxBridge.h"
#import "BatchBridgeNotificationCenterDelegate.h"
#import "BatchUserBridge.h"
#import "BatchProfileBridge.h"
#import "BatchBridgeUtils.h"

#define INVALID_PARAMETER   @"Invalid parameter."

#define BridgeVersion               @"2.0"

static NSString *currentAPIKey = @"";
static BatchBridge *sharedInstance = nil;
static dispatch_once_t onceToken;

@interface BatchBridge ()
{
    id<BatchBridgeCallback> _callback;

    NSDictionary        *_userInfo;
}

@end

@implementation BatchBridge

#pragma mark -
#pragma mark Public methods

- (id)initWithCallback:(id<BatchBridgeCallback>)callback userInfos:(NSDictionary *)info
{
    self = [super init];

    if (self != nil)
    {
        _callback = callback;
        _userInfo = info;
    }

    return self;
}


+ (void)initialize
{
    // Setup bridge version.
    NSString *infos = [NSString stringWithFormat:@"Bridge/%@",BridgeVersion];
    setenv("BATCH_BRIDGE_VERSION", [infos cStringUsingEncoding:NSUTF8StringEncoding], 1);
}

+ (BatchBridge*)instanceWithCallback:(id<BatchBridgeCallback>)callback
{
    dispatch_once(&onceToken, ^{
        sharedInstance = [[BatchBridge alloc] initWithCallback:callback userInfos:@{@"APIKey": currentAPIKey}];
    });
    return sharedInstance;
}

// Perform an action and callback.
+ (BACSimplePromise<NSString*> *)call:(NSString *)action withParameters:(NSDictionary *)parameters callback:(id<BatchBridgeCallback>)callback
{
    BACSimplePromise<NSString*> *result = nil;
    @try
    {
        result = [BatchBridge doAction:action withParameters:parameters callback:callback];
    }
    @catch (NSException *exception)
    {
        NSLog(@"Batch bridge raised an exception: %@",exception);
        if (callback)
        {
            [callback call:ON_FAILURE withResult:[exception reason]];
        }
        result = [BACSimplePromise resolved:@""];
    }

    return result;
}


#pragma mark -
#pragma mark Private methods

+ (NSString *)boolToBridgeString:(BOOL)value
{
    return value ? @"true" : @"false";
}

+ (BACSimplePromise<NSString*> *)doAction:(NSString *)action withParameters:(NSDictionary *)parameters callback:(id<BatchBridgeCallback>)callback
{
    // Check action description.
    if (action==nil || ![action isKindOfClass:[NSString class]] || action.length==0)
    {
        [NSException raise:INVALID_PARAMETER format:@"Empty or null action: %@",action];
    }

    // startWithCallback:
    if ([action caseInsensitiveCompare:START] == NSOrderedSame)
    {
        [BatchBridge startWithCallback:callback];
    }

    // optIn:
    else if ([action caseInsensitiveCompare:OPT_IN] == NSOrderedSame)
    {
        [BatchSDK optIn];
        if ([currentAPIKey length] > 0)
        {
            [BatchSDK startWithAPIKey:currentAPIKey];
        }
    }

    // optOut:
    else if ([action caseInsensitiveCompare:OPT_OUT] == NSOrderedSame)
    {
        [BatchSDK optOut];
    }

    // optOutAndWipeData:
    else if ([action caseInsensitiveCompare:OPT_OUT_AND_WIPE_DATA] == NSOrderedSame)
    {
        [BatchSDK optOutAndWipeData];
    }

    // isOptedOut:
    else if ([action caseInsensitiveCompare:IS_OPTED_OUT] == NSOrderedSame)
    {
        return [self convertPromiseToLegacyBridge:[BACSimplePromise resolved:@{
            @"isOptedOut": [NSNumber numberWithBool:BatchSDK.isOptedOut]
        }]] ;
    }

    // enablesFindMyInstallation:
    else if ([action caseInsensitiveCompare:SET_FIND_MY_INSTALLATION_ENABLED] == NSOrderedSame)
    {
           if (!parameters || [parameters count]==0)
            {
                [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action setFindMyInstallationEnabled "];
            }

            NSNumber *enabled = parameters[@"enabled"];

            if (![enabled isKindOfClass:[NSNumber class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"enabled should be a NSNumber"];
            }
            BatchSDK.enablesFindMyInstallation = [enabled boolValue];
    }

    // setConfigWithApiKey:andUseIDFA:
    else if ([action caseInsensitiveCompare:SET_CONFIG] == NSOrderedSame)
    {
        if (!parameters || [parameters count]==0)
        {
            [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action %@.", action];
        }

        NSString *APIKey = [parameters objectForKey:@"APIKey"];
        if (!APIKey)
        {
            [NSException raise:INVALID_PARAMETER format:@"Missing parameter 'APIKey' for action %@.", action];
        }

        NSNumber *useIDFA = [parameters objectForKey:@"useIDFA"];

        [BatchBridge setConfigWithApiKey:APIKey andUseIDFA:useIDFA];
    }

    else if ([action caseInsensitiveCompare:PUSH_GET_LAST_KNOWN_TOKEN] == NSOrderedSame)
    {
        return [BACSimplePromise resolved:[BatchBridge lastKnownPushToken]];
    }

    else if ([action caseInsensitiveCompare:PUSH_REFRESH_TOKEN] == NSOrderedSame)
    {
        [BatchPush refreshToken];
    }

    else if ([action caseInsensitiveCompare:PUSH_REQUEST_AUTHORIZATION] == NSOrderedSame)
    {
        [BatchPush requestNotificationAuthorization];
    }

    else if ([action caseInsensitiveCompare:PUSH_REQUEST_PROVISIONAL_AUTH] == NSOrderedSame)
    {
        [BatchPush requestProvisionalNotificationAuthorization];
    }

    // Android Push Only
    else if ([action caseInsensitiveCompare:SET_GCM_SENDER_ID] == NSOrderedSame)
    {
        // Do nothing
    }

    else if ([action caseInsensitiveCompare:SET_IOS_SHOW_FOREGROUND_NOTIFS] == NSOrderedSame)
    {
        if (!parameters || [parameters count]==0)
        {
            [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action %@.", action];
        }

        NSNumber *showForeground = [parameters objectForKey:@"showForeground"];
        if (!showForeground)
        {
            [NSException raise:INVALID_PARAMETER format:@"Missing parameter 'showForeground' for action %@.", action];
        }

        [BatchBridge setiOSShowForegroundNotifications:[showForeground boolValue]];
    }

    else if ([action caseInsensitiveCompare:SET_IOSNOTIF_TYPES] == NSOrderedSame)
    {
        if (!parameters || [parameters count]==0)
        {
            [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action %@.", action];
        }

        NSNumber *notifTypes = [parameters objectForKey:@"notifTypes"];
        if (!notifTypes)
        {
            [NSException raise:INVALID_PARAMETER format:@"Missing parameter 'notifTypes' for action %@.", action];
        }

        [BatchBridge setNotificationTypes:(BatchNotificationType)[notifTypes integerValue]];
    }

    // Android Push Only
    else if ([action caseInsensitiveCompare:SET_ANDROIDNOTIF_TYPES] == NSOrderedSame)
    {
        // Do nothing
    }
    else if ([action caseInsensitiveCompare:REGISTER_NOTIFS] == NSOrderedSame)
    {
        [BatchBridge registerForRemoteNotifications];
    }
    else if ([action caseInsensitiveCompare:DISMISS_NOTIFS] == NSOrderedSame)
    {
        [BatchBridge dismissNotifications];
    }
    else if ([action caseInsensitiveCompare:CLEAR_BADGE] == NSOrderedSame)
    {
        [BatchBridge clearBadge];
    }
    else if ([action caseInsensitiveCompare:USER_GET_LANGUAGE] == NSOrderedSame)
    {
        return [BACSimplePromise resolved:[BatchBridge user_getLanguage]];
    }
    else if ([action caseInsensitiveCompare:USER_GET_REGION] == NSOrderedSame)
    {
        return [BACSimplePromise resolved:[BatchBridge user_getRegion]];
    }
    else if ([action caseInsensitiveCompare:USER_GET_IDENTIFIER] == NSOrderedSame)
    {
        return [BACSimplePromise resolved:[BatchBridge user_getIdentifier]];
    }
    else if ([action caseInsensitiveCompare:USER_CLEAR_INSTALL_DATA] == NSOrderedSame)
    {
        [BatchUser clearInstallationData];
    }
    else if ([action caseInsensitiveCompare:PROFILE_IDENTIFY] == NSOrderedSame)
    {
        if (!parameters || [parameters count]==0)
        {
            [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action %@.", action];
        }
        [BatchProfileBridge identify:parameters];
    }
    else if ([action caseInsensitiveCompare:PROFILE_EDIT] == NSOrderedSame)
    {
        if (!parameters || [parameters count]==0)
        {
            [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action %@.", action];
        }
        [BatchProfileBridge editAttributes:parameters];
    }
    else if ([action caseInsensitiveCompare:PROFILE_TRACK_EVENT] == NSOrderedSame)
    {
        return [BACSimplePromise resolved:[BatchProfileBridge trackEvent:parameters]];
    }
    else if ([action caseInsensitiveCompare:PROFILE_TRACK_LOCATION] == NSOrderedSame)
    {
        [BatchProfileBridge trackLocation:parameters];
    }
    else if ([action caseInsensitiveCompare:USER_GET_INSTALLATION_ID] == NSOrderedSame)
    {
        return [BACSimplePromise resolved:[BatchUser installationID]];
    }
    else if ([action caseInsensitiveCompare:USER_FETCH_ATTRIBUTES] == NSOrderedSame)
    {
        return [self convertPromiseToLegacyBridge:[BatchUserBridge fetchAttributes]];
    }
    else if ([action caseInsensitiveCompare:USER_FETCH_TAGS] == NSOrderedSame)
    {
        return [self convertPromiseToLegacyBridge:[BatchUserBridge fetchTags]];
    }
    else if ([action caseInsensitiveCompare:MESSAGING_SET_DND_ENABLED] == NSOrderedSame)
    {
        [BatchBridge setMessagingDoNotDisturbEnabled:parameters];
    }
    else if ([action caseInsensitiveCompare:MESSAGING_SHOW_PENDING_MSG] == NSOrderedSame)
    {
        [BatchMessaging showPendingMessage];
    }

    else if ([action.lowercaseString hasPrefix:INBOX_PREFIX])
    {
        // The Inbox Bridge will take care of every inbox method
        BACSimplePromise *inboxPromise = [[BatchInboxBridge sharedInboxBridge] doAction:action withParameters:parameters];
        if (inboxPromise != nil) {
            return inboxPromise;
        } else {
            [NSException raise:INVALID_PARAMETER format:@"Unknown inbox action: %@", action];
        }
    }

    else
    {
        // Unknown method.
        [NSException raise:INVALID_PARAMETER format:@"Unknown action: %@", action];
    }

    return [BACSimplePromise resolved:@""];
}

#pragma mark -
#pragma mark Helpers

// Converts a "new format" Promise matching newer bridges like Flutter (can be resolved to a Dictionary, or rejected)
// to a "legacy" one that is resolved with a string and shouldn't reject.
// Stepping stone until we add proper support for those in the base bridge
+ (nullable BACSimplePromise<NSString*> *)convertPromiseToLegacyBridge:(nullable BACSimplePromise*)sourcePromise {
    if (sourcePromise == nil) {
        return nil;
    }

    // Promise that holds the output, will be resolved by a "sub promise" (as we can't chain simple promises yet)
    // that convers NSDictionaries to NSStrings and catches errors.
    BACSimplePromise<NSString*> *responsePromise = [BACSimplePromise new];

    [sourcePromise then:^(NSObject * _Nullable value) {
        // No NSNumber/NSArray support. NSNumber might be fine anyway.
        if ([value isKindOfClass:[NSDictionary class]]) {
            // dictionaryToJSON: might seria
            NSString *jsonResponse = [self dictionaryToJSON:(NSDictionary*)value];
            if (jsonResponse != nil) {
                [responsePromise resolve:jsonResponse];
            } else {
                [responsePromise resolve:@"{'error':'Internal native error (-1100)', 'code': -1100}"];
            }
        } else {
            [responsePromise resolve:(id)value];
        }
    }];

    [sourcePromise catch:^(NSError * _Nullable error) {
        NSString *jsonError;
        NSString *description = [error localizedDescription];
        if ([description length] > 0) {
            jsonError = [self dictionaryToJSON:@{
                     @"error": description,
                     @"code": @(error.code),
                     }];
        }

        if (jsonError == nil) {
            jsonError = @"{'error':'Internal native error (-1200)', 'code': -1200}";
        }

        [responsePromise resolve:jsonError];
    }];

    return responsePromise;
}

+ (NSString*)dictionaryToJSON:(NSDictionary*)dictionary
{
    if (dictionary) {
        NSData *data = [NSJSONSerialization dataWithJSONObject:dictionary options:0 error:nil];
        if (data) {
            return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        }
    }
    return nil;
}

#pragma mark -
#pragma mark Batch bindings

+ (void)startWithCallback:(id<BatchBridgeCallback>)callback
{
    [BatchSDK startWithAPIKey:currentAPIKey];
    [BatchBridgeNotificationCenterDelegate sharedInstance].isBatchReady = true;
}


+ (void)setConfigWithApiKey:(NSString*)APIKey andUseIDFA:(NSNumber*)useIDFA
{
//    if (useIDFA)
//    {
//        [Batch setUseIDFA:[useIDFA boolValue]];
//    }
    currentAPIKey = APIKey;
}

#pragma mark -
#pragma mark Push methods

+ (NSString*)lastKnownPushToken
{
    NSString *token = [BatchPush lastKnownPushToken];
    if (token)
    {
        return token;
    }
    return @"";
}

+ (void)setiOSShowForegroundNotifications:(BOOL)showForegroundNotifications
{
    BatchBridgeNotificationCenterDelegate *delegate = [BatchBridgeNotificationCenterDelegate sharedInstance];
    delegate.showForegroundNotifications = showForegroundNotifications;
    delegate.shouldUseChainedCompletionHandlerResponse = false;
}

+ (void)setNotificationTypes:(BatchNotificationType)type
{
    [BatchPush setRemoteNotificationTypes:type];
}

+ (void)registerForRemoteNotifications
{
    [BatchPush requestNotificationAuthorization];
    [BatchPush refreshToken];
}

+ (void)clearBadge
{
    [BatchPush clearBadge];
}

+ (void)dismissNotifications
{
    [BatchPush dismissNotifications];
}

#pragma mark -
#pragma mark User methods

+ (NSString *)user_getLanguage
{
    return [BatchUser language];
}

+ (NSString *)user_getRegion
{
    return [BatchUser region];
}

+ (NSString *)user_getIdentifier
{
    return [BatchUser identifier];
}

#pragma mark -
#pragma mark Messaging methods

+ (void)setMessagingDoNotDisturbEnabled:(NSDictionary*)params
{
    if (!params || [params count]==0)
    {
        [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action messaging.setDoNotDisturbEnabled"];
    }

    NSNumber *enabled = params[@"enabled"];

    if (![enabled isKindOfClass:[NSNumber class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"enabled should be a NSNumber"];
    }

    BatchMessaging.doNotDisturb = [enabled boolValue];
}
@end
