<img src="https://static.batch.com/documentation/Readmes/logo_batch_full_178@2x.png" srcset="https://static.batch.com/documentation/Readmes/logo_batch_full_178.png 1x" width="178" height="68" alt="Batch Logo" />

# Batch Cordova Plugin

[![npm version](https://badge.fury.io/js/com.batch.cordova.svg)](https://badge.fury.io/js/com.batch.cordova)

Welcome to Batch's Cordova Plugin!

This repository contains the plugin's source code (native code + cordova) and buildscripts.

## Compatibility

### Cordova

This plugin is compatible with:

- cordova 9.0.0+
- cordova-android 9.0.0+
- cordova-ios 6.0.0+

Subsequent major Cordova and Cordova platform versions are _not_ supported until told otherwise.

If you use an earlier version of Cordova, please use the 1.7.4 or 2.X version of this plugin.

> Note: Batch isn't supported in the browser. It will only work correctly when running on Android or iOS.

### Ionic

Batch requires Ionic CLI 6.0 and Capacitor 2.4 or newer.

If you're using Ionic with Cordova, cordova version requirements apply.

## How do I install the plugin?

Simply add our plugin from npm:

```
cordova plugin add @batch.com/cordova-plugin
```

Ionic Capacitor:
```
npm i @batch.com/cordova-plugin
npx cap sync
```

A `batch` object will be present on the window. Its methods and modules are documented in `types/index.d.ts`

Our [official documentation](https://batch.com/doc/cordova/sdk-integration/initial-setup.html) will walk you through the integration process, describing how to perform a successful integration of both required and optional plugin features.

# Development

If you're reading this, you're probably interested in how to tweak the code.
This section will cover the location of the various files and how to build/test your changes.

## Folder architecture

This folder is actually the plugin's source and builder, but not the plugin itself.  
Here is a quick overview of the different folders:

- `__mocks__`: jest global mocks
- `__tests__`: jest unit tests
- `dist`: Plugin's actual directory. This is the one published to npm, and the one you will want to add to your project once modified.
  - `dist/scripts`: After-prepare script that pulls Firebase keys from `google-services.json` on Android
  - `dist/src/android`: Android native component
  - `dist/src/ios`: iOS native component
  - `dist/www`: Built plugin javascript. Do not edit this directly.
- `src`: Plugin's source.
- `types`: Plugin's type definition. This is where the plugin's public API is defined. Plugin's implementations (mobile and stub) both implement the interfaces defined in this folder.

## How it works

The plugin's public API is defined by Typescript type definitions in `types`.  
It is then implemented, in Typescript of course, in the src folder.  
Currently, two implementations of the SDK exist:

- Native, used on Android/iOS: this one is the real deal.
- Stub, used on unsupported platforms: as the name implies, it does absolutely nothing but prevents your code from throwing errors.

The plugin converts Javascript API calls to a JSON-based message format unifying both platforms, and then forwards it to the native part using cordova APIs.

Messages are interpreted by BatchCordovaPlugin and processed using what is called the "Bridge": the native implementation of the standardized JSON-based message format.

Once the Javascript side of the plugin called the native once, a two way communication bridge is established which allows the native code to tell the Javascript plugin about various SDK events, such as received push messages or in-app messaging events.

## Working on the plugin

Before changing anything, you will have to install the required modules by running:

```
npm i
```

> Note: `npm install` could also be used, but not advised as this plugin uses yarn.

Files are formatted using Prettier, and linted with ESLint.  
While you should install these plugins for your favorite code editor, you can manually lint the plugin:

```
npm run lint
```

You can then test your changes using:

```
npm run test
```

Finally, once you're done and want to test in your application, you will need to build `dist/www/batch.js`:

```
npm run build
```

Then, link the plugin to your test application. This only needs to be done once.  
```bash
cordova plugin add ../<relative path to where you cloned this repository>/Batch-Cordova-Plugin/dist/ --link

# Ionic users:
npm link ../<path to where you checked out the plugin>/dist
```

That's it! Happy hacking!

## Applying the changes to a local project

Since you've locally modified this project, you won't be able to publish it on npm.
Thus, you'll have to manually add it to your project, using the cordova CLI:

```
cordova plugin rm com.batch.cordova
cordova plugin add <path to where you checked out cordova-plugin>/dist --nofetch
```

Make sure you build the plugin beforehand, no prebuilt is commited to git.

# License

MIT. See `LICENSE` file.
