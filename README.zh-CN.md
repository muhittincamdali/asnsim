<!-- i18n-source: README.md@82bd21b19ac265498a5e575dd520386f497217a5 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="CI 状态"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="最新版本: v0.1.0"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="语言版本: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="许可证: MIT"></picture></a>
</p>

<p align="center">
<a href="#快速开始"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-zh-CN-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-zh-CN-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-zh-CN-light.svg" alt="开始使用"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-zh-CN-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-zh-CN-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-zh-CN-light.svg" alt="文档"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-zh-CN-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-zh-CN-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-zh-CN-light.svg" alt="指南"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-zh-CN-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-zh-CN-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-zh-CN-light.svg" alt="示例"></picture></a>
</p>

> 本文是英文 README 的译文。如两者内容不一致，以英文版为准。

<!-- brand:end -->

Apple 的 Request a Test Notification 端点只会发送 `TEST` 类型，而它的 Sandbox 对每条 App Store Server Notification 只发送一次，没有 Production 中的重试。asnsim 会发送 Apple 文档中列出的每一种通知类型和子类型（共 40 对，2026 年 10 月 28 日查阅，其中包括 Apple 于 2026 年 10 月 23 日在 Production 中开放的 `ASSIGNED` 和 `ASSIGNMENT_REVOKE`），按 App Store 的签名方式签名，并从你自己的机器发送到你的 webhook。你的后端继续使用 Apple 自己的验证代码，只在测试中信任 asnsim 的测试根证书。

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml：向基于 Apple Node.js 库构建的 webhook 发送五条通知，每条都得到 200 响应，随后检查客户的权益（entitlement）；5 条通知全部通过，共 11 次请求"></picture>

<sub>由真实的 CLI 针对 <a href="examples/node-receiver">examples/node-receiver</a> 录制，
这是一个基于 Apple Node.js 库的 webhook（<code>npm run demo</code>）。</sub>

## 亮点

- **全部 40 种通知，数据一致。** `SUBSCRIBED`、`DID_RENEW`、有无 Billing Grace Period 的 `DID_FAIL_TO_RENEW`、每种原因的 `EXPIRED`、升级、降级、涨价、退款及其撤销、Family Sharing 与组织撤销、消耗请求、续订延期、外部购买令牌、`RESCIND_CONSENT` 以及 Advanced Commerce 类型。同一位客户的交易 ID、日期和续订信息在各个步骤之间保持一致。
- **经 Apple 的库验证。** 测试把每条通知交给 Apple Node.js 库 3.1.0 的 `SignedDataVerifier`，在 Sandbox 和 Production 中各验证一次；Apple 的 Swift 库 6.0.0 在 Mac（Apple silicon）上使用 Swift 6.4 验证了全部 40 种。
- **带检查的场景。** 一个由步骤组成的 YAML 文件，每一步后面可以跟一个请求，用来检查你的后端做了什么：“`REFUND` 之后，`GET /entitlements/{originalTransactionId}` 返回 `active: false`”。内置九个场景。
- **App Store 的投递规则。** 200 到 206 为成功，其他任何响应（包括重定向）都算投递失败；`--retries` 像 Production 一样原样重发，`--duplicate` 把每条通知发送两次，用来测试你的服务器是否会忽略重复的 `notificationUUID`。
- **能解码真实数据的解码器。** `asnsim decode` 可以读取通知正文、已签名的交易或 App Store Server API 的响应，解码其中的每个 JWS，并像 Apple 的库一样离线对照 Apple Root CA - G3 进行验证。它也能读取 Xcode 的 StoreKit Testing 数据。
- **为 CI 而设计。** 提供终端、纯文本、Markdown 和 JSON 报告；退出码 0 表示通过，1 表示投递、检查或验证失败，2 表示用法错误。 报告会隐藏 URL 中的凭据、查询参数的值、ID 以及 webhook 响应中的机密信息（[隐藏哪些内容](docs/guides/ci.md#what-the-reports-hide)）。

## 快速开始

**1. 安装 asnsim。** 使用 [Homebrew](https://brew.sh/)（同时会安装 Node.js）：

```sh
brew install muhittincamdali/tap/asnsim
```

或者通过 npm 从 [GitHub release](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0) 安装，需要
[Node.js](https://nodejs.org/) 22.12 或更高版本（`node --version` 可查看）：

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.0/asnsim-0.1.0.tgz
```

该软件包尚未发布到 npm registry；计划以 `@mcamdali/asnsim` 的名称发布。两条命令安装的是同一个 release 压缩包。

**2. 创建测试证书链，然后让你的后端在测试中信任它。** 在项目文件夹中：

```sh
asnsim init --bundle-id com.example.app
```

这会写入 `.asnsim/`。在后端的测试配置中，把 `.asnsim/root.cer` 作为根证书交给 Apple 的
`SignedDataVerifier`，并关闭在线检查，然后启动后端。
[Trust the test root](docs/guides/trust-the-test-root.md) 给出了 Node.js、Swift、Java 和 Python 的写法。

**3. 向你的 webhook 发送通知：**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

当服务器的响应符合 App Store 的预期时，每一行都以 `ok` 结尾。`failed` 行会说明发生了什么以及如何修复；详情见 [Troubleshooting](docs/guides/troubleshooting.md)。

## asnsim 会发送什么

POST 正文与 App Store 发送的相同：`{"signedPayload": "…"}`。JWS 由一条三级证书链以 ES256 签名，证书带有 Apple 验证器会检查的两个 Apple 扩展；每个证书的名称里都写着 `asnsim (not Apple)`。其中的交易和续订信息以同样方式签名，字段遵循 Apple 的
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
和 [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload)。

| 类别             | 通知                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| 购买与续订       | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`      |
| 扣款问题         | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                         |
| 到期             | `EXPIRED`，子类型为 `VOLUNTARY`、`BILLING_RETRY`、`PRICE_INCREASE`、`PRODUCT_NOT_FOR_SALE` 或无子类型                 |
| 客户发起的变更   | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)            |
| 退款与撤销       | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                       |
| 开发者发起的请求 | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                                  |
| 其他载荷         | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT`；Advanced Commerce 的 `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE` |

`asnsim types` 会打印每一对类型，以及 Apple 对它在访问权限方面含义的说明。背后的数据是
[catalog/notifications.json](catalog/notifications.json)，测试会把它与 2026 年 10 月 28 日读取时 Apple 页面列出的值（作为副本保存在测试中）进行比较；Apple 之后新增的类型或子类型不会被自动发现，要等这份副本更新后才会体现。
[What asnsim sends](docs/guides/notifications.md) 列出了每条通知会改动哪些字段，以及在 Apple 页面没有给出取值的地方 asnsim 选择了哪些值。

## 使用方法

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| 选项（run、send）       | 作用                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| `-u, --url <url>`       | webhook 地址                                                           |
| `-d, --dir <folder>`    | `asnsim init` 写入的文件夹，默认为 `.asnsim`                           |
| `--clock live\|fixed`   | 发送时给每条通知标注当前时间（默认），或使用场景自带的日期             |
| `--start <date>`        | 第一个事件的日期；同时会把时钟设为固定                                 |
| `--seed <text>`         | 每次运行生成相同的交易 ID 和 notificationUUID                          |
| `--retries <n>`         | 把失败的通知原样重发，最多 5 次                                        |
| `--duplicate`           | 每条通知发送两次                                                       |
| `--timeout <ms>`        | 每个请求的时间限制，默认 10000                                         |
| `-H, --header <header>` | 为 webhook 及其检查添加额外的请求头，可重复使用                        |
| `--out <folder>`        | 同时把每个请求正文写入文件                                             |
| `--dry-run`             | 只签名并写入，不发送                                                   |
| `-f, --format <format>` | `tty`（默认）、`text`、`markdown` 或 `json`；`--json` 是最后一项的简写 |
| `-o, --output <file>`   | 把报告写入文件                                                         |

退出码：`0` 表示每条通知都通过（得到 200 到 206 的响应，或符合该步骤的 `expect`，且其检查匹配），
`1` 表示投递、预期或检查失败，`2` 表示参数错误、没有测试证书链、场景无法加载或出现意外错误。当某个 JWS 验证不通过时，`asnsim decode` 以 1 退出。

### 发送单条通知

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send` 会先（不发送地）播放该通知所需的历史（`BILLING_RECOVERY` 之前需要订阅和一次续订失败，退款之前需要一次购买），因此它的 ID 和日期是一致的。
`--all` 把 40 种通知各发送一次：可以很快看出是否有某种类型会让你的处理程序出错。

### 编写场景

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

除非用 `after` 或 `at` 调整，否则每一步都发生在该事件应当发生的时间（续订在周期结束时，到期在 billing retry 进行 60 天之后）。
[Write a scenario](docs/guides/scenarios.md) 介绍了每个键。

| 内置场景                       | 步骤                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `trial-renew-refund`           | 免费试用、首次续订、退款                                               |
| `billing-retry-grace-recovery` | 续订、在 Billing Grace Period 内续订失败、宽限期结束、billing recovery |
| `billing-retry-expired`        | 续订失败、重试 60 天后到期                                             |
| `cancel-expire-winback`        | 关闭自动续订、主动到期、通过 win-back 优惠重新订阅                     |
| `upgrade-downgrade`            | 立即升级、下一次续订时降级                                             |
| `price-increase-accepted`      | 涨价待处理、已接受、按新价格续订                                       |
| `price-increase-declined`      | 涨价待处理、到期                                                       |
| `consumable-refund-dispute`    | 消耗型商品、消耗请求、退款、退款被撤销                                 |
| `family-sharing-revoke`        | 通过 Family Sharing 获得访问权限，随后被撤销                           |

### 解码 App Store 发来的内容

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode 对每个 JWS 的检查方式与 Apple 的 `SignedDataVerifier` 在关闭在线检查时相同：三个证书、每个由下一个签发、
Apple 的两个扩展、在 `signedDate` 时有效、ES256 签名；校验对象是 Apple Root CA - G3（内置）、`.asnsim` 中的测试根证书以及所有 `--root`。吊销检查需要 Apple 的 OCSP 服务器，因此不会执行。
Xcode 中的 StoreKit Testing 数据由 Xcode 签名，因此无法通过验证；加上 `--environment Xcode` 后，decode 会不经验证打印它，并报告为未验证，因为 Apple 的验证器也只在配置为 Xcode 环境时才跳过验证。详情见 [Decode what the App Store sent](docs/guides/decode.md)。

### 在 JavaScript 中使用

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## 已对照 Apple 的库检查

| 检查                                                                                                                        | 位置                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 40 种通知中的每一种，包括其交易、续订信息和 app transaction，都由 Apple 的 Node.js 库 3.1.0 在 Sandbox 和 Production 中验证 | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test`                |
| 基于 Apple Node.js 库的 webhook 通过权益场景，并对全部 40 种类型返回 200                                                    | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                                        |
| 全部 40 个正文都由 Apple 的 Swift 库 6.0.0 验证                                                                             | [Examples workflow](.github/workflows/examples.yml)；2026 年 10 月 28 日，在 Mac（Apple silicon，M5 Max）上使用 Swift 6.4 |
| Apple 的真实证书链（Apple Root CA - G3、WWDR G6、2025 年 receipt signing 证书）通过 decode 的证书链检查                     | [test/unit/verify.test.ts](test/unit/verify.test.ts)                                                                      |
| 来自 StoreKit Testing（Xcode 27.1、iOS 27.0 Simulator）的一笔交易和续订信息可以解码                                         | [test/data/xcode](test/data/xcode)                                                                                        |

测试套件共有 24 个文件、402 个测试（单元、集成、快照和端到端），2026 年 10 月 28 日在 Mac（Apple 芯片）上用 Node.js 26 运行 `npm test` 全部通过。

## 演示

| 录制内容                                           | 浅色 · 深色                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `asnsim init`                                      | [浅色](docs/media/demo-init-light.svg) · [深色](docs/media/demo-init-dark.svg)                 |
| 每一步之后都有检查的权益场景（本页顶部）           | [浅色](docs/media/demo-checks-light.svg) · [深色](docs/media/demo-checks-dark.svg)             |
| 带 `--duplicate` 的 `trial-renew-refund`           | [浅色](docs/media/demo-trial-light.svg) · [深色](docs/media/demo-trial-dark.svg)               |
| 一个失败的检查及其修复方法                         | [浅色](docs/media/demo-failure-light.svg) · [深色](docs/media/demo-failure-dark.svg)           |
| 对 StoreKit Testing 签名的交易运行 `asnsim decode` | [浅色](docs/media/demo-decode-xcode-light.svg) · [深色](docs/media/demo-decode-xcode-dark.svg) |

2026 年 10 月 28 日在 Mac（Apple silicon，M5 Max）上使用 Node.js 26.12.1 测得，每项运行七次，包含 Node.js 启动时间：针对 examples/node-receiver 运行 `asnsim send --all`（40 条通知，接收端用 Apple 的库逐条验证）耗时 0.16 到 0.23 秒，中位数 0.17 秒；加上 `--dry-run` 时为 0.11 到 0.13 秒。

## 状态

| 功能                                                                                        | 状态         |
| ------------------------------------------------------------------------------------------- | ------------ |
| 测试证书链、签名、40 对通知、Sandbox 和 Production                                          | 可用         |
| 带检查的场景、重复发送、重试、实时时钟与固定时钟；九个内置场景                              | 可用         |
| 使用 Apple Root CA - G3、测试根证书和 StoreKit Testing 数据的 decode                        | 可用         |
| 终端、文本、Markdown 和 JSON 报告；退出码                                                   | 可用         |
| `billingPlanType`、`commitmentInfo`、`eligibleWinBackOfferIds`、`advancedCommerceInfo` 字段 | 计划中 (0.2) |
| 一个场景中包含多位客户和订阅组                                                              | 计划中 (0.2) |
| 乱序投递以及实时的 Production 重试时间表                                                    | 计划中 (0.3) |
| App Store Server API mock（Get Transaction History、Get All Subscription Statuses）         | 计划中 (0.4) |
| 稳定的场景格式和 JSON 结构                                                                  | 计划中 (1.0) |

## 局限

- **模拟而非捕获。** 载荷遵循 Apple 的字段定义以及它对每条通知的说明，并不是 Apple 服务器所发内容的副本。在 Apple 页面没有给出取值的地方（交易 ID 格式、宽限期长度、storefront），asnsim 会选定一个值，列在 [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes) 中，并且每个值都可以通过每一步的 `set` 修改。
- **是测试根证书，不是 Apple 的。** asnsim 签名的任何内容都无法通过 Apple Root CA - G3 的验证。后端必须在测试中信任 `.asnsim/root.cer`，并且绝不能在 Production 中信任它。
- **在线检查已关闭。** 开启在线检查时，Apple 的验证器会通过 Apple 的 OCSP 服务器检查吊销情况；测试证书链没有 OCSP 服务器，所以测试要在关闭在线检查的情况下运行。
- **每个场景只有一位客户，** 包含一个订阅组和任意数量的一次性购买。
- **输入有上限。** 场景文件最大 1 MB、最多 500 步，decode 输入最大 2 MB，JWS 最多 1,000,000 个字符，证书最多嵌套 32 层，每个响应只读取前 64 KB。

## 文档

API 参考与指南：[muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/)。

## 指南

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## 参考资料

2026 年 10 月 28 日查阅：

- Apple，App Store Server Notifications：
  [notificationType](https://developer.apple.com/documentation/appstoreservernotifications/notificationtype)，
  [subtype](https://developer.apple.com/documentation/appstoreservernotifications/subtype)，
  [responseBodyV2DecodedPayload](https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload)，
  [data](https://developer.apple.com/documentation/appstoreservernotifications/data)，
  [summary](https://developer.apple.com/documentation/appstoreservernotifications/summary)，
  [externalPurchaseToken](https://developer.apple.com/documentation/appstoreservernotifications/externalpurchasetoken)，
  [appData](https://developer.apple.com/documentation/appstoreservernotifications/appdata)，
  [status](https://developer.apple.com/documentation/appstoreservernotifications/status)，
  [notificationUUID](https://developer.apple.com/documentation/appstoreservernotifications/notificationuuid)，
  [JWSDecodedHeader](https://developer.apple.com/documentation/appstoreservernotifications/jwsdecodedheader)，
  [Responding to App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications)，
  [Enabling App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/enabling-app-store-server-notifications)，
  [changelog](https://developer.apple.com/documentation/appstoreservernotifications/app-store-server-notifications-changelog)。
- Apple，App Store Server API：
  [JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)，
  [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload)，
  [JWSAppTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsapptransactiondecodedpayload)，
  [Request a Test Notification](https://developer.apple.com/documentation/appstoreserverapi/request-a-test-notification)，以及由这些页面链接的取值页面（expirationIntent、revocationReason、revocationType、
  offerType、offerDiscountType、transactionReason、autoRenewStatus、priceIncreaseStatus）。
- Apple PKI：[Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/)。
- Apple 的 App Store Server Library：
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0)、
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0)、
  [Java](https://github.com/apple/app-store-server-library-java) 和
  [Python](https://github.com/apple/app-store-server-library-python)：即 `SignedDataVerifier` 所做的检查。
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515)（JWS）和
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)（X.509）。

## 系统要求

macOS、Linux 或 Windows 上的 Node.js 22.12 或更高版本。无需其他任何东西：不需要 Xcode，不需要 Apple 账号，除你的 webhook 之外也不需要网络。Swift 示例需要 Swift 6.4：它的 Package.resolved 锁定了 swift-collections 1.7.5，而该版本需要 Swift tools 6.4。

## 架构

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

- 通知数据与代码分开存放，并由测试对照 Apple 的页面进行检查。
- CLI（`src/cli/`）只负责解析参数、选择颜色和宽度，以及设置退出码。
- 没有任何依赖负责签名或解析证书：asnsim 自己编写和读取 DER，签名由 Node.js 的 `crypto` 完成。

## 相关项目

[glassready](https://github.com/muhittincamdali/glassready) 会告诉你，在使用 iOS 27 SDK 构建的应用中 Liquid Glass 改变了什么；
[a11ylabel](https://github.com/muhittincamdali/a11ylabel) 则告诉你可以声明哪些 App Store 无障碍标签。
asnsim 测试的是这些购买背后的后端会如何处理。

## 常见问题

**这能取代在 Sandbox 中测试吗？** 不能。Sandbox 测试的是真实的 App Store 和你的 App Store Connect 配置；
asnsim 测试的是你的后端如何处理每一种通知，你可以在两次 Sandbox 测试之前和之间随时运行。

**asnsim 发出的通知会到达 Production 服务器吗？** 只有当该服务器信任测试根证书时才会。只信任 Apple Root CA - G3 的服务器会拒绝 asnsim 的每一条通知，测试也对此做了检查。

**需要针对 Flutter 或 React Native 做专门的配置吗？** 不需要。无论应用用什么编写，通知都是从 App Store 发送到你的服务器；
asnsim 测试的是处理这些通知的后端。

## 参与贡献

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## 许可证

基于 MIT 许可证发布。详见 [LICENSE](LICENSE)。
