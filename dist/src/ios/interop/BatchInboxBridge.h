//
//  BatchBridge.h
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import <Foundation/Foundation.h>

#import "BACSimplePromise.h"

@interface BatchInboxBridge : NSObject

+ (BACSimplePromise<NSString*>*)fetchNotifications;

+ (BACSimplePromise<NSString*>*)fetchNotificationsForUser:(NSString*)user authKey:(NSString*)authKey;

@end
