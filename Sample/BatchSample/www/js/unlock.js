var unlockViews = {};

document.addEventListener('DOMContentLoaded', function() {
	unlockViews = {
		proTrialSwitch: document.getElementById("check_pro_trial"),
		proTrialLabel: document.getElementById("label_pro_trial"),
		noAds: document.getElementById("check_no_ads"),
		lives: document.getElementById("lives_count")
	}

	document.getElementById("button_redeem").addEventListener("click", function() {
		var code = prompt("Please enter the code to redeem:");
		if (code !== null && code !== "") {
			batch.unlock.redeemCode(code);
		}
	});

	document.getElementById("button_restore").addEventListener("click", function() {
		batch.unlock.restore();
	});
});

document.addEventListener('unlocksChanged', function() {
	refreshUnlockUI();
});

document.addEventListener('deviceready', function() {
	refreshUnlockUI();
}, false);

function refreshUnlockUI() {
	unlockViews.noAds.checked = unlockManager.hasNoAds();
	unlockViews.proTrialSwitch.checked = unlockManager.hasProTrial();
	unlockViews.proTrialLabel.innerHTML = " - " + Math.floor(unlockManager.timeLeftForProTrial() / 86400) + " days left";
	unlockViews.lives.innerHTML = unlockManager.getLivesCount();
}