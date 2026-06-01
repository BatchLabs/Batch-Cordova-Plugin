// swift-tools-version:5.9

import PackageDescription

let package = Package(
    name: "@batch.com/cordova-plugin",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "@batch.com/cordova-plugin", targets: ["BatchCordovaPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.3.4"),
        .package(url: "https://github.com/BatchLabs/Batch-iOS-SDK.git", from: "3.3.0")
    ],
    targets: [
        .target(
            name: "BatchCordovaPlugin",
            dependencies: [
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "Batch", package: "Batch-iOS-SDK")
            ],
            path: "src/ios",
            resources: [],
            publicHeadersPath: "include",
            cSettings: [
                .headerSearchPath("interop")
            ]
        )
    ]
)
