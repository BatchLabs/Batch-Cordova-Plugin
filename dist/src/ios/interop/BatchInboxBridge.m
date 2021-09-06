#import "BatchInboxBridge.h"

#import "BatchBridgeShared.h"
#import <Batch/BatchInbox.h>

// Number of notifications to fetch
#define NOTIFICATIONS_COUNT 100

@implementation BatchInboxBridge
{
    dispatch_queue_t _fetchersSyncQueue;
    NSMutableDictionary<NSString*, BatchInboxFetcher*> *_fetchers;
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

- (NSString*)makeFetcherID {
    return [NSUUID UUID].UUIDString;
}

- (BACSimplePromise<NSString*>*)createInstallationFetcherForParameters:(NSDictionary*)parameters {
    NSString *fetcherID = [self makeFetcherID];
    
    BACSimplePromise *promise = [BACSimplePromise new];
    
    dispatch_barrier_async(_fetchersSyncQueue, ^{
        BatchInboxFetcher *fetcher = [BatchInbox fetcher];
        //- (void)setupCommonParameters:(NSDictionary*)parameters onFetcher:(BatchInboxFetcher*)fetcher
        self->_fetchers[fetcherID] = fetcher;
        [promise resolve:fetcherID];
    });
    
    return promise;
}

- (NSString*)fetcherIDForParameters:(NSDictionary*)parameters error:(NSError**)error {
    BATCH_INIT_AND_BLANK_ERROR_IF_NEEDED(error);
    
    NSObject *fetcherID = parameters[@"fetcherID"];
    if ([fetcherID isKindOfClass:[NSString class]]) {
        return (NSString*)fetcherID;
    }
    // TODO: Generate error
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
        //TODO: Generate error
    }
    
    return fetcher;
}

+ (BACSimplePromise<NSString*>*)fetchNotifications
{
    return [self fetchNotificationsUsing:[BatchInbox fetcher]];
}

+ (BACSimplePromise<NSString*>*)fetchNotificationsForUser:(NSString*)user authKey:(NSString*)authKey
{
    return [self fetchNotificationsUsing:[BatchInbox fetcherForUserIdentifier:user authenticationKey:authKey]];
}

+ (BACSimplePromise<NSString*>*)fetchNotificationsUsing:(BatchInboxFetcher*)fetcher
{
    fetcher.limit = NOTIFICATIONS_COUNT;
    fetcher.maxPageSize = NOTIFICATIONS_COUNT;
    
    BACSimplePromise *promise = [BACSimplePromise new];
    
    [fetcher fetchNextPage:^(NSError * _Nullable error, NSArray<BatchInboxNotificationContent *> * _Nullable notifications, BOOL endReached) {
        if (error) {
            [promise resolve:[self errorReponse:error]];
        } else {
            [promise resolve:[self successReponse:notifications]];
        }
    }];
    
    return promise;
}

+ (NSString*)errorReponse:(NSError*)error
{
    NSString *description = [error localizedDescription];
    if ([description length] > 0) {
        return [self dictionaryToJSON:@{
                 @"error": description
                 }];
    }
    return @"{'error':'Internal native error (-200)'}";
}

+ (NSString*)successReponse:(NSArray<BatchInboxNotificationContent *>*)notifications
{
    NSMutableArray<NSDictionary*>* jsonNotifications = [NSMutableArray arrayWithCapacity:notifications.count];
    
    for (BatchInboxNotificationContent* content in notifications) {
        NSDictionary* convertedContent = [self convertNotificationContentToJSON:content];
        if (convertedContent != nil) {
            [jsonNotifications addObject:convertedContent];
        }
    }
    
    return [self dictionaryToJSON:@{@"notifications": jsonNotifications}];
}

+ (NSDictionary*)convertNotificationContentToJSON:(BatchInboxNotificationContent*)content
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

+ (NSString*)dictionaryToJSON:(NSDictionary*)dictionary
{
    if (dictionary) {
        NSData *data = [NSJSONSerialization dataWithJSONObject:dictionary options:0 error:nil];
        if (data) {
            return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        }
    }
    return @"{'error':'Internal native error (-100)'}";
}

@end
