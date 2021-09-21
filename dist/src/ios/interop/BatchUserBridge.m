#import <BatchUserBridge.h>

#import <Batch/BatchUser.h>

@implementation BatchUserBridge

+ (nullable BACSimplePromise<NSObject*> *)fetchAttributes {
    BACSimplePromise<NSObject*>* result = [BACSimplePromise new];
    
    [BatchUser fetchAttributes:^(NSDictionary<NSString *,BatchUserAttribute *> * _Nullable attributes) {
        if (attributes == nil) {
            //TODO: error
            [result reject:nil];
            return;
        }
        
        NSMutableDictionary<NSString*, NSDictionary<NSString*, id>*>* bridgeAttributes = [[NSMutableDictionary alloc] initWithCapacity:attributes.count];
        
        [attributes enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull key, BatchUserAttribute * _Nonnull obj, BOOL * _Nonnull stop) {
            //TODO
            [result reject:nil];
            *stop = true;
        }];
        
        __block NSError *mapError = nil;
        
        if (mapError != nil) {
            [result reject:mapError];
            return;
        }
        
        [result resolve:bridgeAttributes];
    }];
    
    return result;
}

+ (nullable BACSimplePromise<NSObject*> *)fetchTags {
    BACSimplePromise<NSObject*>* result = [BACSimplePromise new];
    
    [BatchUser fetchTagCollections:^(NSDictionary<NSString *,NSSet<NSString *> *> * _Nullable collections) {
        if (collections == nil) {
            //TODO: error
            [result reject:nil];
            return;
        }
        
        NSMutableDictionary<NSString*, NSArray<NSString*>*>* bridgeTagCollections = [[NSMutableDictionary alloc] initWithCapacity:collections.count];
        [collections enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull key, NSSet<NSString *> * _Nonnull obj, BOOL * _Nonnull stop) {
            bridgeTagCollections[key] = [obj allObjects];
        }];
        
        [result resolve:bridgeTagCollections];
    }];
    
    return result;
}

@end
