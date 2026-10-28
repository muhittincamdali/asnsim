<!-- i18n-source: README.md@0c7c503bbb941d6838ce83808e35ae955ef56b21 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="CI ステータス"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="最新バージョン: v0.1.2"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="言語バージョン: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="ライセンス: MIT"></picture></a>
</p>

<p align="center">
<a href="#クイックスタート"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ja-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ja-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ja-light.svg" alt="はじめる"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ja-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ja-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ja-light.svg" alt="ドキュメント"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ja-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ja-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ja-light.svg" alt="ガイド"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ja-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ja-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ja-light.svg" alt="サンプル"></picture></a>
</p>

> このドキュメントは英語版 README の翻訳です。内容が異なる場合は英語版が最新です。

<!-- brand:end -->

Apple の Request a Test Notification エンドポイントが送るのは `TEST` タイプだけで、Sandbox も App Store Server Notification を 1 回しか送らず、Production のような再送はありません。asnsim は、Apple が文書化しているすべての通知タイプとサブタイプ（40 組。2026 年 10 月 28 日に確認。Apple が 2026 年 10 月 23 日に Production で利用可能にした `ASSIGNED` と `ASSIGNMENT_REVOKE` を含みます）を、App Store と同じ方法で署名し、お使いのマシンからお使いの webhook に送ります。バックエンドは Apple 自身の検証コードをそのまま使い、asnsim のテスト用ルートはテストの中だけで信頼します。

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml：Apple の Node.js ライブラリで作った webhook に 5 件の通知を送り、それぞれが 200 で応答され、続けて顧客の権限（entitlement）を確認する。5 件中 5 件の通知が成功、リクエストは 11 回"></picture>

<sub>実際の CLI で <a href="examples/node-receiver">examples/node-receiver</a> に対して記録したものです。
これは Apple の Node.js ライブラリで作った webhook です（<code>npm run demo</code>）。</sub>

## 主な特長

- **40 種類すべての通知を、一貫した内容で。** `SUBSCRIBED`、`DID_RENEW`、Billing Grace Period の有無それぞれの `DID_FAIL_TO_RENEW`、理由ごとの `EXPIRED`、アップグレード、ダウングレード、値上げ、返金とその取り消し、Family Sharing と組織による取り消し、消費リクエスト、更新の延長、外部購入トークン、`RESCIND_CONSENT`、Advanced Commerce の各タイプを送ります。1 人の顧客のトランザクション ID、日付、更新情報は、ステップをまたいでも一貫しています。
- **Apple のライブラリで検証済みです。** テストでは、すべての通知を Apple の Node.js ライブラリ 3.1.0 の `SignedDataVerifier` に Sandbox と Production の両方で渡しています。Apple の Swift ライブラリ 6.0.0 は、Mac（Apple silicon）上の Swift 6.4 で 40 種類すべてを検証しました。
- **チェック付きのシナリオ。** ステップを並べた YAML ファイルで、各ステップの後にバックエンドの動作を確認するリクエストを付けられます。たとえば「`REFUND` の後、`GET /entitlements/{originalTransactionId}` が `active: false` を返す」といった確認です。シナリオは 9 つ内蔵しています。
- **App Store の配信ルール。** 200 から 206 は成功で、それ以外（リダイレクトを含む）は配信失敗です。`--retries` は Production と同じく同じ内容で再送し、`--duplicate` は各通知を 2 回送って、サーバーが重複した `notificationUUID` を無視することを確認します。
- **実物を読み解くデコーダー。** `asnsim decode` は通知の本文、署名済みトランザクション、App Store Server API のレスポンスを読み、中のすべての JWS をデコードして、Apple のライブラリと同じ方法でオフラインのまま Apple Root CA - G3 に対して検証します。Xcode の StoreKit Testing のデータも読めます。
- **CI 向けに作られています。** ターミナル、プレーンテキスト、Markdown、JSON のレポートに対応し、終了コードは 0 が成功、1 が配信・チェック・検証の失敗、2 が使い方の誤りです。 レポートでは URL の認証情報、クエリの値、ID、webhook の応答に含まれる秘密情報が隠されます（[隠される内容](docs/guides/ci.md#what-the-reports-hide)）。

## クイックスタート

**1. asnsim をインストールします。** Node.js も一緒にインストールされる [Homebrew](https://brew.sh/) の場合：

```sh
brew install muhittincamdali/tap/asnsim
```

または、[GitHub release](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.2) から npm でインストールします。この場合は
[Node.js](https://nodejs.org/) 22.12 以降が必要です（`node --version` で確認できます）：

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.2/asnsim-0.1.2.tgz
```

このパッケージはまだ npm registry にありません。`@mcamdali/asnsim` として公開する予定です。どちらのコマンドも、同じ release の tarball をインストールします。

**2. テスト用の証明書チェーンを作り、バックエンドがテストでそれを信頼するようにします。** プロジェクトのフォルダーで：

```sh
asnsim init --bundle-id com.example.app
```

これで `.asnsim/` が作成されます。バックエンドのテスト設定で、Apple の `SignedDataVerifier` にルート証明書として `.asnsim/root.cer` を渡し、オンラインチェックをオフにして、バックエンドを起動してください。
[Trust the test root](docs/guides/trust-the-test-root.md) に、Node.js、Swift、Java、Python での書き方があります。

**3. webhook に通知を送ります：**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

サーバーが App Store の期待どおりに応答すると、各行は `ok` で終わります。`failed` の行には、何が起きたかと直し方が表示されます。詳しくは [Troubleshooting](docs/guides/troubleshooting.md) をご覧ください。

## asnsim が送るもの

POST の本文は App Store が送るものと同じ `{"signedPayload": "…"}` です。JWS は、Apple の検証ツールが確認する
2 つの Apple 拡張を持つ 3 枚の証明書のチェーンで、ES256 により署名されます。どの証明書の名前にも `asnsim (not Apple)` と入っています。中のトランザクションと更新情報も同じ方法で署名され、フィールドは Apple の
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
と [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload) に従います。

| 分類                         | 通知                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 購入と更新                   | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`       |
| 請求の問題                   | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                          |
| 期限切れ                     | `EXPIRED`（サブタイプは `VOLUNTARY`、`BILLING_RETRY`、`PRICE_INCREASE`、`PRODUCT_NOT_FOR_SALE`、またはサブタイプなし） |
| 顧客による変更               | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)             |
| 返金と取り消し               | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                        |
| デベロッパーからのリクエスト | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                                   |
| その他のペイロード           | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT`、Advanced Commerce の `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE`  |

`asnsim types` は、各組をアクセスに対して Apple がどのような意味だと説明しているかとともに表示します。元になるデータは
[catalog/notifications.json](catalog/notifications.json) で、テストはこれを 2026 年 10 月 28 日に読んだ時点の Apple のページの値（テスト内にコピーとして保存）と比較します。Apple が後から追加した type や subtype は自動では検出されず、そのコピーを更新したときに現れます。
[What asnsim sends](docs/guides/notifications.md) には、各通知が変更するフィールドと、Apple のページに値がない箇所で asnsim が選ぶ値を載せています。

## 使い方

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| オプション（run、send） | 内容                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `-u, --url <url>`       | webhook                                                                            |
| `-d, --dir <folder>`    | `asnsim init` が書き出したフォルダー。デフォルトは `.asnsim`                       |
| `--clock live\|fixed`   | 各通知に送信時の日付を付ける（デフォルト）、またはシナリオ自身の日付を使う         |
| `--start <date>`        | 最初のイベントの日付。クロックが fixed になります                                  |
| `--seed <text>`         | 実行のたびに同じトランザクション ID と notificationUUID にします                   |
| `--retries <n>`         | 失敗した通知を同じ内容で最大 5 回まで再送します                                    |
| `--duplicate`           | すべての通知を 2 回送ります                                                        |
| `--timeout <ms>`        | リクエストごとの制限時間。デフォルトは 10000                                       |
| `-H, --header <header>` | webhook とそのチェックに付ける追加のリクエストヘッダー。複数指定できます           |
| `--out <folder>`        | 各リクエスト本文もファイルに書き出します                                           |
| `--dry-run`             | 署名と書き出しだけを行い、何も送りません                                           |
| `-f, --format <format>` | `tty`（デフォルト）、`text`、`markdown`、`json`。`--json` は最後のものの短縮形です |
| `-o, --output <file>`   | レポートをファイルに書き出します                                                   |

終了コード：`0` はすべての通知が成功（200 から 206 で応答された、またはステップの `expect` どおりで、チェックも一致した）、
`1` は配信、期待値、チェックのいずれかが失敗、`2` は引数の誤り、テスト用チェーンがない、シナリオを読み込めない、または予期しないエラーです。JWS を検証できなかった場合、`asnsim decode` は 1 で終了します。

### 通知を 1 件送る

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send` は、その通知に必要な履歴（`BILLING_RECOVERY` の前にはサブスクリプションと更新の失敗、返金の前には購入）を送信せずに再現するので、ID と日付に矛盾が出ません。
`--all` は 40 種類をそれぞれ 1 回ずつ送ります。どのタイプでもハンドラーが失敗しないことを手早く確かめられます。

### シナリオを書く

```yaml
description: Access follows the subscription.
steps:
  - type: SUBSCRIBED
    subtype: INITIAL_BUY
    offer: { type: introductory, discount: FREE_TRIAL, period: P1W }
    check: { url: "/entitlements/{originalTransactionId}", json: { active: true } }
  - type: DID_FAIL_TO_RENEW
    subtype: GRACE_PERIOD
    check: { url: "/entitlements/{originalTransactionId}", json: { active: true } }
  - type: REFUND
    duplicate: true
    check: { url: "/entitlements/{originalTransactionId}", json: { active: false } }
```

各ステップは、`after` や `at` で動かさない限り、そのイベントが実際に起こるタイミングで発生します（更新は期間の終わり、期限切れは billing retry の 60 日後）。
[Write a scenario](docs/guides/scenarios.md) に、すべてのキーの説明があります。

| 内蔵シナリオ                   | ステップ                                                                  |
| ------------------------------ | ------------------------------------------------------------------------- |
| `trial-renew-refund`           | 無料トライアル、最初の更新、返金                                          |
| `billing-retry-grace-recovery` | 更新、Billing Grace Period 中の更新失敗、猶予期間の終了、billing recovery |
| `billing-retry-expired`        | 更新失敗、再試行 60 日後の期限切れ                                        |
| `cancel-expire-winback`        | 自動更新オフ、自主的な期限切れ、win-back オファーでの再登録               |
| `upgrade-downgrade`            | 即時のアップグレード、次回更新時のダウングレード                          |
| `price-increase-accepted`      | 値上げの保留、承諾、新しい価格での更新                                    |
| `price-increase-declined`      | 値上げの保留、期限切れ                                                    |
| `consumable-refund-dispute`    | 消耗型、消費リクエスト、返金、返金の取り消し                              |
| `family-sharing-revoke`        | Family Sharing によるアクセス、その後の取り消し                           |

### App Store が送ってきたものをデコードする

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode は、オンラインチェックをオフにした Apple の `SignedDataVerifier` と同じ方法で各 JWS を確認します。
3 枚の証明書がそれぞれ次の証明書によって発行されていること、Apple の 2 つの拡張、`signedDate` 時点での有効性、
ES256 署名を、Apple Root CA - G3（内蔵）、`.asnsim` のテスト用ルート、指定した `--root` に対して確認します。失効の確認には Apple の OCSP サーバーが必要なので行いません。
Xcode の StoreKit Testing のデータは Xcode が署名しているため、検証には通りません。`--environment Xcode` を付けると decode は検証せずに内容を表示し、未検証として報告します。Apple の検証器も、Xcode 用に設定したときだけ検証を省略します。詳しくは [Decode what the App Store sent](docs/guides/decode.md) をご覧ください。

### JavaScript から使う

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## Apple のライブラリでの確認

| 確認内容                                                                                                                                     | 場所                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 40 種類すべての通知と、そのトランザクション、更新情報、app transaction を、Apple の Node.js ライブラリ 3.1.0 が Sandbox と Production で検証 | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test`           |
| Apple の Node.js ライブラリで作った webhook が権限のシナリオに合格し、40 種類すべてに 200 で応答                                             | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                                   |
| 40 件すべての本文を Apple の Swift ライブラリ 6.0.0 が検証                                                                                   | [Examples workflow](.github/workflows/examples.yml)。2026 年 10 月 28 日、Mac（Apple silicon、M5 Max）上の Swift 6.4 |
| Apple の実際のチェーン（Apple Root CA - G3、WWDR G6、2025 年の receipt signing 証明書）が decode のチェーン確認に合格                        | [test/unit/verify.test.ts](test/unit/verify.test.ts)                                                                 |
| StoreKit Testing（Xcode 27.1、iOS 27.0 Simulator）のトランザクションと更新情報をデコードできる                                               | [test/data/xcode](test/data/xcode)                                                                                   |

テストスイートは 27 ファイル・717 件のテスト（ユニット、統合、スナップショット、エンドツーエンド）で構成され、2026 年 10 月 28 日に Mac（Apple シリコン）上の Node.js 26 で `npm test` を実行し、すべて成功しました。

## デモ

| 録画                                                                | ライト · ダーク                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `asnsim init`                                                       | [ライト](docs/media/demo-init-light.svg) · [ダーク](docs/media/demo-init-dark.svg)                 |
| 各ステップの後にチェックを入れた権限のシナリオ（このページの先頭）  | [ライト](docs/media/demo-checks-light.svg) · [ダーク](docs/media/demo-checks-dark.svg)             |
| `--duplicate` を付けた `trial-renew-refund`                         | [ライト](docs/media/demo-trial-light.svg) · [ダーク](docs/media/demo-trial-dark.svg)               |
| 失敗するチェックと、その直し方                                      | [ライト](docs/media/demo-failure-light.svg) · [ダーク](docs/media/demo-failure-dark.svg)           |
| StoreKit Testing が署名したトランザクションに対する `asnsim decode` | [ライト](docs/media/demo-decode-xcode-light.svg) · [ダーク](docs/media/demo-decode-xcode-dark.svg) |

2026 年 10 月 28 日に Mac（Apple silicon、M5 Max）で Node.js 26.12.1 と release の tarball からインストールした asnsim 0.1.2 を使って計測しました。
それぞれ 3 回に分けて計 29 回実行し、Node.js の起動時間を含みます。examples/node-receiver に対する `asnsim send --all`（40 件の通知。受信側でそれぞれ Apple のライブラリが検証）は
0.17 秒から 0.26 秒、中央値は 0.19 秒でした。`--dry-run` を付けると 0.12 秒から 0.17 秒、中央値は 0.13 秒でした。マシンはアイドル状態ではなく、計測中は他の作業によりロードアベレージが 9 から 11（18 コア）で、負荷が上がると時間も伸びます。

## ステータス

| 機能                                                                                              | 状態       |
| ------------------------------------------------------------------------------------------------- | ---------- |
| テスト用チェーン、署名、40 組の通知、Sandbox と Production                                        | 動作します |
| チェック付きシナリオ、重複送信、再送、ライブクロックと固定クロック。9 つの内蔵シナリオ            | 動作します |
| Apple Root CA - G3、テスト用ルート、StoreKit Testing のデータに対応した decode                    | 動作します |
| ターミナル、テキスト、Markdown、JSON のレポートと終了コード                                       | 動作します |
| `billingPlanType`、`commitmentInfo`、`eligibleWinBackOfferIds`、`advancedCommerceInfo` フィールド | 予定 (0.2) |
| 1 つのシナリオで複数の顧客とサブスクリプショングループ                                            | 予定 (0.2) |
| 順序が入れ替わる配信と、Production の再送スケジュールのリアルタイム再現                           | 予定 (0.3) |
| App Store Server API のモック（Get Transaction History、Get All Subscription Statuses）           | 予定 (0.4) |
| 安定したシナリオ形式と JSON の構造                                                                | 予定 (1.0) |

## 制限事項

- **実際に取得したものではなく、シミュレーションです。** ペイロードは Apple のフィールド定義と各通知についての説明に従っており、
  Apple のサーバーが実際に送るもののコピーではありません。Apple のページに値がない箇所（トランザクション ID の形式、猶予期間の長さ、storefront）は asnsim が値を選びます。その一覧は [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes) にあり、どの値もステップごとに `set` で変更できます。
- **Apple のものではなく、テスト用のルートです。** asnsim が署名したものは、どれも Apple Root CA - G3 に対して検証できません。バックエンドはテストの中で `.asnsim/root.cer` を信頼する必要があり、Production では決して信頼してはいけません。
- **オンラインチェックはオフです。** オンラインチェックがオンのとき、Apple の検証ツールは Apple の OCSP サーバーで失効を確認します。テスト用チェーンには OCSP サーバーがないため、テストはオフで実行します。
- **1 つのシナリオにつき顧客は 1 人です。** サブスクリプショングループは 1 つ、単発の購入は任意の数まで扱えます。
- **入力には上限があります。** シナリオファイルは 1 MB・500 ステップまで、decode の入力は 2 MB まで、JWS は 1,000,000 文字まで、証明書の入れ子は最大 32 階層、各レスポンスは最初の 64 KB までです。decode の入力と `--root` のファイルはストリームとして読み込み、2 MB を超えた最初のバイトで拒否します。`asnsim decode /dev/zero` は 0.11 秒から 0.15 秒、メモリ 72 MB から 73 MB で終了します（Mac（Apple silicon）、Node.js 26、asnsim 0.1.2、ロードアベレージ 10 前後）。

## ドキュメント

API リファレンスとガイド：[muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/)。

## ガイド

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## 出典

2026 年 10 月 28 日に確認：

- Apple、App Store Server Notifications：
  [notificationType](https://developer.apple.com/documentation/appstoreservernotifications/notificationtype)、
  [subtype](https://developer.apple.com/documentation/appstoreservernotifications/subtype)、
  [responseBodyV2DecodedPayload](https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload)、
  [data](https://developer.apple.com/documentation/appstoreservernotifications/data)、
  [summary](https://developer.apple.com/documentation/appstoreservernotifications/summary)、
  [externalPurchaseToken](https://developer.apple.com/documentation/appstoreservernotifications/externalpurchasetoken)、
  [appData](https://developer.apple.com/documentation/appstoreservernotifications/appdata)、
  [status](https://developer.apple.com/documentation/appstoreservernotifications/status)、
  [notificationUUID](https://developer.apple.com/documentation/appstoreservernotifications/notificationuuid)、
  [JWSDecodedHeader](https://developer.apple.com/documentation/appstoreservernotifications/jwsdecodedheader)、
  [Responding to App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications)、
  [Enabling App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/enabling-app-store-server-notifications)、
  [changelog](https://developer.apple.com/documentation/appstoreservernotifications/app-store-server-notifications-changelog)。
- Apple、App Store Server API：
  [JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)、
  [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload)、
  [JWSAppTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsapptransactiondecodedpayload)、
  [Request a Test Notification](https://developer.apple.com/documentation/appstoreserverapi/request-a-test-notification)、およびそこからリンクされている値のページ（expirationIntent、revocationReason、revocationType、
  offerType、offerDiscountType、transactionReason、autoRenewStatus、priceIncreaseStatus）。
- Apple PKI：[Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/)。
- Apple の App Store Server Library：
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0)、
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0)、
  [Java](https://github.com/apple/app-store-server-library-java)、
  [Python](https://github.com/apple/app-store-server-library-python)。
  `SignedDataVerifier` が行う確認の参照元です。
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515)（JWS）と
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)（X.509）。

## 動作要件

macOS、Linux、Windows 上の Node.js 22.12 以降。ほかには何も要りません。Xcode も Apple アカウントも不要で、
webhook 以外のネットワークも使いません。Swift のサンプルには Swift 6.4 が必要です。Package.resolved が固定している swift-collections 1.7.5 が Swift tools 6.4 を必要とするためです。

## アーキテクチャ

```text
catalog/notifications.json   40 type and subtype pairs, payload object, access, Apple's pages
  ─► Simulation              one customer: subscription state, virtual clock, seeded IDs
  ─► buildParts / signParts  transaction, renewal info, data / summary / appData, ES256 JWS
       pki/                  DER writer and reader, the test chain, Apple's verifier checks
  ─► runScenario / send      POST {"signedPayload"}, the App Store's 200–206 rule, retries,
                             duplicates, checks, findings with fixes
  ─► render                  tty | text | markdown | json
decode                       find the token, decode nested JWS, verify against trusted roots
```

- 通知のデータはコードから分離されており、テストが Apple のページと照合します。
- CLI（`src/cli/`）が行うのは、引数の解析、色と幅の選択、終了コードの設定だけです。
- 証明書の署名や解析を行う依存パッケージはありません。asnsim が DER を自前で書き込み・読み取りし、署名は Node.js の `crypto` が行います。

## 関連プロジェクト

[glassready](https://github.com/muhittincamdali/glassready) は、iOS 27 SDK でビルドしたアプリで Liquid Glass が何を変えるかを、
[a11ylabel](https://github.com/muhittincamdali/a11ylabel) は、どの App Store のアクセシビリティラベルを申告できるかを示します。
asnsim は、アプリ内課金の裏側にあるバックエンドの動作をテストします。

## FAQ

**Sandbox でのテストの代わりになりますか？** いいえ。Sandbox は本物の App Store と App Store Connect の設定をテストします。
asnsim は、バックエンドがすべての通知をどう処理するかを、Sandbox での実行の前にも合間にも、何度でもテストします。

**asnsim の通知が Production のサーバーに届くことはありますか？** そのサーバーがテスト用ルートを信頼している場合に限ります。
Apple Root CA - G3 だけを信頼するサーバーは、テストでも確認しているとおり、asnsim の通知をすべて拒否します。

**Flutter や React Native 向けの特別な設定は必要ですか？** いいえ。アプリが何で書かれていても、通知は App Store からサーバーに届きます。
asnsim がテストするのは、その通知を処理するバックエンドです。

## コントリビューション

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## ライセンス

MIT ライセンスで公開しています。詳細は [LICENSE](LICENSE) を参照してください。
