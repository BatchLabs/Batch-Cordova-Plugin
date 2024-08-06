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

@end
