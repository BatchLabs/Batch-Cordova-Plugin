const Platform = {
  Android: "android",
  iOS: "ios",
  isCurrent: (platform: string): boolean => {
    return cordova.platformId.toLowerCase() === platform;
  },
};

export default Platform;
