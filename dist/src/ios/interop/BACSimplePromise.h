//  https://batch.com
//  Copyright (c) 2018 Batch SDK. All rights reserved.

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSUInteger, BACSimplePromiseStatus) {
    BACSimplePromiseStatusPending,
    BACSimplePromiseStatusResolved,
    BACSimplePromiseStatusRejected,
};

@interface BACSimplePromise<ObjectType: NSObject*> : NSObject

@property BACSimplePromiseStatus status;

+ (nonnull instancetype)resolved:(nullable ObjectType)value;

+ (nonnull instancetype)rejected:(nullable NSError*)error;

- (void)resolve:(nullable ObjectType)value;

- (void)reject:(nullable NSError*)error;

- (void)then:(void (^_Nonnull)(ObjectType _Nullable value))thenBlock;

- (void)catch:(void (^_Nonnull)(NSError* _Nullable ))catchBlock;

@end
