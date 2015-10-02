/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('batchPushReceived', this.onBatchPush, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        batch.setConfig({"androidAPIKey":"YOUR_API_KEY",
            "iOSAPIKey":"YOUR_API_KEY"});
        batch.push.setGCMSenderID("YOUR_SENDER");
        batch.push.setup();
        batch.unlock.setup();
        
        app.setupBatchUnlockListeners();

        //batch.start();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    },
    // Batch Push listener
    // If you want to act on the clicked push's payload, do it here
    //
    // In this case, the method tries to read the "alert" key of the custom payload, and display it.
    // Note that "alert" is not a default Android/iOS push key, so you need to add it yourself
    onBatchPush: function(push) {
        console.debug("Got a push payload from Batch", push);

        if (typeof push.payload.alert !== "undefined") {
            alert(push.payload.alert);
        }
    },
    setupBatchUnlockListeners: function() {
        batch.on("redeemAutomaticOffer", function(event, offer) {
           console.debug("Automatically redeeming an offer", offer);
           unlockManager.unlockItems(offer);
           unlockManager.showRedeemAlert(offer);
        });

        batch.on("redeemURLSuccess", function(event, offer) {
           console.debug("redeemURLSuccess", offer);
           unlockManager.unlockItems(offer);
           unlockManager.showRedeemAlert(offer);
        });

        batch.on("redeemURLCodeFound", function(event, code) {
           console.debug("redeemURLCodeFound", code);
        });

        batch.on("redeemURLFailed", function(event) {
           console.debug("redeemURLFailed");
        });

        batch.on("restoreFailed", function(event) {
           console.debug("restoreFailed");
           alert("Restore failed!");
        });

        batch.on("restoreSuccess", function(event, features) {
           console.debug("restoreSuccess");
           alert("Restore success!");
           unlockManager.unlockFeatures(features);
        });

        batch.on("redeemCodeFailed", function(event) {
           console.debug("redeemCodeFailed");
           alert("Redeem failed!");
        });

        batch.on("redeemCodeSuccess", function(event, offer) {
           console.debug("redeemCodeSuccess");
           alert("Redeem success!");
           unlockManager.unlockItems(offer);
           unlockManager.showRedeemAlert(offer);
        });
    }
};

app.initialize();