export enum Core {
  SetConfig = "setConfig",
  Start = "start",
  OptIn = "optIn",
  OptOut = "optOut",
  OptOutWipeData = "optOutAndWipeData",
}

export enum Push {
  GetLastKnownPushToken = "push.getLastKnownPushToken",
  SetIOSShowForegroundNotifications = "push.setIOSShowForegroundNotifications",
  SetIOSNotifTypes = "push.setIOSNotifTypes",
  SetAndroidNotifTypes = "push.setAndroidNotifTypes",
  Register = "push.register",
  DismissNotifications = "push.dismissNotifications",
  ClearBadge = "push.clearBadge",
  RefreshToken = "push.iOS.refreshToken",
  RequestAuthorization = "push.requestAuthorization",
  RequestProvisionalAuthorization = "push.iOS.requestProvisionalAuthorization",
}

export enum Messaging {
  SetDoNotDisturbEnabled = "messaging.setDoNotDisturbEnabled",
  ShowPendingMessage = "messaging.showPendingMessage",
}

export enum Inbox {
  CreateInstallationFetcher = "inbox.createInstallationFetcher",
  CreateUserFetcher = "inbox.createUserFetcher",
  GetFetchedNotifications = "inbox.getFetchedNotifications",
  FetchNewNotifications = "inbox.fetchNewNotifications",
  FetchNextPage = "inbox.fetchNextPage",
  MarkAsRead = "inbox.markAsRead",
  MarkAllAsRead = "inbox.markAllAsRead",
  MarkAsDeleted = "inbox.markAsDeleted",
  DisplayLandingMessage = "inbox.displayLandingMessage",
  ReleaseFetcher = "inbox.releaseFetcher",
}

export enum User {
  GetInstallationID = "user.getInstallationID",
  GetLanguage = "user.getLanguage",
  GetRegion = "user.getRegion",
  GetIdentifier = "user.getIdentifier",
  FetchAttributes = "user.fetch.attributes",
  FetchTags = "user.fetch.tags",
}

export enum Profile {
    Edit = "profile.edit",
    Identify = "profile.identify",
    TrackEvent = "profile.track.event",
    TrackLocation = "profile.track.location",
}

export enum ProfileAttributeOperation {
  SetLanguage = "SET_LANGUAGE",
  SetRegion = "SET_REGION",
  SetEmail = "SET_EMAIL_ADDRESS",
  SetEmailMarketingSubscription = "SET_EMAIL_MARKETING_SUB",
  SetAttribute = "SET_ATTRIBUTE",
  RemoveAttribute = "REMOVE_ATTRIBUTE",
  AddToArray = "ADD_TO_ARRAY",
  RemoveFromArray = "REMOVE_FROM_ARRAY",
}

export enum Internal {
  SetupCallback = "_setupCallback",
}
