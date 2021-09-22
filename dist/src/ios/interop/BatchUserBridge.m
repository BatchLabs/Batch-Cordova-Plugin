#import <BatchUserBridge.h>

#import <Batch/BatchUser.h>

@implementation BatchUserBridge

typedef NS_ENUM(NSInteger, BatchUserBridgeErrorCause) {
    // Internal bridge error
    BatchUserBridgeErrorCauseInternalBridge = -3001,
    
    // SDK Internal Error (Bridge called the SDK properly, but the SDK failed)
    BatchUserBridgeErrorCauseInternalSDK = -3002,
};

+ (nullable BACSimplePromise<NSObject*> *)fetchAttributes {
    BACSimplePromise<NSObject*>* result = [BACSimplePromise new];
    
    [BatchUser fetchAttributes:^(NSDictionary<NSString *,BatchUserAttribute *> * _Nullable attributes) {
        if (attributes == nil) {
            [result reject:[self errorWithCode:BatchUserBridgeErrorCauseInternalSDK
                                   description:@"Native SDK fetchAttributes returned an error"]];
            return;
        }
        
        __block NSError *mapError = nil;
        NSMutableDictionary<NSString*, NSDictionary<NSString*, id>*>* bridgeAttributes = [[NSMutableDictionary alloc] initWithCapacity:attributes.count];
        
        [attributes enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull key, BatchUserAttribute * _Nonnull attribute, BOOL * _Nonnull stop) {
            
            NSString *bridgeType;
            id bridgeValue = nil;
            
            switch (attribute.type) {
                case BatchUserAttributeTypeBool:
                    bridgeType = @"b";
                    bridgeValue = attribute.numberValue;
                    break;
                case BatchUserAttributeTypeDate:
                {
                    bridgeType = @"d";
                    NSDate *dateValue = attribute.dateValue;
                    if (dateValue != nil) {
                        bridgeValue = @(floor(dateValue.timeIntervalSince1970 * 1000));
                    }
                    break;
                }
                case BatchUserAttributeTypeDouble:
                    bridgeType = @"f";
                    bridgeValue = attribute.numberValue;
                    break;
                case BatchUserAttributeTypeLongLong:
                    bridgeType = @"i";
                    bridgeValue = attribute.numberValue;
                    break;
                case BatchUserAttributeTypeString:
                    bridgeType = @"s";
                    bridgeValue = attribute.stringValue;
                    break;
                default:
                {
                    mapError = [self errorWithCode:BatchUserBridgeErrorCauseInternalBridge
                                       description:[NSString stringWithFormat:@"Fetch attribute: Unknown attribute type %lu.", (unsigned long)attribute.type]];
                    *stop = true;
                    return;
                }
            }
            
            if (bridgeValue == nil) {
                mapError = [self errorWithCode:BatchUserBridgeErrorCauseInternalBridge
                                   description:[NSString stringWithFormat:@"Fetch attribute: Failed to serialize attribute for type %@", bridgeType]];
                *stop = true;
                return;
            }
            
            *stop = false;
            bridgeAttributes[key] = @{
                @"type": bridgeType,
                @"value": bridgeValue,
            };
        }];
        
        if (mapError != nil) {
            [result reject:mapError];
            return;
        }
        
        [result resolve:@{@"attributes": bridgeAttributes}];
    }];
    
    return result;
}

+ (nullable BACSimplePromise<NSObject*> *)fetchTags {
    BACSimplePromise<NSObject*>* result = [BACSimplePromise new];
    
    [BatchUser fetchTagCollections:^(NSDictionary<NSString *,NSSet<NSString *> *> * _Nullable collections) {
        if (collections == nil) {
            [result reject:[self errorWithCode:BatchUserBridgeErrorCauseInternalSDK
                                   description:@"Native SDK fetchTagCollections returned an error"]];
            return;
        }
        
        NSMutableDictionary<NSString*, NSArray<NSString*>*>* bridgeTagCollections = [[NSMutableDictionary alloc] initWithCapacity:collections.count];
        [collections enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull key, NSSet<NSString *> * _Nonnull obj, BOOL * _Nonnull stop) {
            bridgeTagCollections[key] = [obj allObjects];
        }];
        
        [result resolve:@{@"tagCollections": bridgeTagCollections}];
    }];
    
    return result;
}

+ (nonnull NSError*)errorWithCode:(BatchUserBridgeErrorCause)code description:(nonnull NSString*)description {
    return [NSError errorWithDomain:@"com.batch.ios.interop.bridge.user"
                               code:code
                           userInfo:@{
                               NSLocalizedDescriptionKey: description
                           }];
}

@end
