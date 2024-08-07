//
//  BatchBridgeUtils.h
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import <Foundation/Foundation.h>
#import <Batch/Batch.h>

/*!
 @class BatchBridgeUtils
 @abstract Utils.
 */
@interface BatchBridgeUtils : NSObject

/*!
 @method convertSerializedEventDataToEventAttributes:
 @abstract Convert an NSDictionary into a BatchEventAttributes.
 @param serializedAttributes  :   The dictionary to convert.
 @return The BatchEventAttributes or nil.
 */
+ (BatchEventAttributes*)convertSerializedEventDataToEventAttributes:(NSDictionary *)serializedAttributes;

/*!
 @method getNullableString:
 @abstract Get an NSString from an NSDictionary or a nil value since cordova bridge return an NSNull instance.
 @param parameters: The dictionary from cordova bridge.
 @return The NSString or nil.
 */
+ (nullable NSString*)nullableString:(nonnull NSDictionary *)parameters forKey:(nonnull NSString *)key;

@end
