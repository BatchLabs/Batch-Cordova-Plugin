export enum Core {
  SetConfig = "setConfig",
  Start = "start",
  OptIn = "optIn",
  OptOut = "optOut",
  OptOutWipeData = "optOutAndWipeData"
}

export enum Push {
  GetLastKnownPushToken = "push.getLastKnownPushToken",
  SetIOSNotifTypes = "push.setIOSNotifTypes",
  SetAndroidNotifTypes = "push.setAndroidNotifTypes",
  Register = "push.register",
  DismissNotifications = "push.dismissNotifications",
  ClearBadge = "push.clearBadge"
}

export enum Messaging {
  SetDoNotDisturbEnabled = "messaging.setDoNotDisturbEnabled",
  ShowPendingMessage = "messaging.showPendingMessage"
}

export enum Inbox {
  Fetch = "inbox.fetch",
  FetchForUserID = "inbox.fetchForUserIdentifier"
}

export enum User {
  Edit = "user.edit",
  TrackEvent = "user.track.event",
  TrackLegacyEvent = "user.track.legacy_event",
  TrackTransaction = "user.track.transaction",
  TrackLocation = "user.track.location",
  DataDebug = "user.data.debug",
  GetInstallationID = "user.getInstallationID"
}

export enum UserDataOperation {
  SetLanguage = "SET_LANGUAGE",
  SetRegion = "SET_REGION",
  SetIdentifier = "SET_IDENTIFIER",
  SetAttribute = "SET_ATTRIBUTE",
  RemoveAttribute = "REMOVE_ATTRIBUTE",
  ClearAttribute = "CLEAR_ATTRIBUTES",
  AddTag = "ADD_TAG",
  RemoveTag = "REMOVE_TAG",
  ClearTags = "CLEAR_TAGS",
  ClearTagCollection = "CLEAR_TAG_COLLECTION"
}

export enum Internal {
  SetupCallback = "_setupCallback"
}
