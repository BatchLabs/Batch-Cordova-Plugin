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
#define ON_REDEEM_AUTOMATIC_OFFER                    @"onRedeemAutomaticOffer"
#define ON_REDEEM_URL_SUCCESS                        @"onRedeemURLSuccess"
#define ON_REDEEM_URL_FAILED                         @"onRedeemURLFailed"
#define ON_REDEEM_URL_CODEFOUND                      @"onRedeemURLCodeFound"
#define ON_REDEEM_CODE_SUCCESS                       @"onRedeemCodeSuccess"
#define ON_REDEEM_CODE_FAILED                        @"onRedeemCodeFailed"
#define ON_RESTORE_SUCCESS                           @"onRestoreSuccess"
#define ON_RESTORE_FAILED                            @"onRestoreFailed"
#define ON_AD_INTERSTITIAL_READY                     @"adListener_onInterstitialReady"
#define ON_AD_FAILED_TO_LOAD_INTERSTITIAL            @"adListener_onFailedToLoadInterstitial"


/*!
 @protocol BatchCallback
 @abstract Callback object protocol.
 @discussion All plugin extentions callback mush implement this protocol.
 */
@protocol BatchCallback <NSObject>

@required
/*!
 @method call:withResult:
 @abstract Callback from any actions.
 @param action  :   Result callback action string (see static ennumeration).
 @param result  :   Action result can be (depending on the called action): NSString, NSNumber, NSArray or NSDictionary.
 */
- (void)call:(NSString *)action withResult:(id<NSSecureCoding>)result;

@end
