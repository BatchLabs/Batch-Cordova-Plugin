var notificationSwitches = {};

document.addEventListener('deviceready', function() {
	// batch isn't available until this event
	refreshNotificationSwitches();
}, false);

document.addEventListener('DOMContentLoaded', function() {
	notificationSwitches = {
		alert: document.getElementById("check_alert"),
		sound: document.getElementById("check_sound"),
		vibrate: document.getElementById("check_vibrate"),
		lights: document.getElementById("check_lights")
	}

	var inputs = document.querySelectorAll("#notification_settings_checks input");
	for(var i = 0; i < inputs.length; i++) {
		inputs[i].addEventListener("change", notificationSettingChanged);
	}

	document.getElementById("show_token").addEventListener("click", function() {
		showPushToken();
	});
});

function refreshNotificationSwitches() {
	var notifTypes = window.localStorage.getItem("notifTypes");

	if (notifTypes === null) {
		return;
	}
	
	notifTypes = +notifTypes;
	var androidNotifTypes = batch.push.AndroidNotificationTypes;

	notificationSwitches.alert.checked = (notifTypes & androidNotifTypes.ALERT) == androidNotifTypes.ALERT;
	notificationSwitches.sound.checked = (notifTypes & androidNotifTypes.SOUND) == androidNotifTypes.SOUND;
	notificationSwitches.vibrate.checked = (notifTypes & androidNotifTypes.VIBRATE) == androidNotifTypes.VIBRATE;
	notificationSwitches.lights.checked = (notifTypes & androidNotifTypes.LIGHTS) == androidNotifTypes.LIGHTS;
}

function notificationSettingChanged(event) {
	var notifTypes = batch.push.AndroidNotificationTypes.NONE;

	if(notificationSwitches.alert.checked) {
		notifTypes = notifTypes | batch.push.AndroidNotificationTypes.ALERT;
	}

	if(notificationSwitches.sound.checked) {
		notifTypes = notifTypes | batch.push.AndroidNotificationTypes.SOUND;
	}

	if(notificationSwitches.vibrate.checked) {
		notifTypes = notifTypes | batch.push.AndroidNotificationTypes.VIBRATE;
	}

	if(notificationSwitches.lights.checked) {
		notifTypes = notifTypes | batch.push.AndroidNotificationTypes.LIGHTS;
	}

	window.localStorage.setItem("notifTypes", notifTypes);

	batch.push.setAndroidNotificationTypes(notifTypes);
}

function showPushToken() {
	batch.push.getLastKnownPushToken(function(token) {
		if (typeof token === "undefined" || token === null || token === "") {
		token = "Unknown token";
	}
	alert("Token: " + token);
	});
}