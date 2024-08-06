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
#import "BatchBridgeUtils.h"

#define INVALID_PARAMETER   @"Invalid parameter."

#define BridgeVersion               @"2.0"

static NSString *currentAPIKey = @"";
static BOOL batchStartCalled = false;
static NSString *queuedURL = nil;
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

        if (!batchStartCalled && queuedURL)
        {
            [BatchBridge handleURL:queuedURL];
            queuedURL = nil;
        }

        batchStartCalled = true;
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
    else if ([action caseInsensitiveCompare:PROFILE_EDIT] == NSOrderedSame)
    {
        if (!parameters || [parameters count]==0)
        {
            [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action %@.", action];
        }

        [BatchBridge userDataEdit:parameters];
    }
    else if ([action caseInsensitiveCompare:PROFILE_TRACK_EVENT] == NSOrderedSame)
    {
        [BatchBridge trackEvent:parameters];
    }
    else if ([action caseInsensitiveCompare:PROFILE_TRACK_LOCATION] == NSOrderedSame)
    {
        [BatchBridge trackLocation:parameters];
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

+ (void)handleURL:(NSString *)urlString
{
    NSURL *url = [NSURL URLWithString:urlString];
    if (url == nil)
    {
        [NSException raise:INVALID_PARAMETER format:@"Cannot build a NSURL from the url string: %@",urlString];
    }

    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wunused-result"
    //[Batch handleURL:url];
    #pragma clang diagnostic pop
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

+ (void)userDataEdit:(NSDictionary*)params
{
    NSArray *operations = [params objectForKey:@"operations"];

    if (!operations)
    {
        [NSException raise:INVALID_PARAMETER format:@"Couldn't find operations for user.edit"];
        return;
    }

    BatchProfileEditor *editor = [BatchProfile editor];

    for (NSDictionary *operationDescription in operations)
    {
        if (![operationDescription isKindOfClass:[NSDictionary class]])
        {
            continue;
        }

        NSString *operationName = [operationDescription objectForKey:@"operation"];

        if (![operationName isKindOfClass:[NSString class]])
        {
            continue;
        }

        if ([@"SET_LANGUAGE" isEqualToString:operationName])
        {
            [editor setLanguage:[operationDescription objectForKey:@"value"] error:nil];
        }
        else if ([@"SET_REGION" isEqualToString:operationName])
        {
            [editor setRegion:[operationDescription objectForKey:@"value"] error:nil];
        }
        else if([@"SET_EMAIL_ADDRESS" isEqualToString:operationName])
        {
            [editor setEmailAddress:[operationDescription objectForKey:@"value"] error:nil];
        }
        else if([@"SET_EMAIL_MARKETING_SUB" isEqualToString:operationName]) {
            NSString* value = [operationDescription objectForKey:@"value"];
            if([[value uppercaseString] isEqualToString:@"SUBSCRIBED"]) {
                [editor setEmailMarketingSubscriptionState:BatchEmailSubscriptionStateSubscribed];
            } else if ([[value uppercaseString] isEqualToString:@"UNSUBSCRIBED"]) {
                [editor setEmailMarketingSubscriptionState: BatchEmailSubscriptionStateUnsubscribed];
            } else {
                NSLog(@"Batch Bridge - Invalid value for email marketing subscription state. Must be `subscribed` or `unsubscribed`.");
            }
        }
        else if ([@"SET_ATTRIBUTE" isEqualToString:operationName])
        {
            NSString *type = operationDescription[@"type"];
            if (![type isKindOfClass:[NSString class]])
            {
                continue;
            }

            NSString *key = operationDescription[@"key"];

            if ([@"string" isEqualToString:type])
            {
                [editor setStringAttribute:operationDescription[@"value"] forKey:key error:nil];
            }
            else if ([@"url" isEqualToString:type])
            {
                NSString *absoluteURL = operationDescription[@"value"];
                if (![absoluteURL isKindOfClass:[NSString class]]) {
                    NSLog(@"Batch Bridge - %@", @"Error while setting URL attribute: invalid internal value");
                    continue;
                }
                NSURL *urlValue = [NSURL URLWithString:absoluteURL];
                if (urlValue == nil) {
                    NSLog(@"Batch Bridge - Could not set URL for attribute '%@': the URL is not valid", key);
                    continue;
                }
                [editor setURLAttribute:urlValue forKey:key error:nil];
            }
            else if ([@"date" isEqualToString:type])
            {
                double dateValue = [operationDescription[@"value"] doubleValue]/1000;
                [editor setDateAttribute:[NSDate dateWithTimeIntervalSince1970:dateValue] forKey:key error:nil];
            }
            else if ([@"integer" isEqualToString:type] || [@"float" isEqualToString:type] || [@"boolean" isEqualToString:type])
            {
                NSNumber *numberValue = operationDescription[@"value"];

                if (!numberValue)
                {
                    // NaN or Infinity
                    continue;
                }

                if ([numberValue isKindOfClass:[NSNumber class]] || [numberValue isKindOfClass:[NSString class]])
                {
                    if ([@"float" isEqualToString:type])
                    {
                        [editor setFloatAttribute:[numberValue doubleValue] forKey:key error:nil];

                    }
                    else if ([@"boolean" isEqualToString:type])
                    {
                        [editor setBooleanAttribute:[numberValue boolValue] forKey:key error:nil];

                    }
                    else
                    {
                        [editor setLongLongAttribute:[numberValue longLongValue] forKey:key error:nil];
                    }
                }
                else
                {
                    NSLog(@"Batch Bridge - %@", @"Error while reading SET_ATTRIBUTE integer value: must be a string or a number");
                    continue;
                }
            }
            else if ([@"array" isEqualToString:type])
            {
                [editor setStringArrayAttribute:operationDescription[@"value"] forKey:key error:nil];
            }
            else
            {
                NSLog(@"Batch Bridge - %@", @"Error while reading SET_ATTRIBUTE value: unknown type");
            }
        }
        else if ([@"REMOVE_ATTRIBUTE" isEqualToString:operationName])
        {
            [editor removeAttributeForKey:operationDescription[@"key"] error:nil];
        }

        else if ([@"ADD_TO_ARRAY" isEqualToString:operationName])
        {
            NSString* key = operationDescription[@"key"] ;
            id value = operationDescription[@"value"];
            if ([value isKindOfClass:[NSString class]]) {
                [editor addItemToStringArrayAttribute:value forKey:key error:nil];
            } else if ([value isKindOfClass:[NSArray class]]) {
                for (NSString *item in value) {
                    [editor addItemToStringArrayAttribute:item forKey:key error:nil];
                }
            }
        }
        else if ([@"REMOVE_FROM_ARRAY" isEqualToString:operationName])
        {
            NSString* key = operationDescription[@"key"] ;
            id value = operationDescription[@"value"];
            if ([value isKindOfClass:[NSString class]]) {
                [editor removeItemFromStringArrayAttribute:value forKey:key error:nil];
            } else if ([value isKindOfClass:[NSArray class]]) {
                for (NSString *item in value) {
                    [editor removeItemFromStringArrayAttribute:item forKey:key error:nil];
                }
            }
        }
    }

    [editor save];
}

+ (void)trackEvent:(NSDictionary*)params
{
    if (!params || [params count]==0)
    {
        [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for user.track.event"];
    }

    NSString *name = params[@"name"];
    NSDictionary *data = params[@"event_data"];

    if (![name isKindOfClass:[NSString class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"name should be a string"];
    }

    BatchEventAttributes *batchEventAttributes = nil;

    if ([data isKindOfClass:[NSDictionary class]]) {
        batchEventAttributes = [BatchBridgeUtils convertSerializedEventDataToEventAttributes:data];

        NSError *err;
        [batchEventAttributes validateWithError:&err];
        if (batchEventAttributes != nil && err == nil) {
            [BatchProfile trackEventWithName:name attributes:batchEventAttributes];
            //resolve([NSNull null]);
        } else {
            [NSException raise:INVALID_PARAMETER format:@"Event attributes validation failed"];
            //reject(@"BatchBridgeError", @"Event attributes validation failed:", err);
        }
        return;
    }
    [BatchProfile trackEventWithName:name attributes:batchEventAttributes];
}


+ (void)trackLocation:(NSDictionary*)params
{
    if (!params || [params count]==0)
    {
        [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action user.track.location"];
    }

    NSNumber *latitude = params[@"latitude"];
    NSNumber *longitude = params[@"longitude"];
    NSNumber *date = params[@"date"]; // MS
    NSNumber *precision = params[@"precision"];

    if (![latitude isKindOfClass:[NSNumber class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"latitude should be a string"];
    }

    if (![longitude isKindOfClass:[NSNumber class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"longitude should be a string"];
    }

    NSTimeInterval ts = 0;

    if (date)
    {
        if ([date isKindOfClass:[NSNumber class]]) {
            ts = [date doubleValue] / 1000.0;
        } else {
            [NSException raise:INVALID_PARAMETER format:@"date should be an object or undefined"];
        }
    }

    NSDate *parsedDate = ts != 0 ? [NSDate dateWithTimeIntervalSince1970:ts] : [NSDate date];

    NSInteger parsedPrecision = 0;
    if (precision)
    {
        if ([precision isKindOfClass:[NSNumber class]]) {
            parsedPrecision = [precision integerValue];
        } else {
            [NSException raise:INVALID_PARAMETER format:@"precision should be an object or undefined"];
        }
    }

    [BatchProfile trackLocation:[[CLLocation alloc] initWithCoordinate:CLLocationCoordinate2DMake([latitude doubleValue], [longitude doubleValue])
                                                           altitude:0
                                                 horizontalAccuracy:parsedPrecision
                                                   verticalAccuracy:-1
                                                             course:0
                                                              speed:0
                                                          timestamp:parsedDate]];
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
