//
//  BatchCordovaPlugin.h
//  BatchCordovaPlugin
//
//  Copyright (c) 2015 Batch.com. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>
#import <Batch/Batch.h>
#import "BatchBridge.h"
#import "BatchBridgeCallback.h"

#define PluginVersion "Cordova/5.2.0"

@interface BatchCordovaPlugin : CDVPlugin <BatchBridgeCallback, BatchLoggerDelegate, BatchMessagingDelegate>

@property (copy, nonatomic) NSString *genericCallbackId;

@end