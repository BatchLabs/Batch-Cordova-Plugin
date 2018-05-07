//
//  BatchCallback.h
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import <Foundation/Foundation.h>

#define ON_FAILURE                                   @"onBridgeFailure"


/*!
 @protocol BatchBridgeCallback
 @abstract Callback object protocol.
 @discussion All plugin extentions callback mush implement this protocol.
 */
@protocol BatchBridgeCallback <NSObject>

@required
/*!
 @method call:withResult:
 @abstract Callback from any actions.
 @param action  :   Result callback action string (see static ennumeration).
 @param result  :   Action result can be (depending on the called action): NSString, NSNumber, NSArray or NSDictionary.
 */
- (void)call:(NSString *)action withResult:(id<NSSecureCoding>)result;

@end
