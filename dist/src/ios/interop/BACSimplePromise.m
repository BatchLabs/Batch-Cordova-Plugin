//  https://batch.com
//  Copyright (c) 2018 Batch SDK. All rights reserved.

#import "BACSimplePromise.h"

/**
 A simple Promise-like implementation that can only be resolved and is not thread-safe.
 then can't mutate the value
 catch does not exist
 */
@implementation BACSimplePromise
{
    BOOL _resolved;
    NSObject *_resolvedValue;
    NSMutableArray *_thenQueue;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        _resolved = false;
        _resolvedValue = nil;
        _thenQueue = [NSMutableArray new];
    }
    return self;
}

+ (nonnull instancetype)resolved:(nullable NSObject*)value
{
    BACSimplePromise *promise = [BACSimplePromise new];
    [promise resolve:value];
    return promise;
}

- (void)resolve:(nullable NSObject*)value
{
    @synchronized(_thenQueue) {
        if (_resolved) {
            return;
        }
        
        _resolved = true;
        _resolvedValue = value;
        
        void (^thenBlock)(NSObject*);
        while ([_thenQueue count] > 0) {
            thenBlock = [_thenQueue objectAtIndex:0];
            [_thenQueue removeObjectAtIndex:0];
            thenBlock(value);
        }
    }
}

- (void)then:(void (^_Nonnull)(NSObject* _Nullable ))thenBlock
{
    @synchronized(_thenQueue) {
        if (_resolved) {
            thenBlock(_resolvedValue);
        } else {
            [_thenQueue addObject:thenBlock];
        }
    }
}

@end
