var unlockManager = {
	constants : {
		unlocksChangedEvent: "unlocksChanged",
		unlimitedProTrial: -1,
		keys: {
			noAds: "no_ads",
			lives: "lives",
			proTrial: "pro_trial"
		},
		defaultValues: {
			noAds: false,
			lives: 10,
			proTrial: 0
		},
		references: {
			noAds: "NO_ADS",
			lives: "LIVES",
			proTrial: "PRO_TRIAL"
		}
	},
	readStorageInt: function(key, defaultValue) {
		var val = window.localStorage.getItem(key);
		return (val == null ? defaultValue : Number(val));
	},
	showRedeemAlert: function(offer) {
		var rewardMessage = offer.offerAdditionalParameters["reward_message"];
		if (typeof rewardMessage !== "undefined") {
			console.log("Displaying 'reward_message' additional parameter");
			alert(rewardMessage);
		} else {
			console.log("Didn't find an additional parameter named 'reward_message' to display a reward confirmation message");
		}
	},
	unlockItems: function(offer) {
		if (offer.features.length > 0) {
			unlockManager.unlockFeatures(offer.features);
		}

		offer.resources.forEach(function(resource) {
			if (resource.reference.toUpperCase() === unlockManager.constants.references.lives) {
				console.log("Unlocking " + resource.quantity + " lives");
				unlockManager.setLivesCount(unlockManager.getLivesCount() + resource.quantity);
			}
		});

		cordova.fireDocumentEvent(unlockManager.constants.unlocksChangedEvent, {});
	},
	unlockFeatures: function(features) {
		features.forEach(function(feature) {
			var reference = feature.reference.toUpperCase();
			if (reference === unlockManager.constants.references.noAds) {
				console.log("Unlocking No Ads");
				window.localStorage.setItem(unlockManager.constants.keys.noAds, 1);
			} else if (reference === unlockManager.constants.references.proTrial) {
				if (typeof feature === "undefined" || feature.ttl <= 0) {
					console.log("Unlocking " + unlockManager.constants.references.proTrial + " forever");
					window.localStorage.setItem(unlockManager.constants.keys.proTrial, unlockManager.constants.unlimitedProTrial);
				} else {
					console.log("Unlocking " + unlockManager.constants.references.proTrial + " for " + feature.ttl + " seconds");
					// Store the timestamp of expiration rather than the TTL
					window.localStorage.setItem(unlockManager.constants.keys.proTrial, Math.floor(Date.now() / 1000) + feature.ttl);
				}
			}
		});

		cordova.fireDocumentEvent(unlockManager.constants.unlocksChangedEvent, {});
	},
	getLivesCount: function() {
		return unlockManager.readStorageInt(unlockManager.constants.keys.lives, unlockManager.constants.defaultValues.lives);
	},
	setLivesCount: function(count) {
		window.localStorage.setItem(unlockManager.constants.keys.lives, count);
	},
	hasNoAds: function() {
		return Boolean(unlockManager.readStorageInt(unlockManager.constants.keys.noAds, unlockManager.constants.defaultValues.noAds));
	},
	hasProTrial: function() {
		var timeLeft = unlockManager.timeLeftForProTrial();
		return timeLeft !== 0 && timeLeft != unlockManager.unlimitedProTrial;
	},
	timeLeftForProTrial: function() {
		var expirationDate = unlockManager.readStorageInt(unlockManager.constants.keys.proTrial, unlockManager.constants.defaultValues.proTrial);
		if (expirationDate === unlockManager.unlimitedProTrial) {
			return unlockManager.unlimitedProTrial;
		}
		return Math.max(expirationDate - Math.floor(Date.now() / 1000), 0);
	}
}