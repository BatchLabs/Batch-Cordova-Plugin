#import <Foundation/Foundation.h>

#import "BACSimplePromise.h"

@interface BatchProfileBridge : NSObject

+ (void)identify:(NSDictionary*)params;
+ (void)editAttributes:(NSDictionary*)params;
+ (NSString*)trackEvent:(NSDictionary*)params;
+ (void)trackLocation:(NSDictionary*)params;

@end
