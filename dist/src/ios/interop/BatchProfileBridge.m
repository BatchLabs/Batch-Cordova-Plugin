#import "BatchProfileBridge.h"
#import "BatchBridgeUtils.h"

#import <Batch/BatchUser.h>

#define INVALID_PARAMETER   @"Invalid parameter."

@implementation BatchProfileBridge

+ (void)editAttributes:(NSDictionary*)params
{
    NSArray *operations = [params objectForKey:@"operations"];

    if (!operations)
    {
        [NSException raise:INVALID_PARAMETER format:@"Couldn't find operations for user.edit"];
        return;
    }

    BatchProfileEditor *editor = [BatchProfile editor];

    for (NSDictionary *operationDescription in operations)
    {
        if (![operationDescription isKindOfClass:[NSDictionary class]])
        {
            continue;
        }

        NSString *operationName = [operationDescription objectForKey:@"operation"];

        if (![operationName isKindOfClass:[NSString class]])
        {
            continue;
        }

        if ([@"SET_LANGUAGE" isEqualToString:operationName])
        {
            [editor setLanguage:[operationDescription objectForKey:@"value"] error:nil];
        }
        else if ([@"SET_REGION" isEqualToString:operationName])
        {
            [editor setRegion:[operationDescription objectForKey:@"value"] error:nil];
        }
        else if([@"SET_EMAIL_ADDRESS" isEqualToString:operationName])
        {
            [editor setEmailAddress:[operationDescription objectForKey:@"value"] error:nil];
        }
        else if([@"SET_EMAIL_MARKETING_SUB" isEqualToString:operationName]) {
            NSString* value = [operationDescription objectForKey:@"value"];
            if([[value uppercaseString] isEqualToString:@"SUBSCRIBED"]) {
                [editor setEmailMarketingSubscriptionState:BatchEmailSubscriptionStateSubscribed];
            } else if ([[value uppercaseString] isEqualToString:@"UNSUBSCRIBED"]) {
                [editor setEmailMarketingSubscriptionState: BatchEmailSubscriptionStateUnsubscribed];
            } else {
                NSLog(@"Batch Bridge - Invalid value for email marketing subscription state. Must be `subscribed` or `unsubscribed`.");
            }
        }
        else if ([@"SET_ATTRIBUTE" isEqualToString:operationName])
        {
            NSString *type = operationDescription[@"type"];
            if (![type isKindOfClass:[NSString class]])
            {
                continue;
            }

            NSString *key = operationDescription[@"key"];

            if ([@"string" isEqualToString:type])
            {
                [editor setStringAttribute:operationDescription[@"value"] forKey:key error:nil];
            }
            else if ([@"url" isEqualToString:type])
            {
                NSString *absoluteURL = operationDescription[@"value"];
                if (![absoluteURL isKindOfClass:[NSString class]]) {
                    NSLog(@"Batch Bridge - %@", @"Error while setting URL attribute: invalid internal value");
                    continue;
                }
                NSURL *urlValue = [NSURL URLWithString:absoluteURL];
                if (urlValue == nil) {
                    NSLog(@"Batch Bridge - Could not set URL for attribute '%@': the URL is not valid", key);
                    continue;
                }
                [editor setURLAttribute:urlValue forKey:key error:nil];
            }
            else if ([@"date" isEqualToString:type])
            {
                double dateValue = [operationDescription[@"value"] doubleValue]/1000;
                [editor setDateAttribute:[NSDate dateWithTimeIntervalSince1970:dateValue] forKey:key error:nil];
            }
            else if ([@"integer" isEqualToString:type] || [@"float" isEqualToString:type] || [@"boolean" isEqualToString:type])
            {
                NSNumber *numberValue = operationDescription[@"value"];

                if (!numberValue)
                {
                    // NaN or Infinity
                    continue;
                }

                if ([numberValue isKindOfClass:[NSNumber class]] || [numberValue isKindOfClass:[NSString class]])
                {
                    if ([@"float" isEqualToString:type])
                    {
                        [editor setFloatAttribute:[numberValue doubleValue] forKey:key error:nil];

                    }
                    else if ([@"boolean" isEqualToString:type])
                    {
                        [editor setBooleanAttribute:[numberValue boolValue] forKey:key error:nil];

                    }
                    else
                    {
                        [editor setLongLongAttribute:[numberValue longLongValue] forKey:key error:nil];
                    }
                }
                else
                {
                    NSLog(@"Batch Bridge - %@", @"Error while reading SET_ATTRIBUTE integer value: must be a string or a number");
                    continue;
                }
            }
            else if ([@"array" isEqualToString:type])
            {
                [editor setStringArrayAttribute:operationDescription[@"value"] forKey:key error:nil];
            }
            else
            {
                NSLog(@"Batch Bridge - %@", @"Error while reading SET_ATTRIBUTE value: unknown type");
            }
        }
        else if ([@"REMOVE_ATTRIBUTE" isEqualToString:operationName])
        {
            [editor removeAttributeForKey:operationDescription[@"key"] error:nil];
        }

        else if ([@"ADD_TO_ARRAY" isEqualToString:operationName])
        {
            NSString* key = operationDescription[@"key"] ;
            id value = operationDescription[@"value"];
            if ([value isKindOfClass:[NSString class]]) {
                [editor addItemToStringArrayAttribute:value forKey:key error:nil];
            } else if ([value isKindOfClass:[NSArray class]]) {
                for (NSString *item in value) {
                    [editor addItemToStringArrayAttribute:item forKey:key error:nil];
                }
            }
        }
        else if ([@"REMOVE_FROM_ARRAY" isEqualToString:operationName])
        {
            NSString* key = operationDescription[@"key"] ;
            id value = operationDescription[@"value"];
            if ([value isKindOfClass:[NSString class]]) {
                [editor removeItemFromStringArrayAttribute:value forKey:key error:nil];
            } else if ([value isKindOfClass:[NSArray class]]) {
                for (NSString *item in value) {
                    [editor removeItemFromStringArrayAttribute:item forKey:key error:nil];
                }
            }
        }
    }
    [editor save];
}

+ (void)trackEvent:(NSDictionary*)params
{
    if (!params || [params count]==0)
    {
        [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for user.track.event"];
    }

    NSString *name = params[@"name"];
    NSDictionary *data = params[@"event_data"];

    if (![name isKindOfClass:[NSString class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"name should be a string"];
    }

    BatchEventAttributes *batchEventAttributes = nil;

    if ([data isKindOfClass:[NSDictionary class]]) {
        batchEventAttributes = [BatchBridgeUtils convertSerializedEventDataToEventAttributes:data];

        NSError *err;
        [batchEventAttributes validateWithError:&err];
        if (batchEventAttributes != nil && err == nil) {
            [BatchProfile trackEventWithName:name attributes:batchEventAttributes];
            //resolve([NSNull null]);
        } else {
            [NSException raise:INVALID_PARAMETER format:@"Event attributes validation failed"];
            //reject(@"BatchBridgeError", @"Event attributes validation failed:", err);
        }
        return;
    }
    [BatchProfile trackEventWithName:name attributes:batchEventAttributes];
}

+ (void)trackLocation:(NSDictionary*)params
{
    if (!params || [params count]==0)
    {
        [NSException raise:INVALID_PARAMETER format:@"Empty or null parameters for action user.track.location"];
    }

    NSNumber *latitude = params[@"latitude"];
    NSNumber *longitude = params[@"longitude"];
    NSNumber *date = params[@"date"]; // MS
    NSNumber *precision = params[@"precision"];

    if (![latitude isKindOfClass:[NSNumber class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"latitude should be a string"];
    }

    if (![longitude isKindOfClass:[NSNumber class]])
    {
        [NSException raise:INVALID_PARAMETER format:@"longitude should be a string"];
    }

    NSTimeInterval ts = 0;

    if (date)
    {
        if ([date isKindOfClass:[NSNumber class]]) {
            ts = [date doubleValue] / 1000.0;
        } else {
            [NSException raise:INVALID_PARAMETER format:@"date should be an object or undefined"];
        }
    }

    NSDate *parsedDate = ts != 0 ? [NSDate dateWithTimeIntervalSince1970:ts] : [NSDate date];

    NSInteger parsedPrecision = 0;
    if (precision)
    {
        if ([precision isKindOfClass:[NSNumber class]]) {
            parsedPrecision = [precision integerValue];
        } else {
            [NSException raise:INVALID_PARAMETER format:@"precision should be an object or undefined"];
        }
    }

    [BatchProfile trackLocation:[[CLLocation alloc] initWithCoordinate:CLLocationCoordinate2DMake([latitude doubleValue], [longitude doubleValue])
                                                           altitude:0
                                                 horizontalAccuracy:parsedPrecision
                                                   verticalAccuracy:-1
                                                             course:0
                                                              speed:0
                                                          timestamp:parsedDate]];
}

@end
