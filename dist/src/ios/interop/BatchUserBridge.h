#import <Foundation/Foundation.h>

#import "BACSimplePromise.h"

@interface BatchUserBridge : NSObject

+ (nullable BACSimplePromise<NSObject*> *)fetchAttributes;
+ (nullable BACSimplePromise<NSObject*> *)fetchTags;

@end
