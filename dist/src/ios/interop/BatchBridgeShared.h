// Defines that are useful anywhere in the plugin

#define BATCH_INIT_AND_BLANK_ERROR_IF_NEEDED(error) \
if (error == NULL) {\
    __autoreleasing NSError *fakeOutErr;\
    error = &fakeOutErr;\
}\
*error = nil;