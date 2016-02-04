//
//  BatchBridge.h
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import <Foundation/Foundation.h>

#import "BatchUnlock.h"

#import "BatchCallback.h"

#define SET_CONFIG                  	@"setConfig"
#define START                       	@"start"
#define UNLOCK_SETUP                    @"unlock.setup"
#define REDEEM_URL                  	@"redeemURL"
#define REDEEM_CODE                 	@"redeemCode"
#define RESTORE                     	@"restore"
#define IS_DEV_MODE                 	@"isDevMode"
#define GET_CUSTOM_USER_ID          	@"getCustomID"
#define SET_CUSTOM_USER_ID          	@"setCustomID"
#define GET_APP_LANGUAGE            	@"getAppLanguage"
#define SET_APP_LANGUAGE            	@"setAppLanguage"
#define GET_APP_REGION              	@"getAppRegion"
#define SET_APP_REGION              	@"setAppRegion"
#define PUSH_SETUP                      @"push.setup"
#define PUSH_GET_LAST_KNOWN_TOKEN      	@"push.getLastKnownPushToken"
#define SET_GCM_SENDER_ID           	@"push.setGCMSenderID"
#define SET_IOSNOTIF_TYPES          	@"push.setIOSNotifTypes"
#define SET_ANDROIDNOTIF_TYPES      	@"push.setAndroidNotifTypes"
#define REGISTER_NOTIFS             	@"push.register"
#define DISMISS_NOTIFS              	@"push.dismissNotifications"
#define CLEAR_BADGE                 	@"push.clearBadge"

#define USER_EDIT                       @"user.edit"
#define USER_TRACK_EVENT                @"user.track.event"
#define USER_TRACK_TRANSACTION          @"user.track.transaction"
#define USER_DATA_DEBUG                 @"user.data.debug"
#define USER_GET_INSTALLATION_ID        @"user.getInstallationID"


/*!
 @class BatchBridge
 @abstract Class that makes communication generic between Batch and any plugin.
 @discussion This is the main entry point for any plugin extention.
 */
@interface BatchBridge : NSObject <BatchUnlockDelegate>

/*!
 @method call:withParameters:callback:
 @abstract Perform an action and callback.
 @param action      :   The available action string (see static ennumeration).
 @param params      :   JSON compatible map of parameters.
 @param callback    :   The object to callback on. @see BatchCallback
 */
+ (NSString *)call:(NSString *)action withParameters:(NSDictionary *)params callback:(id<BatchCallback>)callback;

@end
