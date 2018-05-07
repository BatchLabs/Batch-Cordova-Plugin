![Batch Logo](https://raw.github.com/BatchLabs/cordova-plugin/master/readme/readme_logo.png)

# Batch Cordova Plugin Builder

[![npm version](https://badge.fury.io/js/com.batch.cordova.svg)](https://badge.fury.io/js/com.batch.cordova)

Welcome to Batch's Cordova Plugin!

This repository contains the plugin's source code (native code + cordova) and buildscripts.

A test application project is _not_ provided.

## Compatibility

This plugin is compatible with:

* cordova 8.0.+
* cordova-android 7.0.0+
* cordova-ios 4.5.0+

Subsequent major Cordova and Cordova platform versions are _not_ supported until told otherwise.

If you use an earlier version of Cordova, please use the 1.7.4 version of this plugin.

> Note: Batch isn't supported in the browser. It will only work correctly when running on Android or iOS.

## How do I install the plugin?

Simply add our plugin from npm:

```
cordova plugin add com.batch.cordova
```

A `batch` object will be present on the window. Its methods and modules are documented in `types/index.d.ts`

Our [official documentation](https://batch.com/doc/cordova/sdk-integration/initial-setup.html) will walk you through the integration process, describing how to perform a successful integration of both required and optional plugin features.

# Development

If you're reading this, you're probably interested in how to cha
This section will cover the location of the various files and how to build/test your changes.

## Folder architecture

This folder is actually the plugin's source and builder, but not the plugin itself.  
Here is a quick overview of the different folders:

* `__mocks__`: jest global mocks
* `__tests__`: jest unit tests
* `dist`: Plugin's actual directory. This is the one published to npm, and the one you will want to add to your project once modified.
  * `dist/scripts`: After-prepare script that pulls Firebase keys from `google-services.json` on Android
  * `dist/src/android`: Android native component
  * `dist/src/ios`: iOS native component
  * `dist/www`: Built plugin javascript. Do not edit this directly.
* `src`: Plugin's source.
* `types`: Plugin's type definition. This is where the plugin's public API is defined. Plugin's implementations (mobile and stub) both implement the interfaces defined in this folder.

## How it works

The plugin's public API is defined by Typescript type definitions in `types`.  
It is then implemented, in Typescript of course, in the src folder.  
Currently, two implementations of the SDK exist:

* Native, used on Android/iOS: this one is the real deal.
* Stub, used on unsupported platforms: as the name implies, it does absolutely nothing but prevents your code from throwing errors.

The plugin converts Javascript API calls to a JSON-based message format unifying both platforms, and then forwards it to the native part using cordova APIs.

Messages are interpreted by BatchCordovaPlugin and processed using what is called the "Bridge": the native implementation of the standardized JSON-based message format.

Once the Javascript side of the plugin called the native once, a two way communication bridge is established which allows the native code to tell the Javascript plugin about various SDK events, such as received push messages or in-app messaging events.

## Working on the plugin

Before changing anything, you will have to install the required modules by running:

```
yarn
```

> Note: `npm install` could also be used, but not advised as this plugin uses yarn.

Files are formatted using Prettier, and linted with TSLint.  
While you should install these plugins for your favorite code editor, you can manually lint the plugin:

```
yarn lint
```

You can then test your changes using:

```
yarn test
```

Finally, once you're done and want to test in your application, you will need to build `dist/www/batch.js`:

```
yarn build
```

That's it! Happy hacking!

## Updating the native SDKs

Updating the native SDKs can be done by simply using the officially release native ones:

* Android: The plugin uses gradle. Simply open `dist/src/android/batch.gradle` and tweak the `'com.batch.android:batch-sdk` version line.
* iOS: The plugin ships the iOS framework. Open `dist/src/ios/` and replace `Batch.framework` with [the one you've downloaded](https://batch.com/download).

## Applying the changes to a local project

Since you've locally modified this project, you won't be able to publish it on npm.
Thus, you'll have to manually add it to your project, using the cordova CLI:

```
cordova plugin rm com.batch.cordova
cordova plugin add <path to where you checked out cordova-plugin>/dist --nofetch
```

If you altered anything in `src/`, make sure you build the plugin beforehand.

# License

See `LICENSE` file. (Spoiler: it's MIT)
