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

+ (nonnull instancetype)sharedInboxBridge;

- (nullable BACSimplePromise<NSString*> *)doAction:(nonnull NSString *)action
                                    withParameters:(nonnull NSDictionary *)parameters;

@end
