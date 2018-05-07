//
//  BatchJSONHelper.m
//  bridge
//
//  https://batch.com
//  Copyright (c) 2014 Batch SDK. All rights reserved.
//
//

#import "BatchJSONHelper.h"

@implementation BatchJSONHelper

// Convert an object into it's JSON string representation.
+ (NSString *)JSONStringFromObject:(id)object
{
    if (![NSJSONSerialization isValidJSONObject:object])
    {
        return nil;
    }
    
    NSString *serializedString = nil;
    @try
    {
        NSData *serializedData = [NSJSONSerialization dataWithJSONObject:object options:0 error:nil];
        
        serializedString = [[NSString alloc] initWithData:serializedData encoding:NSUTF8StringEncoding];
    }
    @catch (NSException *e)
    {
        NSLog(@"[BatchBridge] %@", e.reason);
    }
    
    return serializedString;
}

// Convert a JSON string representation into an object.
+ (id)objectFromJSONString:(NSString *)string
{
    NSError *error = nil;
    id object = [NSJSONSerialization JSONObjectWithData:[string dataUsingEncoding:NSUTF8StringEncoding] options:NSJSONReadingMutableContainers error:&error];
    
    if (!object || error!=nil)
    {
        return nil;
    }
    
    return object;
}

@end
