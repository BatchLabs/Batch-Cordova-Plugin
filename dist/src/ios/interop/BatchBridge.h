//
//  BatchBridge.h
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import <Foundation/Foundation.h>

#import "BatchBridgeCallback.h"
#import "BACSimplePromise.h"


/*!
 @class BatchBridge
 
 Sort of JSON RPC for Batch
 */
@interface BatchBridge : NSObject

/*!
 @method call:withParameters:callback:
 @abstract Perform an action and callback.
 @param action      :   The available action string (see static ennumeration).
 @param params      :   JSON compatible map of parameters.
 @param callback    :   The object to call back on. @see BatchBridgeCallback
 */
+ (nonnull BACSimplePromise<NSString*> *)call:(nonnull NSString *)action withParameters:(nonnull NSDictionary *)params callback:(nonnull id<BatchBridgeCallback>)callback;

/// Converts a "new format" Promise matching newer bridges like Flutter (can be resolved to a Dictionary, or rejected)
/// to a "legacy" one that is resolved with a string and shouldn't reject.
/// Stepping stone until we add proper support for those in the base bridge
+ (nullable BACSimplePromise<NSString*> *)convertPromiseToLegacyBridge:(nullable BACSimplePromise*)sourcePromise;

@end
