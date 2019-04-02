#!/usr/bin/env node
// @tscheck
"use strict";

// This hook copies configuration options from google-services.json into string resources
// It basically does _part of_ what the Goolge Services gradle plugin does, since cordova
// does not allow plugins to edit the root build.gradle

function log(message) {
  console.log("Batch - " + message);
}

function logE(message) {
  console.log("Batch - Error: " + message);
}

function folderExists(fs, path) {
  try {
    return fs.statSync(path, fs.F_OK).isDirectory();
  } catch (ignored) {}
  return false;
}

function makeAndroidStringEntry(key, value) {
  // XML escaping isn't supported
  return '\n<string name="' + key + '">' + (value || "error") + "</string>";
}

function extractGoogleServicesConfig(cordovaContext) {
  const fs = require("fs");
  const path = require("path");

  const projectRoot = cordovaContext.opts.projectRoot;
  const baseFolder = path.join(projectRoot, "platforms/android");
  const stringsPath = path.join(
    baseFolder,
    "/app/src/main/res/values/strings-batchfcm.xml"
  );

  if (!folderExists(fs, baseFolder)) {
    logE("Could not find Android platform folder.");
    return;
  }

  try {
    const googleServicesConfig = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "google-services.json")).toString()
    );

    // arnesson/cordova-plugin-firebase compatibility
    const compatMode = hasPlugin(cordovaContext, "cordova-plugin-firebase");
    if (compatMode) {
      log("cordova-plugin-firebase detected: using compatibility mode");
    }

    // For simplicity (and also because we don't have the Android package in the cordova context), use the first client
    const apiKey = googleServicesConfig.client[0].api_key[0].current_key;
    const appId = googleServicesConfig.client[0].client_info.mobilesdk_app_id;
    const senderId = googleServicesConfig.project_info.project_number;
    const projectId = googleServicesConfig.project_info.project_id;

    var stringsXML = "<?xml version='1.0' encoding='utf-8'?>\n<resources>";

    if (!compatMode) {
      stringsXML +=
        makeAndroidStringEntry("google_api_key", apiKey) +
        makeAndroidStringEntry("google_app_id", appId) +
        makeAndroidStringEntry("gcm_defaultSenderId", senderId) +
        makeAndroidStringEntry("project_id", projectId);
    }

    stringsXML = stringsXML + "\n</resources>";

    fs.writeFileSync(stringsPath, stringsXML);
  } catch (e) {
    logE(e);
  }
}

function hasPlugin(cordovaContext, pluginName) {
  return cordovaContext.opts.cordova.plugins.indexOf(pluginName) != -1;
}

module.exports = function(cordovaContext) {
  var platforms = cordovaContext.opts.platforms;
  if (platforms.indexOf("android") !== -1) {
    log("Android platform detected, setting up firebase.");
    extractGoogleServicesConfig(cordovaContext);
  }
};
