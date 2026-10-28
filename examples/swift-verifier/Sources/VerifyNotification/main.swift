// Verifies notification bodies the way a Swift backend would, with Apple's App Store Server
// Library for Swift, trusting the asnsim test root:
//
//   swift run VerifyNotification ../../.asnsim/root.cer bodies/*.json
//
// Each body is the JSON the App Store POSTs, { "signedPayload": "…" }, such as the files
// `asnsim run <scenario> --dry-run --out bodies` writes. Exit code 1 when one does not verify.
import AppStoreServerLibrary
import Foundation

struct Body: Decodable { let signedPayload: String }

let arguments = CommandLine.arguments.dropFirst()
guard let rootPath = arguments.first, arguments.count > 1 else {
  FileHandle.standardError.write(Data("usage: VerifyNotification <root.cer> <body.json>...\n".utf8))
  exit(2)
}
let bundleId = ProcessInfo.processInfo.environment["ASN_BUNDLE_ID"] ?? "com.example.app"
let root = try Data(contentsOf: URL(fileURLWithPath: rootPath))
let verifier = try SignedDataVerifier(
  rootCertificates: [root], bundleId: bundleId, appAppleId: nil, environment: .sandbox,
  enableOnlineChecks: false)

var failures = 0
for path in arguments.dropFirst() {
  let body = try JSONDecoder().decode(Body.self, from: Data(contentsOf: URL(fileURLWithPath: path)))
  let name = URL(fileURLWithPath: path).lastPathComponent
  switch await verifier.verifyAndDecodeNotification(signedPayload: body.signedPayload) {
  case .valid(let notification):
    var line = "\(name): verified \(notification.notificationType?.rawValue ?? "?")"
    if let subtype = notification.subtype { line += "/\(subtype.rawValue)" }
    if let signed = notification.data?.signedTransactionInfo {
      switch await verifier.verifyAndDecodeTransaction(signedTransaction: signed) {
      case .valid(let transaction):
        line += ", transaction \(transaction.transactionId ?? "?") of \(transaction.productId ?? "?")"
      case .invalid(let error):
        line += ", transaction NOT verified: \(error)"
        failures += 1
      }
    }
    print(line)
  case .invalid(let error):
    print("\(name): NOT verified: \(error)")
    failures += 1
  }
}
exit(failures == 0 ? 0 : 1)
