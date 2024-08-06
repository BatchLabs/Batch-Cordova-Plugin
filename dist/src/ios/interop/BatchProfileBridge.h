#import <Foundation/Foundation.h>

#import "BACSimplePromise.h"

@interface BatchProfileBridge : NSObject

+ (void)editAttributes:(NSDictionary*)params;
+ (NSString*)trackEvent:(NSDictionary*)params;
+ (void)trackLocation:(NSDictionary*)params;

@end
