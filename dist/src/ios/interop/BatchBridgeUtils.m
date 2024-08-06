//
//  BatchJSONHelper.m
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import "BatchBridgeUtils.h"

#define INVALID_PARAMETER @"Invalid parameter."

@implementation BatchBridgeUtils

+ (BatchEventAttributes*) convertSerializedEventDataToEventAttributes:(NSDictionary *) serializedAttributes {

    BatchEventAttributes *eventAttributes = [BatchEventAttributes new];

    if (![serializedAttributes isKindOfClass:[NSDictionary class]]) {
        NSLog(@"RNBatch: Error while tracking event data: event data.attributes should be a dictionary");
        return nil;
    }

    for (NSString *key in serializedAttributes.allKeys)
    {
        NSDictionary *typedAttribute = serializedAttributes[key];
        if (![typedAttribute isKindOfClass:[NSDictionary class]])
        {
            [NSException raise:INVALID_PARAMETER format:@"event_data.attributes childrens should all be String/Dictionary tuples"];
        }

        NSString *type = typedAttribute[@"type"];
        NSObject *value = typedAttribute[@"value"];

        if ([@"d" isEqualToString:type]) {
            if (![value isKindOfClass:[NSNumber class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected number (date) value, got something else"];
            }
            double dateValue = [((NSNumber*)value) doubleValue]/1000;
            [eventAttributes putDate:[NSDate dateWithTimeIntervalSince1970:dateValue] forKey:key];
        } else if ([@"s" isEqualToString:type]) {
            if (![value isKindOfClass:[NSString class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected string value, got something else"];
            }
            [eventAttributes putString:(NSString*)value forKey:key];
        } else if ([@"b" isEqualToString:type]) {
            if (![value isKindOfClass:[NSNumber class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected number (boolean) value, got something else"];
            }
            [eventAttributes putBool:[(NSNumber*)value boolValue] forKey:key];
        } else if ([@"i" isEqualToString:type]) {
            if (![value isKindOfClass:[NSNumber class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected number (integer) value, got something else"];
            }
            [eventAttributes putInteger:[(NSNumber*)value integerValue] forKey:key];
        } else if ([@"f" isEqualToString:type]) {
            if (![value isKindOfClass:[NSNumber class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected number (float) value, got something else"];
            }
            [eventAttributes putDouble:[(NSNumber*)value doubleValue] forKey:key];
        } else if ([@"u" isEqualToString:type]) {
            if (![value isKindOfClass:[NSString class]])
            {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: expected url (string) value, got something else"];
            }
            NSURL *urlValue = [NSURL URLWithString:(NSString*)value];
            if (urlValue == nil) {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: invalid URL"];
            }
            [eventAttributes putURL:urlValue forKey:key];
        } else if ([@"o" isEqualToString:type]) {
            if (![value isKindOfClass:[NSDictionary class]]){
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: invalid object, expected dictionary value "];
                return nil;
            }
            BatchEventAttributes *attributes = [self convertSerializedEventDataToEventAttributes:(NSDictionary*)value];
            if (attributes != nil) {
                [eventAttributes putObject:attributes forKey:key];
            }
        }
        else if ([@"sa" isEqualToString:type]) {
            if (![value isKindOfClass:[NSArray class]]){
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: invalid array, expected array value. "];
                return nil;
            }

            [eventAttributes putStringArray:(NSArray*)value forKey:key];
        } else if ([@"oa" isEqualToString:type]) {
            if (![value isKindOfClass:[NSArray class]]) {
                [NSException raise:INVALID_PARAMETER format:@"event_data.attributes: invalid array, expected array value. "];
                return nil;
            }
            NSMutableArray<BatchEventAttributes *> *list = [NSMutableArray array];
            NSArray *array = (NSArray*)value;
            for (int i = 0; i < array.count; i++) {
                BatchEventAttributes *object = [self convertSerializedEventDataToEventAttributes:array[i]];
                if (object != nil) {
                    [list addObject:object];
                }
            }
            [eventAttributes putObjectArray:list forKey:key];
        }
        else {
            [NSException raise:INVALID_PARAMETER format:@"Unknown event_data.attributes type"];
        }
    }
    return eventAttributes;
}

@end
