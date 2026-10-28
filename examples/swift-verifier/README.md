# Swift verifier

A command-line tool that verifies notification bodies with
[Apple's App Store Server Library for Swift](https://github.com/apple/app-store-server-library-swift)
6.0.0, configured as a Swift backend's tests would configure it: the asnsim root, the bundle ID,
Sandbox, online checks off.

```sh
asnsim init                                   # in the folder you run asnsim from
asnsim run billing-retry-grace-recovery --dry-run --out bodies
cd path/to/examples/swift-verifier
swift run VerifyNotification path/to/.asnsim/root.cer path/to/bodies/*.json
```

Each line names the file, the notification type and the transaction it carries; the exit code is
1 when a body does not verify. On a Mac (Apple silicon) with Swift 6.4, the 40 bodies of
`asnsim send --all --dry-run --out all` all verified on 28 October 2026.

The same code in a server (Vapor, Hummingbird) creates one `SignedDataVerifier` at start-up and
calls `verifyAndDecodeNotification(signedPayload:)` for each POST.
