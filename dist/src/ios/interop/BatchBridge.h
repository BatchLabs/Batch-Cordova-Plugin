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
+ (BACSimplePromise<NSString*> *)call:(NSString *)action withParameters:(NSDictionary *)params callback:(id<BatchBridgeCallback>)callback;

@end
