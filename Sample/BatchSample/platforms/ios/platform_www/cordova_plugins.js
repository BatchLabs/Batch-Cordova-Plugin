cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.batch.cordova/www/batch.js",
        "id": "com.batch.cordova.batch",
        "pluginId": "com.batch.cordova",
        "clobbers": [
            "batch"
        ]
    },
    {
        "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
        "id": "cordova-plugin-statusbar.statusbar",
        "pluginId": "cordova-plugin-statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    },
    {
        "file": "plugins/cordova-plugin-whitelist/whitelist.js",
        "id": "cordova-plugin-whitelist.whitelist",
        "pluginId": "cordova-plugin-whitelist",
        "runs": true
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.batch.cordova": "1.5",
    "cordova-plugin-statusbar": "1.0.1",
    "cordova-plugin-whitelist": "1.1.0"
}
// BOTTOM OF METADATA
});