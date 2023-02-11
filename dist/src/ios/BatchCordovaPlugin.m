//
//  BatchCordovaPlugin.m
//  BatchCordovaPlugin
//
//  Copyright (c) 2016 Batch.com. All rights reserved.
//

#import "BatchCordovaPlugin.h"

#import <UserNotifications/UserNotifications.h>

#import "BACSimplePromise.h"
#import "BatchBridgeShared.h"
#import "BatchBridgeNotificationCenterDelegate.h"

@implementation BatchCordovaPlugin

#pragma mark Fake Selector tools

// Cordova calls the actions requested by Batch directly on this object's methods
// We want to forward to the bridge which already implements what we need, so
// override forwardInvocation: to forward to the bridge if needed
// Note that all Batch actions will have "ba_" added in front
// of them to ensure that there is no collision
//
// For reference, this is the signature of a Cordova call:
// - (void)action:(CDVInvokedUrlCommand*)command;
- (void)forwardInvocation:(NSInvocation *)anInvocation
{
    NSString *selector = NSStringFromSelector(anInvocation.selector);
    //NSLog(@"Got selector %@", selector);
    
    if ([selector hasPrefix:@"BA_"])
    {
        @try
        {
            // It crashes if not __unsafe_unretained
            __unsafe_unretained CDVInvokedUrlCommand *command;
            [anInvocation getArgument:&command atIndex:2];
            [self callBatchBridgeWithAction:selector cordovaCommand:command];
        }
        @catch (NSException *exception)
        {
            NSLog(@"Error while getting the CDVInvokedUrlCommand");
        }
        
        return;
    }
    
    [super forwardInvocation:anInvocation];
}

- (BOOL)respondsToSelector:(SEL)aSelector
{
    //NSLog(@"Reponds to selector %@", NSStringFromSelector(aSelector));
    NSString *selector = NSStringFromSelector(aSelector);
    
    if ([selector hasPrefix:@"BA_"])
    {
        return true;
    }
    return [super respondsToSelector:aSelector];
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector
{
    if ([NSStringFromSelector(aSelector) hasPrefix:@"BA_"])
    {
        return [BatchCordovaPlugin instanceMethodSignatureForSelector:@selector(batchFakeAction:)];
    }
    return [BatchCordovaPlugin instanceMethodSignatureForSelector:aSelector];
}

// Empty method used for faking the signature for bridge method instances
- (void)batchFakeAction:(CDVInvokedUrlCommand*)command
{
    
}

#pragma mark Cordova Plugin methods

- (void)pluginInitialize
{
    //NSLog(@"[Batch] DEBUG - PluginInitialize");
    setenv("BATCH_PLUGIN_VERSION", PluginVersion, 1);
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_batchPushReceived:) name:BatchPushOpenedNotification object:nil];
    
    //[self.commandDelegate evalJs:@"batch._setupCallback()"];
    
    [Batch setLoggerDelegate:self];
    [BatchMessaging setDelegate:self];

    // Ionic Capacitor 4.5+'s Swift NotificationRouter registers itself later than it used to be.
    // As of writing (2022/02/11, Capacitor 4.6), Cordova plugins are initialized _after_ their
    // notification delegate is set, so pluginInitialize looks like a good place to do it.
    // If allowed to do so and there is no other delegate, replace their delegate with ours,
    // which will automatically wrap theirs and should keep compatibility with everything.
    if ([BatchBridgeNotificationCenterDelegate automaticallyRegister]) {
        id notificationDelegate = [UNUserNotificationCenter currentNotificationCenter].delegate;
        NSString *notificationDelegateClass = NSStringFromClass([notificationDelegate class]);
        // Name from https://github.com/ionic-team/capacitor/blob/4768085414768bb2c013afcc6c645664893cd297/ios/Capacitor/Capacitor/NotificationRouter.swift#L3
        if ([@"CAPNotificationRouter" isEqual:notificationDelegateClass]) {
            NSLog(@"[Batch] DEBUG - Wrapping Capacitor's UNUserNotificationCenterDelegate");
            [BatchBridgeNotificationCenterDelegate registerAsDelegate];
        }
    }
}


- (void)onReset
{
    // When the webview navigates, the callback id is no longer usuable
    self.genericCallbackId = nil;
}

- (void)handleOpenURL:(NSNotification *)notification
{
    [super handleOpenURL:notification];
}
#pragma clang diagnostic pop

// Called by the javascript part of the plugin
- (void)_setupCallback:(CDVInvokedUrlCommand*)command
{
    //NSLog(@"[BatchCordovaCallback] DEBUG: Setting up the generic callback %@", command.callbackId);
    self.genericCallbackId = command.callbackId;
}

- (void)_batchPushReceived:(NSNotification*)notification
{
    //NSLog(@"[Batch] DEBUG - BatchPush %@", notification.userInfo);
    if (!notification.userInfo)
    {
        NSLog(@"[Batch] Error: got a push with no userInfo.");
        return;
    }

    NSDictionary *payload = notification.userInfo[@"payload"];
    if (![payload isKindOfClass:[NSDictionary class]])
    {
        NSLog(@"[Batch] Error: got a push with no payload in userInfo.");
        return;
    }

    BOOL hasLandingMessage = false;
    BatchPushMessage *parsedMessage = [BatchMessaging messageFromPushPayload:payload];
    hasLandingMessage = parsedMessage != nil;

    CDVPluginResult *cdvResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{@"action": @"_dispatchPush", @"payload": payload, @"hasLandingMessage": @(hasLandingMessage)}];
    [cdvResult setKeepCallbackAsBool:YES];
    if (!self.genericCallbackId)
    {
        NSLog(@"[BatchCordovaCallback] Not sending push to Batch, _setupCallback doesn't seem to have been called. Something bad happened.");
    }
    else
    {
        [self.commandDelegate sendPluginResult:cdvResult callbackId:self.genericCallbackId];
    }
}

#pragma mark Bridge calls

- (void)callBatchBridgeWithAction:(NSString*)action cordovaCommand:(CDVInvokedUrlCommand*)cdvCommand
{
    // Remove "BA_" from the action
    NSString *cleanAction = [cdvCommand.methodName substringFromIndex:3];
    
    // Allows us to conditionally forward calls to the bridge. Useful so that we don't setup the modules or start Batch multiple times.
    // Not that it matters, but the logs are annoying.
    bool skipBridgeCall = NO;
    
    static bool batchStarted = NO;
    if ([START isEqualToString:cleanAction])
    {
        if (batchStarted)
        {
            skipBridgeCall = YES;
        }
        batchStarted = YES;
    }
    
    //NSLog(@"[BatchCordova] DEBUG: Sending to bridge %@ %@ %@ %@", cleanAction, cdvCommand.className, cdvCommand.methodName, cdvCommand.arguments);
    BACSimplePromise *bridgeResult = nil;
    if (!skipBridgeCall)
    {
        bridgeResult = [BatchBridge call:cleanAction withParameters:[cdvCommand.arguments objectAtIndex:0] callback:self];
    }
    else
    {
        bridgeResult = [BACSimplePromise resolved:@""];
    }
    
    [bridgeResult then:^(NSObject * _Nullable value) {
        // Thought using NO_RESULT was a good idea? Think again https://github.com/don/cordova-plugin-ble-central/issues/32
        CDVPluginResult *cdvResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:value ? (NSString*)value : @""];
        
        [self.commandDelegate sendPluginResult:cdvResult callbackId:cdvCommand.callbackId];
    }];
}

#pragma mark BatchLoggerDelegate

- (void)logWithMessage:(NSString*)message
{
    if (self.genericCallbackId)
    {
        CDVPluginResult *cdvResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{@"action":@"_log", @"message":message}];
        [cdvResult setKeepCallbackAsBool:YES];
    
        [self.commandDelegate sendPluginResult:cdvResult callbackId:self.genericCallbackId];
    }
}

#pragma mark BatchMessagingDelegate

- (void)batchMessageDidAppear:(NSString* _Nullable)messageIdentifier
{
    [self sendMessagingLifecycleEvent:@"shown" forMessageIdentifier:messageIdentifier];
}

- (void)batchMessageDidDisappear:(NSString* _Nullable)messageIdentifier
{
    [self sendMessagingLifecycleEvent:@"closed" forMessageIdentifier:messageIdentifier];
}

- (void)sendMessagingLifecycleEvent:(NSString*)event forMessageIdentifier:(NSString*)messageIdentifier
{
    if (self.genericCallbackId)
    {
        NSMutableDictionary *payload = [NSMutableDictionary new];
        payload[@"action"] = @"_dispatchMessagingEvent";
        payload[@"lifecycleEvent"] = event;
        if (messageIdentifier != nil)
        {
            payload[@"messageIdentifier"] = messageIdentifier;   
        }

        CDVPluginResult *cdvResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:payload];
        [cdvResult setKeepCallbackAsBool:YES];
    
        [self.commandDelegate sendPluginResult:cdvResult callbackId:self.genericCallbackId];
    }
}

#pragma mark Batch Callback
- (void)call:(NSString *)actionString withResult:(id<NSSecureCoding, NSObject>)result
{
    
    //NSLog(@"[BatchCordovaCallback] DEBUG: Sending action %@ to Cordova", actionString);
    
    if (![result isKindOfClass:[NSDictionary class]])
    {
        NSLog(@"[BatchCordovaCallback] Bridge's result is not a NSDictionary, aborting. (action: %@)", actionString);
        return;
    }
    
    CDVPluginResult *cdvResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{@"action": actionString, @"result":(NSDictionary*)result}];
    [cdvResult setKeepCallbackAsBool:YES];
    
    if (!self.genericCallbackId)
    {
        NSLog(@"[BatchCordovaCallback] Not sending callback to Batch, _setupCallback doesn't seem to have been called. Something bad happened.");
    }
    else
    {
        NSLog(@"[BatchCordovaCallback] %@ %@ %@", self.genericCallbackId, actionString, result);
        [self.commandDelegate sendPluginResult:cdvResult callbackId:self.genericCallbackId];
    }
}

@end
