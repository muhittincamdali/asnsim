import Foundation
import StoreKit
import StoreKitTest
import XCTest

final class XcodeJWSTests: XCTestCase {
  func testWriteSignedTransactions() async throws {
    let url = try XCTUnwrap(Bundle(for: XcodeJWSTests.self).url(forResource: "Products", withExtension: "storekit"))
    let session = try SKTestSession(contentsOf: url)
    session.disableDialogs = true
    session.clearTransactions()
    let out = ProcessInfo.processInfo.environment["XCODE_JWS_OUT"] ?? "/dev/null"
    var lines: [String] = []
    _ = try await session.buyProduct(identifier: "com.example.coins.100")
    _ = try await session.buyProduct(identifier: "com.example.premium.monthly")
    for id in ["com.example.coins.100", "com.example.premium.monthly"] {
      if let result = await Transaction.latest(for: id) {
        lines.append("transaction \(id) \(result.jwsRepresentation)")
      }
    }
    let statuses = try await Product.SubscriptionInfo.status(for: "21000001")
    for status in statuses {
      lines.append("renewal-info \(status.renewalInfo.jwsRepresentation)")
    }
    try lines.joined(separator: "\n").write(toFile: out, atomically: true, encoding: .utf8)
  }
}
