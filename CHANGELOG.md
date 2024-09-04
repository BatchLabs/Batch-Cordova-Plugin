Batch Cordova Plugin

## 6.0.0

This is a major release, please see our [migration guide](https://doc.batch.com/cordova/advanced/5x-migration/) for more info on how to update your current Batch implementation.

**Plugin**
* Updated Batch to 2.0. For more information see the [ios](https://doc.batch.com/ios/sdk-changelog/#2_0_0) and [android](https://doc.batch.com/android/sdk-changelog/#2_0_0) changelog .
* Batch requires iOS 13.0 or higher.
* Batch requires a `minSdk` level of 21 or higher.

**Core**
- Added method `isOptedOut` to checks whether Batch has been opted out from or not.
- Added method `setFindMyInstallationEnabled` to set whether Batch should enable the FindMyInstallation feature or not.
- Added method `updateAutomaticDataCollection` to fine-tune the data you authorize to be tracked by Batch.
- Removed `canUseAdvertisingIdentifier` property from `Config`.
- Added `migrations` property to `Config` to update the profile migrations related configuration. See our documentation for info.
- Fixed an issue where opened push with deeplink was not tracked as direct open on a cold start.

**User**
- Removed method `trackTransaction` with no equivalent.
- Removed method `batch.user.editor` and the related class `BatchUserDataEditor`, you should now use `batch.profile.editor` which return an instance of `BatchProfileAttributeEditor`.
- Added method `clearInstallationData` which allows you to remove the installation data without modifying the current profile.

**Event**

This version introduced two new types of attribute that can be attached to an event : Array and Object.

- Removed `trackEvent` APIs from the user module. You should now use `batch.profile.trackEvent`.
- `BatchEventData` has been renamed into `BatchEventAttributes`.
- Removed `addTag` API from `BatchEventData` You should now use the `$tags` key with `put` method.
- Removed parameter `label` from `trackEvent` API. You should now use the `$label` key in `BatchEventAttributes` with the `put` method.
- Added support for values of type: Array and Object to the `put` method.

**Profile**

Introduced `batch.profile`, a new module that enables interacting with profiles. Its functionality replaces most of BatchUser used to do.

- Added `identify` API as replacement of `batch.user.getEditor().setIdentifier`.
- Added `getEditor` method to get a new instance of a `BatchProfileAttributeEditor` as replacement of `BatchUserEditor`.
- Added `trackEvent` API as replacement of the `batch.user.trackEvent` methods.
- Added `trackLocation` API as replacement of the `batch.user.trackLocation` method.

## 5.4.0

**Plugin**

* Updated Batch 1.21.
* Batch requires iOS 12.0 or higher.
* Batch now compiles with and targets SDK 34 (Android 14).

**User**

* Removed automatic collection of the advertising id. You need to collect it from your side and pass it to Batch via the added `batch.user.getEditor().setAttributionIdentifier(id)` method.
* Added `setEmail` method to `BatchUserDataEditor`. This requires to have a user identifier registered or to call the `setIdentifier` method on the editor instance beforehand.
* Added `setEmailMarketingSubscriptionState` method to `BatchUserDataEditor`.

**Inbox**

* Added `hasLandingMessage` property to `InboxNotification`.
* Added `displayNotificationLandingMessage` method to `InboxFetcher`.

## 5.3.2

**iOS**

* Fix an issue where `BatchBridgeNotificationCenterDelegate`'s automatic setup might result in an infinite loop on notification open.

## 5.3.1

**iOS**

* Fix `BatchBridgeNotificationCenterDelegate.automaticallyRegister` not being honored.
* Add compatibility for Capacitor 4.6: Batch's delegate now tries to register itself at a later time to keep compatibility with Capacitor's push plugins and Batch's features at the same time.

## 5.3.0

**Plugin**

Updated Batch to 1.19.2. Bumping your Android project's compileSdkVersion to 33 might be required. Xcode 13.3 required if your project uses bitcode.

**Push**

* Added Android implementation of the `batch.push.requestNotificationAuthorization()` API. This allows you to request for the [new notification permission introduced](https://developer.android.com/about/versions/13/changes/notification-permission) in Android 13. See the documentation for more info.

## 5.2.0

**Plugin**

- Updated Batch native SDKs to 1.19.1.
  Android requires SDK 32 to compile.
  Xcode 13.3 is required if you use bitcode.

**Inbox**

- Silent notifications are now filtered from the inbox on both platforms.

## 5.1.0

**Plugin**

- Updated Batch native SDKs to 1.18.1.

**User**

- Added support for the URL attribute and event data type.

## 5.0.1

**iOS**

- Fix an issue where the plugin could not be built in some environments due to `BatchUserBridge.h`.

## 5.0.0

**Core**

- **Breaking change**: Fixed an issue where on iOS, the push payload of the `batchPushReceived` event was under the `payload` key. It is now at the root of the event data, just like 2.x and on Android.
- Batch Cordova now requires some ES2015 APIs such as promises. 

**Push**

- iOS: Deprecated `registerForRemoteNotifications` by splitting it into two methods:  
    - `refreshToken`, which should be called on every app start.
    - `requestNotificationAuthorization`, which should be called whenever you want to ask the user the permission to display notifications.
- iOS: Added `requestProvisionalNotificationAuthorization` to request a provisional authorization on iOS 11 and higher.
- iOS: Calling `setiOSShowForegroundNotifications()` under Capacitor now works as expected.
  It works by disabling Capacitor's control of the notification presentation (but Capacitor is still informed of notification events).
  Not calling this method preserves Capacitor's handling, which can be configured using `@capacitor/push-notifications`.
- `getLastKnownPushToken()` now returns a `Promise` rather than taking a callback as a parameter.

**Inbox**

- The Inbox module has been fully rewritten to reach feature parity with the native SDKs:
  - `batch.inbox.getFetcherForInstallation()` and `batch.inbox.getFetcherForUser()` now return objects that are used to interact with the inbox.
  - Marking a notification as read, deleted or marking all notifications as read is now supported.
  - Fetching multiple pages is now supported.
  - Inbox page size and the limit of notifications to fetch are now configurable.

The new fetcher objects MUST be disposed by calling `.dispose()` once you are finished with them to free up memory.  
See documentation for more info about migrating to the new Inbox API.  

**User**

- `getInstallationID()` now returns a `Promise` rather than taking a callback as a parameter. The promise's result can be undefinied if the Installation ID is unavailable.
- Added getters for `language`/`region` and `identifier` in `batch.user`.

## 4.0.0

**Plugin**

- Changed the Plugin ID from `com.batch.cordova` to `@batch.com/cordova-plugin`. This fixes an issue where `cordova prepare` would reinstall an older version of the plugin if the plugins folder was missing.  
  Cordova users: when updating please remove the old plugin via `cordova plugin remove com.batch.cordova`, then install the new one.  
  Ionic Capacitor users: Nothing needs to be done as Capacitor integrates with NPM and the package.json natively.

**Android**

- Android 12 compatibility: Added explicit `android:exported` values to the manifest entries added by the plugin.

## 3.0.1

**Plugin**

- Make typescript definition importable, adding type information to the global `batch` object.
  To import it, add: `import type {} from '@batch.com/cordova-plugin';`.

## 3.0.0

This is a major release with breaking changes. Please see the [migration guide](https://doc.batch.com/cordova/advanced/2x-migration) for more info.

**Plugin**

- Renamed the plugin to `@batch.com/cordova-plugin`. It's cordova internal name is still `com.batch.cordova` due to cordova limitations.  
  The plugin cordova name is used when managing plugins after installation. 
- Updated plugin for recent Cordova/Ionic versions.  
  Batch Cordova's new version requirements are:
  - iOS >= 10.0
  - Android >= 5.0 (API 21)
  - Cordova CLI >= 9.0.0
  - Ionic CLI (if used) >= 6.0.0
  - cordova-android >= 9.0.0
  - cordova-iOS >= 6.0.0
- Updated native Batch SDK to 1.17.0.  
  Native SDK version can be configured using the `BATCHSDK_ANDROID_VERSION` and `BATCHSDK_IOS_VERSION` preferences.  
  Please note that this version of the plugin will not work with earlier native Batch SDK versions.
- Added Ionic Capacitor support. Requires Capacitor 2.4 or higher.
- Fixed an issue where Cordova/Ionic would not properly write the required AndroidManifest lines.
- Added support for dates in event data.
- Removed event data tags/attributes limits from the Cordova plugin.  
  This does not mean that those limits are gone, but that the native SDK will now enforce them so that the plugin doesn't have to be updated if and then these limits change.  
  Current native limits are 15 attributes and 10 tags.

**Android**

- The plugin requires AndroidX to be enabled in your `config.xml` using `<preference name="AndroidXEnabled" value="true" />` (Cordova only).  
  Ionic users will need to add `cordova-plugin-androidx-adapter`.
- The plugin doesn't depend on Firebase and appcompat anymore. Batch expects androidx.appcompat and Firebase Cloud Messaging to be in your application.  
  This can be setup using the Firebase plugin of your choice:  
   - We recommend `cordova-plugin-firebase-messaging` for Cordova.  
     If you do not want to add Firebase to your iOS app, manual FCM integration steps are available in our integration documentation.
   - Capacitor comes with appcompat and FCM support out of the box, no extra plugin is needed.

  You will also be required to configure your `google-services.json` manually: this is described in the integration documentation and should be covered by your Firebase plugin's documentation.

**iOS**

- The native SDK isn't bundled anymore: Cocoapods is now used to integrate Batch's native component.
- The plugin now automatically sets a UNUserNotificationCenterDelegate to handle new iOS features.  
  This enables configuration of foreground push behaviour: they can now be displayed in an alert just like if the user was outside of the application.
  It can be disabled by calling `BatchBridgeNotificationCenterDelegate.automaticallyRegister = false` as soon as possible in `application:didFinishLaunchingWithOptions:`.
- Fixed a bug where notification opens on cold start would not work.
- Fixed multiple mobile landings related bugs.
- Fixed multiple `batchPushReceived` related bugs.
- Fixed an issue where boolean custom data was saved as integers.

## 3.0.0-beta.2

Rerelease of 3.0.0-beta.1, fixing a NPM packaging issue.

## 3.0.0-beta.1

This is a major release with breaking changes. Please see the [migration guide](https://doc.batch.com/cordova/advanced/2x-migration) for more info.

**Plugin**

- Renamed the plugin to `@batch.com/cordova-plugin`. It's cordova internal name is still `com.batch.cordova` due to cordova limitations.  
  The plugin cordova name is used when managing plugins after installation. 
- Updated plugin for recent Cordova/Ionic versions.  
  Batch Cordova's new version requirements are:
  - iOS >= 10.0
  - Android >= 5.0 (API 21)
  - Cordova CLI >= 9.0.0
  - Ionic CLI (if used) >= 6.0.0
  - cordova-android >= 9.0.0
  - cordova-iOS >= 6.0.0
- Updated native Batch SDK to 1.17.0.  
  Native SDK version can be configured using the `BATCHSDK_ANDROID_VERSION` and `BATCHSDK_IOS_VERSION` preferences.  
  Please note that this version of the plugin will not work with earlier native Batch SDK versions.
- Added Ionic Capacitor support. Requires Capacitor 2.4 or higher.
- Fixed an issue where Cordova/Ionic would not properly write the required AndroidManifest lines.

**Android**

- The plugin requires AndroidX to be enabled in your `config.xml` using `<preference name="AndroidXEnabled" value="true" />` (Cordova only).  
  Ionic users will need to add `cordova-plugin-androidx-adapter`.
- The plugin doesn't depend on Firebase and appcompat anymore. Batch expects androidx.appcompat and Firebase Cloud Messaging to be in your application.  
  This can be setup using the Firebase plugin of your choice:  
   - We recommend `cordova-plugin-firebase-messaging` for Cordova.  
     If you do not want to add Firebase to your iOS app, manual FCM integration steps are available in our integration documentation.
   - Capacitor comes with appcompat and FCM support out of the box, no extra plugin is needed.

  You will also be required to configure your `google-services.json` manually: this is described in the integration documentation and should be covered by your Firebase plugin's documentation.

**iOS**

- The native SDK isn't bundled anymore: Cocoapods is now used to integrate Batch's native component.
- The plugin now automatically sets a UNUserNotificationCenterDelegate to handle new iOS features.  
  This enables configuration of foreground push behaviour: they can now be displayed in an alert just like if the user was outside of the application.
  It can be disabled by calling `BatchBridgeNotificationCenterDelegate.automaticallyRegister = false` as soon as possible in `application:didFinishLaunchingWithOptions:`.
- Fixed a bug where notification opens on cold start would not work.
- Fixed multiple mobile landings related bugs.
- Fixed multiple `batchPushReceived` related bugs.
- Fixed an issue where boolean custom data was saved as integers.

## 2.3.2/2.3.3

- Hotfix: Lock the firebase versions to ones that work without androidx or compileSdkVersion 28  
  If your app requires newer firebase dependencies, please stick to 2.3.1 in the meantime  
  NOTE: The 2.x branch is the final one that comes with Firebase dependencies. 3.x will require you to manage them yourselves.

## 2.3.1

- Lock the native SDK version to 1.13 due to complications regarding Cordova and the Java 8 sourcelevel

## 2.3.0

- Added a way to disable Firebase configuration extraction, using a variable:  
  Use `cordova plugin add com.batch.cordova --variable BATCHSDK_ENABLE_ANDROID_BUILTIN_FIREBASE_CONFIG=false` if you run into issues when using this plugin.
- Fix an issue where trackTransaction did not work with integers on Android
- Fix an issue where the SDK would fail if a developer removed console.log or console.debug

## 2.2.0

This update adresses a compatibility issue with `cordova-plugin-firebase`, that added conflicting ressources to the APK.

**Important note:** This brings the minimul `cordova-plugin-firebase` version Batch is compatible with to 2.0.4. This _can_ be a breaking change.

## 2.1.0

**Events**

Event data support has been overhauled. As a result:

- Introduced `BatchEventData`. Use this class to attach attributes and tags to an event. See this class' documentation (available in index.d.ts) for more information about limits.
- `batch.user.trackEvent(name: string, label: string, data: {})` has been deprecated

* Calls to this method will log deprecation warnings in the console
* Legacy data (plain JS object) will be converted to `BatchEventData`. Same data format restrictions apply: Any key/value entry that can't be converted will be ignored, and logged. Tags are not supported.

- Introduced `Batch.User.trackEvent(name: string, label: string, data: BatchEventData)`, replacing the deprecated method.

More info in the [event documentation](/doc/cordova/custom-data/custom-events.html#_event-data).

## 2.0.6

_Android_

Remove duplicated dependencies in plugin.xml: this completes the fix introduced in 2.0.4

## 2.0.5

Re-release 2.0.4 with the right version number in plugin.xml

## 2.0.4

_Android_

Remove explicit dependency on "play-services-ads".  
This may cause your application to stop giving Batch your users' Advertising ID.  
To restore this functionality, please use a 3rd party plugin (or a gradle file) to add firebase-analytics to your app.  
Doing so may require you to add a privacy policy to your app to stay in compliance with Play Store rules.

## 2.0.3

- Fix an issue where Batch User editor's `setIdentifier`, `setLanguage` and `setRegion` did not accept null values

## 2.0.2

- The plugin's Android hook now checks for `cordova-plugin-firebase` and tweaks its behaviour accordingly to prevent conflicts

## 2.0.1

- Fixed an issue where iOS might not return the expected value in async calls
- Implemented Inbox on iOS

## 2.0.0

Rewrote the plugin:

- Native code is now included in the open-source repository, meaning that 3rd party developers can update the underlying native SDKs directly.
- Plugin is fully definied in a typescript definition, improving documentation readability and Ionic support
- Plugin is now testable
- Cordova-plugin's versioning system will now differ from the native SDK versioning

Cordova 8 compatibility. **Note: Users of earlier versions of cordova will have to downgrade to 1.7.4**

Updated native SDKs to 1.12.0

Android now uses FCM to register for notifications: setGCMSenderId has been removed, and you will need to generate a `google-services.json` file to keep push notifications.

## 1.7.4

Update native SDKs to the latest version
The plugin now depends on the appcompat-v7 library on Android
Added support for Mobile Landings
Added a "hasMobileLanding" property in the push event, so you can avoid doing some actions on a push that already displayed a mobile landing

## 1.7.2

Update native SDKs to 1.7  
Added the ability to turn on foreground push delivery on Android (rather than delivering them in the notification center) to match iOS' behaviour.  
The plugin now depends on the support-v4 library

## 1.5.3

Update native SDKs to 1.5.3

## 1.5

Update native SDKs to 1.5
Custom user data (attributes, tags and events)
Added an API to retrieve Batch's unique installation identifier
Deprecated BatchUserProfile
Added ability to start Batch in a service

## 1.4

Update native SDKs to 1.4
iOS 9 and bitcode support

## 1.3.3 Beta 3

Batch Push has a new method to allow you to get the last known push token

## 1.3.3 Beta 2

Updated native sdks to 1.3.3 (prerelease)

Batch Push is now fully available:

- It is now possible to read the notification payload in your JS code
- Setting the wanted notification types is supported

Added Batch Unlock

## 1.3.2 Beta 1

Initial release
