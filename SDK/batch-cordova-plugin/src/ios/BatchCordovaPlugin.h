//
//  BatchCordovaPlugin.h
//  BatchCordovaPlugin
//
//  Copyright (c) 2015 Batch.com. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>
#import <BatchBridge/Batch.h>
#import <BatchBridge/BatchBridge.h>
#import <BatchBridge/BatchLogger.h>
#import <BatchBridge/BatchJSONHelper.h>

#define PluginVersion "Cordova/1.5"

@interface BatchCordovaPlugin : CDVPlugin <BatchCallback, BatchLoggerDelegate>

@property (copy, nonatomic) NSString *genericCallbackId;

@end