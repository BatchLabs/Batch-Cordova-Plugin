//
//  BatchJSONHelper.h
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import <Foundation/Foundation.h>

/*!
 @class BatchJSONHelper
 @abstract JSON convertion helper.
 */
@interface BatchJSONHelper : NSObject

/*!
 @method JSONStringFromObject:
 @abstract Convert an object into it's JSON string representation.
 @param object  :   The object to convert. It must be a valid JSON object.
 @return The JSON string or nil.
 */
+ (NSString *)JSONStringFromObject:(id)object;

/*!
 @method objectFromJSONString:
 @abstract Convert a JSON string representation into an object.
 @param string  :   The JSON string representation to convert.
 @return The built object or nil.
 */
+ (id)objectFromJSONString:(NSString *)string;

@end
