// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "SwiftVerifier",
  platforms: [.macOS(.v13)],
  dependencies: [
    .package(url: "https://github.com/apple/app-store-server-library-swift.git", exact: "6.0.0")
  ],
  targets: [
    .executableTarget(
      name: "VerifyNotification",
      dependencies: [.product(name: "AppStoreServerLibrary", package: "app-store-server-library-swift")]
    )
  ]
)
