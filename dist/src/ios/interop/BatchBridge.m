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
#import <Batch/BatchUserProfile.h>
#import <Batch/BatchPush.h>

#import "BatchInboxBridge.h"
#import "BatchBridgeNotificationCenterDelegate.h"

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
        [Batch optIn];
        if ([currentAPIKey length] > 0)
        {
            [Batch startWithAPIKey:currentAPIKey];
        }
    }

    // optOut:
    else if ([action caseInsensitiveCompare:OPT_OUT] == NSOrderedSame)
    {
        [Batch optOut];
    }

    // optOutAndWipeData:
    else if ([action caseInsensitiveCompare:OPT_OUT_AND_WIPE_DATA] == NSOrderedSame)
    {
        [Batch optOutAndWipeData];
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
    
    else if ([action caseInsensitiveCompare:USER_EDIT] == NSOrderedSame)
    {
        if (!parameters || [parameters count]==0)
        {
            [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action %@.", action];
        }
        
        [BatchBridge userDataEdit:parameters];
    }
    
    else if ([action caseInsensitiveCompare:USER_TRACK_EVENT] == NSOrderedSame)
    {
        [BatchBridge trackEvent:parameters];
    }
    else if ([action caseInsensitiveCompare:USER_TRACK_LEGACY_EVENT] == NSOrderedSame)
    {
        [BatchBridge trackLegacyEvent:parameters];
    }
    
    
    else if ([action caseInsensitiveCompare:USER_TRACK_TRANSACTION] == NSOrderedSame)
    {
        [BatchBridge trackTransaction:parameters];
    }
    else if ([action caseInsensitiveCompare:USER_TRACK_LOCATION] == NSOrderedSame)
    {
        [BatchBridge trackLocation:parameters];
    }
    else if ([action caseInsensitiveCompare:USER_DATA_DEBUG] == NSOrderedSame)
    {
        [BatchUser printDebugInformation];
    }
    else if ([action caseInsensitiveCompare:USER_GET_INSTALLATION_ID] == NSOrderedSame)
    {
        return [BACSimplePromise resolved:[BatchUser installationID]];
    }

    else if ([action caseInsensitiveCompare:MESSAGING_SET_DND_ENABLED] == NSOrderedSame)
    {
        [BatchBridge setMessagingDoNotDisturbEnabled:parameters];
    }
    else if ([action caseInsensitiveCompare:MESSAGING_SHOW_PENDING_MSG] == NSOrderedSame)
    {
        [BatchMessaging showPendingMessage];
    }

    else if ([action caseInsensitiveCompare:INBOX_FETCH] == NSOrderedSame)
    {
        return [BatchInboxBridge fetchNotifications];
    }
    else if ([action caseInsensitiveCompare:INBOX_FETCH_FOR_USER_ID] == NSOrderedSame)
    {
        if (!parameters || [parameters count]==0)
        {
            [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action %@.", action];
        }

        NSString *userID = [parameters objectForKey:@"id"];
        if (![userID isKindOfClass:[NSString class]])
        {
            [NSException raise:INVALID_PARAMETER format:@"Missing parameter 'id' for action %@.", action];
        }

        NSString *authKey = [parameters objectForKey:@"auth"];
        if (![authKey isKindOfClass:[NSString class]])
        {
            [NSException raise:INVALID_PARAMETER format:@"Missing parameter 'auth' for action %@.", action];
        }

        return [BatchInboxBridge fetchNotificationsForUser:userID authKey:authKey];
    }
    
    // Unknown method.
    else
    {
        [NSException raise:INVALID_PARAMETER format:@"Unknown action: %@", action];
    }
    
    return [BACSimplePromise resolved:@""];
}


#pragma mark -
#pragma mark Batch bindings

+ (void)startWithCallback:(id<BatchBridgeCallback>)callback
{
    [Batch startWithAPIKey:currentAPIKey];
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
    [Batch handleURL:url];
    #pragma clang diagnostic pop
}

+ (NSString *)isRunningInDevelopmentMode
{
    return [Batch isRunningInDevelopmentMode]?@"true":@"false";
}

+ (void)setConfigWithApiKey:(NSString*)APIKey andUseIDFA:(NSNumber*)useIDFA
{
    if (useIDFA)
    {
        [Batch setUseIDFA:[useIDFA boolValue]];
    }
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
    [BatchBridgeNotificationCenterDelegate sharedInstance].showForegroundNotifications = showForegroundNotifications;
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
    
    BatchUserDataEditor *editor = [BatchUser editor];
    
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
            [editor setLanguage:[operationDescription objectForKey:@"value"]];
        }
        else if ([@"SET_REGION" isEqualToString:operationName])
        {
            [editor setRegion:[operationDescription objectForKey:@"value"]];
        }
        else if ([@"SET_IDENTIFIER" isEqualToString:operationName])
        {
            [editor setIdentifier:[operationDescription objectForKey:@"value"]];
        }
        else if ([@"SET_ATTRIBUTE" isEqualToString:operationName])
        {
            NSString *type = operationDescription[@"type"];
            if (![type isKindOfClass:[NSString class]])
            {
                continue;
            }
            
            if ([@"string" isEqualToString:type])
            {
                [editor setAttribute:operationDescription[@"value"] forKey:operationDescription[@"key"]];
            }
            else if ([@"date" isEqualToString:type])
            {
                double dateValue = [operationDescription[@"value"] doubleValue]/1000;
                [editor setAttribute:[NSDate dateWithTimeIntervalSince1970:dateValue] forKey:operationDescription[@"key"]];
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
                    NSNumber *sdkValue;
                    if ([@"float" isEqualToString:type])
                    {
                        sdkValue = @([numberValue doubleValue]);
                    }
                    else if ([@"boolean" isEqualToString:type])
                    {
                        sdkValue = @([numberValue boolValue]);
                    }
                    else
                    {
                        sdkValue = @([numberValue longLongValue]);
                    }
                    [editor setAttribute:sdkValue forKey:operationDescription[@"key"]];
                }
                else
                {
                    NSLog(@"Batch Bridge - %@", @"Error while reading SET_ATTRIBUTE integer value: must be a string or a number");
                    continue;
                }
            }
            else
            {
                NSLog(@"Batch Bridge - %@", @"Error while reading SET_ATTRIBUTE value: unknown type");
            }
        }
        else if ([@"REMOVE_ATTRIBUTE" isEqualToString:operationName])
        {
            [editor removeAttributeForKey:operationDescription[@"key"]];
        }
        else if ([@"CLEAR_ATTRIBUTES" isEqualToString:operationName])
        {
            [editor clearAttributes];
        }
        else if ([@"ADD_TAG" isEqualToString:operationName])
        {
            [editor addTag:operationDescription[@"tag"] inCollection:operationDescription[@"collection"]];
        }
        else if ([@"REMOVE_TAG" isEqualToString:operationName])
        {
            [editor removeTag:operationDescription[@"tag"] fromCollection:operationDescription[@"collection"]];
        }
        else if ([@"CLEAR_TAGS" isEqualToString:operationName])
        {
            [editor clearTags];
        }
        else if ([@"CLEAR_TAG_COLLECTION" isEqualToString:operationName])
        {
            [editor clearTagCollection:operationDescription[@"collection"]];
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
    NSString *label = params[@"label"];
    NSDictionary *data = params[@"event_data"];
    
    if (![name isKindOfClass:[NSString class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"name should be a string"];
    }
    
    if (label && ![label isKindOfClass:[NSString class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"label should be a string or null"];
    }
    
    BatchEventData *batchEventData = nil;

    if (data)
    {
        batchEventData = [BatchEventData new];
        
        if (![data isKindOfClass:[NSDictionary class]])
        {
            [NSException raise:INVALID_PARAMETER format:@"event_data should be an object or null"];
        }

        NSArray<NSString*>* tags = data[@"tags"];
        NSDictionary<NSString*, NSDictionary*>* attributes = data[@"attributes"];

        if (![tags isKindOfClass:[NSArray class]])
        {
            [NSException raise:INVALID_PARAMETER format:@"event_data.tags should be an array"];
        }
        if (![attributes isKindOfClass:[NSDictionary class]])
        {
            [NSException raise:INVALID_PARAMETER format:@"event_data.attributes should be a dictionnary"];
        }

        for (NSString *tag in tags)
        {
            if (![tag isKindOfClass:[NSString class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"event_data.tag childrens should all be strings"];
            }
            [batchEventData addTag:tag];
        }

        for (NSString *key in attributes.allKeys)
        {
            NSDictionary *typedAttribute = attributes[key];
            if (![typedAttribute isKindOfClass:[NSDictionary class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes childrens should all be String/Dictionary tuples"];
            }

            NSString *type = typedAttribute[@"type"];
            NSObject *value = typedAttribute[@"value"];

            if ([@"d" isEqualToString:type]) {
                if (![value isKindOfClass:[NSNumber class]])
                {
                    [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected number (date) value, got something else"];
                }
                double dateValue = [((NSNumber*)value) doubleValue]/1000;
                [batchEventData putDate:[NSDate dateWithTimeIntervalSince1970:dateValue] forKey:key];
            } else if ([@"s" isEqualToString:type]) {
                if (![value isKindOfClass:[NSString class]])
                {
                    [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected string value, got something else"];
                }
                [batchEventData putString:(NSString*)value forKey:key];
            } else if ([@"b" isEqualToString:type]) {
                if (![value isKindOfClass:[NSNumber class]])
                {
                    [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected number (boolean) value, got something else"];
                }
                [batchEventData putBool:[(NSNumber*)value boolValue] forKey:key];
            } else if ([@"i" isEqualToString:type]) {
                if (![value isKindOfClass:[NSNumber class]])
                {
                    [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected number (integer) value, got something else"];
                }
                [batchEventData putInteger:[(NSNumber*)value integerValue] forKey:key];
            } else if ([@"f" isEqualToString:type]) {
                if (![value isKindOfClass:[NSNumber class]])
                {
                    [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected number (float) value, got something else"];
                }
                [batchEventData putDouble:[(NSNumber*)value doubleValue] forKey:key];
            } else {
                [NSException raise:INVALID_PARAMETER format:@"Unknown event_data.attributes type"];
            }
        }
    }
    
    [BatchUser trackEvent:name withLabel:label associatedData:batchEventData];
}

+ (void)trackLegacyEvent:(NSDictionary*)params
{
    if (!params || [params count]==0)
    {
        [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for user.track.legacy_event"];
    }
    
    NSString *name = params[@"name"];
    NSString *label = params[@"label"];
    NSDictionary *data = params[@"data"];
    
    if (![name isKindOfClass:[NSString class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"name should be a string"];
    }
    
    if (label && ![label isKindOfClass:[NSString class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"label should be a string or null"];
    }
    
    if (data && ![data isKindOfClass:[NSDictionary class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"data should be an object or null"];
    }
    
    [BatchUser trackEvent:name withLabel:label data:data];
}

+ (void)trackTransaction:(NSDictionary*)params
{
    if (!params || [params count]==0)
    {
        [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action user.track.transaction"];
    }
    
    NSNumber *amount = params[@"amount"];
    NSDictionary *data = params[@"data"];
    
    if (![amount isKindOfClass:[NSNumber class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"name should be a string"];
    }
    
    if (data && ![data isKindOfClass:[NSDictionary class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"data should be an object or null"];
    }
    
    [BatchUser trackTransactionWithAmount:[amount doubleValue] data:data];
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
    
    [BatchUser trackLocation:[[CLLocation alloc] initWithCoordinate:CLLocationCoordinate2DMake([latitude doubleValue], [longitude doubleValue])
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
