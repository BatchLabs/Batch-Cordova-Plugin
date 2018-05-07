//  https://batch.com
//  Copyright (c) 2018 Batch SDK. All rights reserved.

#import <Foundation/Foundation.h>

@interface BACSimplePromise<ObjectType: NSObject*> : NSObject

+ (nonnull instancetype)resolved:(nullable ObjectType)value;

- (void)resolve:(nullable ObjectType)value;

- (void)then:(void (^_Nonnull)(ObjectType _Nullable value))thenBlock;

@end
