const Platform = {
  Android: "android",
  iOS: "ios",
  isCurrent: (platform: string) => {
    return cordova.platformId.toLowerCase() === platform;
  },
};

export default Platform;
