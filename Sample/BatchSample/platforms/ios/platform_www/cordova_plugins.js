cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-plugin-statusbar.statusbar",
        "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
        "pluginId": "cordova-plugin-statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    },
    {
        "id": "com.batch.cordova.batch",
        "file": "plugins/com.batch.cordova/www/batch.js",
        "pluginId": "com.batch.cordova",
        "clobbers": [
            "batch"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-statusbar": "1.0.1",
    "cordova-plugin-whitelist": "1.2.2",
    "com.batch.cordova": "1.5.3",
    "cordova-custom-config": "3.1.1"
};
// BOTTOM OF METADATA
});