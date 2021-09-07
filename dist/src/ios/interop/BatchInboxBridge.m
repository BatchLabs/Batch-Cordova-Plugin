#import "BatchInboxBridge.h"

#import "BatchBridgeShared.h"
#import <Batch/BatchInbox.h>

typedef NS_ENUM(NSInteger, BatchInboxBridgeErrorCause) {
    // Internal bridge error
    BatchInboxBridgeErrorCauseInternalBridge = -2001,
    
    // SDK Internal Error (Bridge called the SDK properly, but the SDK failed)
    BatchInboxBridgeErrorCauseInternalSDK = -2002,
    
    // Inbox Error (SDK returned an error when performing an inbox operation
    // You should print the localized description and error code in your wrapping error
    BatchInboxBridgeErrorCauseInvalidResponse = -2003,
    
    // User error. This means that the call failed due to invalid input parameters supplied
    // from the plugin implementation.
    // Example: Wrong user inbox parameters (malformed HMAC, etc...)
    BatchInboxBridgeErrorCauseUser = -2004,
    
    // Missing bridge argument. This is a specialized InternalBridge error.
    BatchInboxBridgeErrorCauseBadArgument = -2005,
};

@implementation BatchInboxBridge
{
    dispatch_queue_t _fetchersSyncQueue;
    NSMutableDictionary<NSString*, BatchInboxFetcher*> *_fetchers;
}

+ (instancetype)sharedInboxBridge {
   static BatchInboxBridge *sharedInboxBridge = nil;
   static dispatch_once_t onceToken;
   dispatch_once(&onceToken, ^{
       sharedInboxBridge = [[self alloc] init];
   });
   return sharedInboxBridge;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        _fetchersSyncQueue = dispatch_queue_create("com.batch.interop.inbox", DISPATCH_QUEUE_CONCURRENT);
        _fetchers = [NSMutableDictionary new];
    }
    return self;
}

#pragma mark - Helpers

/**
 Compatibility entry point that bridges promises that return a JSON object or reject to a promise that return a String
 */
- (nullable BACSimplePromise<NSString*> *)doAction:(NSString *)action withParameters:(NSDictionary *)parameters {
    BACSimplePromise *resultPromise = nil;
    
    if ([action caseInsensitiveCompare:INBOX_CREATE_INSTALLATION_FETCHER] == NSOrderedSame)
    {
        return [self createInstallationFetcherForParameters:parameters];
    }
    else if ([action caseInsensitiveCompare:INBOX_CREATE_USER_FETCHER] == NSOrderedSame)
    {
        return [self createUserFetcherForParameters:parameters];
    }
    else if ([action caseInsensitiveCompare:INBOX_RELEASE_FETCHER] == NSOrderedSame)
    {
        [self releaseFetcherForParameters:parameters];
    }
    else if ([action caseInsensitiveCompare:INBOX_FETCH_NEW_NOTIFICATIONS] == NSOrderedSame)
    {

    }
    else if ([action caseInsensitiveCompare:INBOX_FETCH_NEXT_PAGE] == NSOrderedSame)
    {

    }
    else if ([action caseInsensitiveCompare:INBOX_GET_FETCHED_NOTIFICATIONS] == NSOrderedSame)
    {

    }
    else if ([action caseInsensitiveCompare:INBOX_MARK_AS_READ] == NSOrderedSame)
    {
        return [self markAsRead:parameters];
    }
    else if ([action caseInsensitiveCompare:INBOX_MARK_ALL_AS_READ] == NSOrderedSame)
    {
        return [self markAllAsRead:parameters];
    }
    else if ([action caseInsensitiveCompare:INBOX_MARK_AS_DELETED] == NSOrderedSame)
    {
        return [self markAsDeleted:parameters];
    }
    
    return [self convertPromiseToLegacyBridge:resultPromise];
}

// Converts a "new format" Promise matching newer bridges like Flutter (can be resolved to a Dictionary, or rejected)
// to a "legacy" one that is resolved with a string and shouldn't reject.
// Stepping stone until we add proper support for those in the base bridge
- (nullable BACSimplePromise<NSString*> *)convertPromiseToLegacyBridge:(nullable BACSimplePromise*)sourcePromise {
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

- (NSString*)dictionaryToJSON:(NSDictionary*)dictionary
{
    if (dictionary) {
        NSData *data = [NSJSONSerialization dataWithJSONObject:dictionary options:0 error:nil];
        if (data) {
            return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        }
    }
    return nil;
}

- (NSDictionary*)serializeNotificationContent:(BatchInboxNotificationContent*)content
{
    NSMutableDictionary *json = [NSMutableDictionary new];
    json[@"identifier"] = content.identifier;
    json[@"body"] = content.body;
    json[@"is_unread"] = @(content.isUnread);
    json[@"date"] = @(floor([content.date timeIntervalSince1970] * 1000));
    json[@"payload"] = content.payload;
    
    NSUInteger source = 0; // Unknown
    switch (content.source) {
        case BatchNotificationSourceCampaign:
            source = 1;
            break;
        case BatchNotificationSourceTransactional:
            source = 2;
            break;
        case BatchNotificationSourceTrigger:
            source = 3;
            break;
        default:
            source = 0;
            break;
    }
    json[@"source"] = @(source);
    
    if ([content.title length] > 0) {
        json[@"title"] = content.title;
    }
    
    return json;
}

- (nonnull NSError*)errorWithCode:(BatchInboxBridgeErrorCause)code description:(nonnull NSString*)description {
    return [NSError errorWithDomain:@"com.batch.ios.interop.bridge"
                               code:code
                           userInfo:@{
                               NSLocalizedDescriptionKey: description
                           }];
}

- (nonnull NSError*)errorForBadAgument:(nonnull NSString*)argumentName {
    return [self errorWithCode:BatchInboxBridgeErrorCauseBadArgument
                   description:[NSString stringWithFormat:@"Required parameter '%@' missing or of wrong type", argumentName]];
}

#pragma mark - General Inbox instance helpers

- (NSString*)makeFetcherID {
    return [NSUUID UUID].UUIDString;
}

- (NSString*)fetcherIDForParameters:(NSDictionary*)parameters error:(NSError**)error {
    BATCH_INIT_AND_BLANK_ERROR_IF_NEEDED(error);
    
    NSObject *fetcherID = parameters[@"fetcherID"];
    if ([fetcherID isKindOfClass:[NSString class]]) {
        return (NSString*)fetcherID;
    }
    
    *error = [self errorForBadAgument:@"fetcherID"];
    
    return nil;
}

- (BatchInboxFetcher*)fetcherInstanceForParameters:(NSDictionary*)parameters error:(NSError**)error {
    BATCH_INIT_AND_BLANK_ERROR_IF_NEEDED(error);
    
    __block NSError *fetcherIDError = nil;
    __block BatchInboxFetcher *fetcher = nil;
    dispatch_sync(_fetchersSyncQueue, ^{
        NSString *fetcherID = [self fetcherIDForParameters:parameters error:&fetcherIDError];
        if (fetcherID != nil) {
            fetcher = _fetchers[fetcherID];
        }
    });
    
    if (fetcherIDError != nil) {
        *error = fetcherIDError;
        return nil;
    }
    
    if (fetcher == nil) {
        [self errorWithCode:BatchInboxBridgeErrorCauseInternalBridge
                description:@"The native inbox fetcher backing this object could not be found. Did you call dispose() and attempted to use the object afterwards?"];
    }
    
    return fetcher;
}

- (void)setupCommonParameters:(NSDictionary*)parameters onFetcher:(BatchInboxFetcher*)fetcher {
    NSNumber *maxPageSize = parameters[@"maxPageSize"];
    if ([maxPageSize isKindOfClass:[NSNumber class]]) {
        NSInteger maxPageSizeInt = [maxPageSize integerValue];
        if (maxPageSizeInt > 0) {
            fetcher.maxPageSize = maxPageSizeInt;
        }
    }
    
    NSNumber *limit = parameters[@"limit"];
    if ([limit isKindOfClass:[NSNumber class]]) {
        NSInteger limitInt = [limit integerValue];
        if (limitInt > 0) {
            fetcher.limit = limitInt;
        }
    }
}

#pragma mark - Inbox Fetcher lifecycle

- (BACSimplePromise<NSString*>*)createInstallationFetcherForParameters:(NSDictionary*)parameters {
    NSString *fetcherID = [self makeFetcherID];
    
    BACSimplePromise *promise = [BACSimplePromise new];
    
    dispatch_barrier_async(_fetchersSyncQueue, ^{
        BatchInboxFetcher *fetcher = [BatchInbox fetcher];
        [self setupCommonParameters:parameters onFetcher:fetcher];
        self->_fetchers[fetcherID] = fetcher;
        [promise resolve:fetcherID];
    });
    
    return promise;
}

- (BACSimplePromise<NSString*>*)createUserFetcherForParameters:(NSDictionary*)parameters {
    NSString *fetcherID = [self makeFetcherID];
    
    NSObject *user = parameters[@"user"];
    if (![user isKindOfClass:[NSString class]]) {
        return [BACSimplePromise rejected:[self errorForBadAgument:@"user"]];
    }
    
    NSObject *authKey = parameters[@"authKey"];
    if (![authKey isKindOfClass:[NSString class]]) {
        return [BACSimplePromise rejected:[self errorForBadAgument:@"authKey"]];
    }
    
    BACSimplePromise *promise = [BACSimplePromise new];
    
    dispatch_barrier_async(_fetchersSyncQueue, ^{
        BatchInboxFetcher *fetcher = [BatchInbox fetcherForUserIdentifier:(NSString*)user
                                                        authenticationKey:(NSString*)authKey];
        if (fetcher != nil) {
            [self setupCommonParameters:parameters onFetcher:fetcher];
            self->_fetchers[fetcherID] = fetcher;
            [promise resolve:fetcherID];
        } else {
            [promise reject:[self errorWithCode:BatchInboxBridgeErrorCauseUser
                                    description:@"Internal SDK error: Failed to initialize the fetcher. Make sure your user identifier and authentication key are valid and not empty."]];
        }
    });
    
    return promise;
}

- (BACSimplePromise<NSObject*>*)releaseFetcherForParameters:(NSDictionary*)parameters {
    BACSimplePromise *resultPromise = [BACSimplePromise new];
    
    NSError *fetcherIDError = nil;
    NSString *fetcherID = [self fetcherIDForParameters:parameters error:&fetcherIDError];
    
    if (fetcherID != nil) {
        dispatch_barrier_async(_fetchersSyncQueue, ^{
            [self->_fetchers removeObjectForKey:fetcherID];
        });
        [resultPromise resolve:nil];
    } else {
        [resultPromise reject:fetcherIDError];
    }
    
    return resultPromise;
}

#pragma mark - Fetcher methods

#pragma mark - Mark as * methods

- (BACSimplePromise<NSString*>*)markAsRead:(NSDictionary*)parameters {
    NSError *error = nil;
    BatchInboxFetcher *fetcher = [self fetcherInstanceForParameters:parameters error:&error];
    
    if (fetcher == nil) {
        return [BACSimplePromise rejected:error];
    }
    
    NSString *notifID = parameters[@"notifID"];
    if (![notifID isKindOfClass:[NSString class]]) {
        return [BACSimplePromise rejected:[self errorForBadAgument:@"notifID"]];
    }
    
    BACSimplePromise *resultPromise = [BACSimplePromise new];
    
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        // Find the native notification matching the bridged one
        NSArray<BatchInboxNotificationContent*>* allNotifications = [fetcher allFetchedNotifications];
        
        BatchInboxNotificationContent *associatedNativeNotification = nil;
        for (BatchInboxNotificationContent *notification in allNotifications) {
            if ([notifID isEqualToString:notification.identifier]) {
                associatedNativeNotification = notification;
                break;
            }
        }
        
        if (associatedNativeNotification != nil) {
            [fetcher markNotificationAsRead:associatedNativeNotification];
        } else {
            NSLog(@"[Batch] Inbox: Could not mark notification as read: No matching native notification. This can happen if you kept a JavaScript instance of a notification but are trying to use it with another fetcher, or if the fetcher has been reset inbetween.");
        }
        
        [resultPromise resolve:nil];
    });
    
    return resultPromise;
}

- (BACSimplePromise<NSString*>*)markAllAsRead:(NSDictionary*)parameters {
    NSError *error = nil;
    BatchInboxFetcher *fetcher = [self fetcherInstanceForParameters:parameters error:&error];
    
    if (fetcher == nil) {
        return [BACSimplePromise rejected:error];
    }
    
    [fetcher markAllNotificationsAsRead];
    
    return [BACSimplePromise resolved:nil];
}

- (BACSimplePromise<NSString*>*)markAsDeleted:(NSDictionary*)parameters {
    NSError *error = nil;
    BatchInboxFetcher *fetcher = [self fetcherInstanceForParameters:parameters error:&error];
    
    if (fetcher == nil) {
        return [BACSimplePromise rejected:error];
    }
    
    NSString *notifID = parameters[@"notifID"];
    if (![notifID isKindOfClass:[NSString class]]) {
        return [BACSimplePromise rejected:[self errorForBadAgument:@"notifID"]];
    }
    
    BACSimplePromise *resultPromise = [BACSimplePromise new];
    
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        // Find the native notification matching the bridged one
        NSArray<BatchInboxNotificationContent*>* allNotifications = [fetcher allFetchedNotifications];
        
        BatchInboxNotificationContent *associatedNativeNotification = nil;
        for (BatchInboxNotificationContent *notification in allNotifications) {
            if ([notifID isEqualToString:notification.identifier]) {
                associatedNativeNotification = notification;
                break;
            }
        }
        
        if (associatedNativeNotification != nil) {
            [fetcher markNotificationAsDeleted:associatedNativeNotification];
        } else {
            NSLog(@"[Batch] Inbox: Could not mark notification as deleted: No matching native notification. This can happen if you kept a JavaScript instance of a notification but are trying to use it with another fetcher, or if the fetcher has been reset inbetween.");
        }
        
        [resultPromise resolve:nil];
    });
    
    return resultPromise;
}

@end
