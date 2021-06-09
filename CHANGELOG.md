Batch Cordova Plugin

## UPCOMING

**User**
- Added support for dates in event data.

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
