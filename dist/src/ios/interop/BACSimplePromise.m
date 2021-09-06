//  https://batch.com
//  Copyright (c) 2018 Batch SDK. All rights reserved.

#import "BACSimplePromise.h"

/**
 A simple Promise-like implementation that is not thread-safe.
 then can't mutate the value
 */
@implementation BACSimplePromise
{
    BACSimplePromiseStatus _status;
    NSObject *_resolvedValue; // NSError* if rejected
    NSMutableArray *_thenQueue;
    void (^_catchBlock)(NSError*);
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        _status = BACSimplePromiseStatusPending;
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

+ (nonnull instancetype)rejected:(nullable NSError*)error
{
    BACSimplePromise *promise = [BACSimplePromise new];
    [promise reject:error];
    return promise;
}

- (void)resolve:(nullable NSObject*)value
{
    @synchronized(_thenQueue) {
        if (_status != BACSimplePromiseStatusPending) {
            return;
        }
        
        _status = BACSimplePromiseStatusResolved;
        _resolvedValue = value;
        
        void (^thenBlock)(NSObject*);
        while ([_thenQueue count] > 0) {
            thenBlock = [_thenQueue objectAtIndex:0];
            [_thenQueue removeObjectAtIndex:0];
            if (thenBlock) {
                thenBlock(value);
            }
        }
    }
}

- (void)reject:(nullable NSError*)error
{
    if (_status != BACSimplePromiseStatusPending) {
        return;
    }
    
    _status = BACSimplePromiseStatusRejected;
    _resolvedValue = error;
    
    if (_catchBlock) {
        _catchBlock(error);
    }
}

- (void)then:(void (^_Nonnull)(NSObject* _Nullable ))thenBlock
{
    @synchronized(_thenQueue) {
        if (_status == BACSimplePromiseStatusResolved) {
            thenBlock(_resolvedValue);
        } else if (_status == BACSimplePromiseStatusPending) {
            [_thenQueue addObject:thenBlock];
        }
    }
}

- (void)catch:(void (^_Nonnull)(NSError* _Nullable ))catchBlock
{
    if (_status == BACSimplePromiseStatusRejected) {
        if ([_resolvedValue isKindOfClass:[NSError class]]) {
            catchBlock((NSError*)_resolvedValue);
        } else {
            catchBlock(nil);
        }
    } else if (_status == BACSimplePromiseStatusPending) {
        _catchBlock = catchBlock;
    }
}

@end
