<!-- i18n-source: README.md@1fb13db0df730411c4e802dfc83364845f082f93 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="CI 상태"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="최신 버전: v0.1.0"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="언어 버전: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="라이선스: MIT"></picture></a>
</p>

<p align="center">
<a href="#빠른-시작"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ko-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ko-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ko-light.svg" alt="시작하기"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ko-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ko-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ko-light.svg" alt="문서"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ko-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ko-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ko-light.svg" alt="가이드"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ko-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ko-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ko-light.svg" alt="예제"></picture></a>
</p>

> 이 문서는 영어 README의 번역본입니다. 내용이 다를 경우 영어 버전이 최신입니다.

<!-- brand:end -->

Apple의 Request a Test Notification 엔드포인트는 `TEST` 유형만 보내고, Sandbox는 각 App Store Server Notification을 한 번만 보내며 Production과 같은 재전송은 하지 않습니다. asnsim은 Apple이 문서화한 모든 알림 유형과 하위 유형(40쌍, 2026년 10월 28일에 확인했으며 Apple이 2026년 10월 23일 Production에서 사용할 수 있게 한 `ASSIGNED`와 `ASSIGNMENT_REVOKE` 값을 포함합니다)을 App Store가 서명하는 방식 그대로 서명해, 사용자의 컴퓨터에서 webhook으로 보냅니다. 백엔드는 Apple의 검증 코드를 그대로 쓰고, asnsim의 테스트 루트는 테스트에서만 신뢰합니다.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml: Apple의 Node.js 라이브러리로 만든 webhook에 알림 5개를 보내고, 각 알림에 200이 응답된 뒤 고객의 권한(entitlement)을 확인합니다. 알림 5개 중 5개 통과, 요청 11건"></picture>

<sub>실제 CLI로 <a href="examples/node-receiver">examples/node-receiver</a>를 대상으로 녹화했습니다.
Apple의 Node.js 라이브러리로 만든 webhook입니다(<code>npm run demo</code>).</sub>

## 주요 기능

- **40가지 알림 전체를 일관되게 보냅니다.** `SUBSCRIBED`, `DID_RENEW`, Billing Grace Period가 있을 때와 없을 때의 `DID_FAIL_TO_RENEW`, 사유별 `EXPIRED`, 업그레이드, 다운그레이드, 가격 인상, 환불과 환불 취소, Family Sharing 및 조직의 철회, 소비 요청, 갱신 연장, 외부 구매 토큰, `RESCIND_CONSENT`, Advanced Commerce 유형을 모두 보냅니다. 한 고객의 거래 ID, 날짜, 갱신 정보는 단계가 바뀌어도 일관되게 유지됩니다.
- **Apple의 라이브러리로 검증했습니다.** 테스트에서는 모든 알림을 Apple Node.js 라이브러리 3.1.0의 `SignedDataVerifier`에 Sandbox와 Production 모두로 전달합니다. Apple의 Swift 라이브러리 6.0.0은 Mac(Apple silicon)에서 Swift 6.4로 40가지를 모두 검증했습니다.
- **검사가 포함된 시나리오.** 단계를 나열한 YAML 파일이며, 각 단계 뒤에 백엔드가 무엇을 했는지 확인하는 요청을 선택적으로 붙일 수 있습니다. 예를 들어 "`REFUND` 뒤에 `GET /entitlements/{originalTransactionId}`가 `active: false`를 반환한다"와 같습니다. 시나리오 9개가 내장되어 있습니다.
- **App Store의 전송 규칙.** 200~206은 성공이고, 그 밖의 응답(리디렉션 포함)은 전송 실패입니다. `--retries`는 Production처럼 내용을 바꾸지 않고 다시 보내며, `--duplicate`는 각 알림을 두 번 보내 서버가 중복된 `notificationUUID`를 무시하는지 테스트합니다.
- **실제 데이터를 읽는 디코더.** `asnsim decode`는 알림 본문, 서명된 거래, App Store Server API 응답을 읽어 안에 든 모든 JWS를 디코딩하고, Apple의 라이브러리와 같은 방식으로 오프라인에서 Apple Root CA - G3에 대해 검증합니다. Xcode의 StoreKit Testing 데이터도 읽을 수 있습니다.
- **CI를 위해 만들었습니다.** 터미널, 텍스트, Markdown, JSON 보고서를 지원하며, 종료 코드 0은 통과, 1은 전송·검사·검증 실패, 2는 사용법 오류입니다.

## 빠른 시작

**1. asnsim을 설치합니다.** Node.js도 함께 설치해 주는 [Homebrew](https://brew.sh/)를 쓰는 경우:

```sh
brew install muhittincamdali/tap/asnsim
```

또는 [GitHub release](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0)에서 npm으로 설치합니다. 이 경우
[Node.js](https://nodejs.org/) 22.12 이상이 필요합니다(`node --version`으로 확인할 수 있습니다):

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.0/asnsim-0.1.0.tgz
```

이 패키지는 아직 npm registry에 없으며, `@mcamdali/asnsim`이라는 이름으로 게시할 계획입니다.
두 명령 모두 같은 release tarball을 설치합니다.

**2. 테스트 인증서 체인을 만들고, 백엔드가 테스트에서 이를 신뢰하게 합니다.** 프로젝트 폴더에서:

```sh
asnsim init --bundle-id com.example.app
```

이 명령은 `.asnsim/`을 만듭니다. 백엔드의 테스트 설정에서 Apple의 `SignedDataVerifier`에
루트 인증서로 `.asnsim/root.cer` 파일을 지정하고 온라인 검사를 끈 다음 백엔드를 시작하세요.
[Trust the test root](docs/guides/trust-the-test-root.md)에 Node.js, Swift, Java, Python용 코드가 있습니다.

**3. webhook으로 알림을 보냅니다:**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

서버가 App Store가 기대하는 대로 응답하면 모든 줄이 `ok`로 끝납니다. `failed` 줄은
무슨 일이 있었는지와 해결 방법을 알려 줍니다. 자세한 내용은 [Troubleshooting](docs/guides/troubleshooting.md)을 참고하세요.

## asnsim이 보내는 것

POST 본문은 App Store가 보내는 것과 같은 `{"signedPayload": "…"}`입니다. JWS는 Apple의 검증기가 확인하는
Apple 확장 두 개를 가진 인증서 세 개짜리 체인으로 ES256 서명됩니다. 모든 인증서 이름에는 `asnsim (not Apple)`이 들어 있습니다.
안에 든 거래 정보와 갱신 정보도 같은 방식으로 서명되며, 필드는 Apple의
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)와
[JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload)를 따릅니다.

| 분류                 | 알림                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 구매 및 갱신         | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`     |
| 결제 문제            | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                        |
| 만료                 | `EXPIRED`, 하위 유형은 `VOLUNTARY`, `BILLING_RETRY`, `PRICE_INCREASE`, `PRODUCT_NOT_FOR_SALE` 또는 없음              |
| 고객이 일으키는 변경 | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)           |
| 환불 및 철회         | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                      |
| 개발자의 요청        | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                                 |
| 기타 페이로드        | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT`, Advanced Commerce의 `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE` |

`asnsim types`는 각 쌍을, Apple이 접근 권한 측면에서 그 의미를 어떻게 설명하는지와 함께 출력합니다. 그 바탕이 되는 데이터는
[catalog/notifications.json](catalog/notifications.json)이며, 테스트는 이를 2026년 10월 28일에 읽었을 때 Apple 페이지에 나열된 값(테스트에 사본으로 보관)과 비교합니다. Apple이 나중에 추가한 type이나 subtype은 자동으로 잡히지 않고, 그 사본을 갱신해야 드러납니다.
[What asnsim sends](docs/guides/notifications.md)에는 각 알림이 바꾸는 필드와, Apple 페이지에 값이 없는 곳에서 asnsim이 고르는 값이 정리되어 있습니다.

## 사용법

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| 옵션 (run, send)        | 설명                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `-u, --url <url>`       | webhook                                                                          |
| `-d, --dir <folder>`    | `asnsim init`이 만든 폴더, 기본값은 `.asnsim`                                    |
| `--clock live\|fixed`   | 각 알림을 보낼 때의 날짜로 기록(기본값)하거나, 시나리오 자체의 날짜를 사용       |
| `--start <date>`        | 첫 이벤트의 날짜. 시계가 fixed로 설정됩니다                                      |
| `--seed <text>`         | 실행할 때마다 같은 거래 ID와 notificationUUID를 사용                             |
| `--retries <n>`         | 실패한 알림을 내용 변경 없이 최대 5번 다시 보냄                                  |
| `--duplicate`           | 모든 알림을 두 번 보냄                                                           |
| `--timeout <ms>`        | 요청당 제한 시간, 기본값은 10000                                                 |
| `-H, --header <header>` | webhook과 그 검사에 붙일 추가 요청 헤더, 여러 번 지정 가능                       |
| `--out <folder>`        | 각 요청 본문을 파일로도 저장                                                     |
| `--dry-run`             | 서명하고 저장만 하며 아무것도 보내지 않음                                        |
| `-f, --format <format>` | `tty`(기본값), `text`, `markdown`, `json`. `--json`은 마지막 항목의 줄임말입니다 |
| `-o, --output <file>`   | 보고서를 파일로 저장                                                             |

종료 코드: `0`은 모든 알림이 통과(200~206으로 응답했거나 단계의 `expect`와 일치하고, 검사도 일치)했다는 뜻이고,
`1`은 전송, 기대값, 검사 중 하나가 실패했다는 뜻이며, `2`는 잘못된 인수, 테스트 체인 없음,
불러올 수 없는 시나리오, 예기치 못한 오류를 뜻합니다. JWS 검증에 실패하면 `asnsim decode`는 1로 종료합니다.

### 알림 하나 보내기

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send`는 해당 알림에 필요한 이력(`BILLING_RECOVERY` 앞에는 구독과 갱신 실패, 환불 앞에는 구매)을
보내지 않고 먼저 재현하므로 ID와 날짜가 서로 일관됩니다.
`--all`은 40가지를 각각 한 번씩 보냅니다. 어떤 유형도 핸들러를 실패하게 하지 않는지 빠르게 확인할 수 있습니다.

### 시나리오 작성하기

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

`after`나 `at`으로 옮기지 않으면 각 단계는 그 이벤트가 실제로 일어날 시점에 발생합니다(갱신은 기간이 끝날 때, 만료는 billing retry 60일 뒤).
[Write a scenario](docs/guides/scenarios.md)에 모든 키가 설명되어 있습니다.

| 내장 시나리오                  | 단계                                                                      |
| ------------------------------ | ------------------------------------------------------------------------- |
| `trial-renew-refund`           | 무료 체험, 첫 갱신, 환불                                                  |
| `billing-retry-grace-recovery` | 갱신, Billing Grace Period 중 갱신 실패, 유예 기간 종료, billing recovery |
| `billing-retry-expired`        | 갱신 실패, 재시도 60일 뒤 만료                                            |
| `cancel-expire-winback`        | 자동 갱신 끄기, 자발적 만료, win-back 오퍼로 재구독                       |
| `upgrade-downgrade`            | 즉시 업그레이드, 다음 갱신 때 다운그레이드                                |
| `price-increase-accepted`      | 가격 인상 보류, 수락, 새 가격으로 갱신                                    |
| `price-increase-declined`      | 가격 인상 보류, 만료                                                      |
| `consumable-refund-dispute`    | 소모성 상품, 소비 요청, 환불, 환불 취소                                   |
| `family-sharing-revoke`        | Family Sharing을 통한 접근, 이후 철회                                     |

### App Store가 보낸 것 디코딩하기

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode는 온라인 검사를 끈 Apple의 `SignedDataVerifier`와 같은 방식으로 각 JWS를 검사합니다.
인증서 세 개가 각각 다음 인증서에서 발급되었는지, Apple 확장 두 개, `signedDate` 시점의 유효 기간,
ES256 서명을 Apple Root CA - G3(내장), `.asnsim`의 테스트 루트, 지정한 모든 `--root`에 대해 확인합니다.
폐기 여부 확인에는 Apple의 OCSP 서버가 필요하므로 검사하지 않습니다.
Xcode의 StoreKit Testing 데이터는 Xcode가 서명한 것이므로, decode는 이를 출력하고 검증은 건너뜁니다. Apple의 라이브러리도 그렇게 합니다.
자세한 내용은 [Decode what the App Store sent](docs/guides/decode.md)를 참고하세요.

### JavaScript에서 사용하기

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## Apple의 라이브러리로 확인한 내용

| 확인 항목                                                                                                                 | 위치                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 40가지 알림 각각과 그 거래, 갱신 정보, app transaction을 Apple의 Node.js 라이브러리 3.1.0이 Sandbox와 Production에서 검증 | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test`      |
| Apple의 Node.js 라이브러리로 만든 webhook이 권한 시나리오를 통과하고 40가지 유형 모두에 200으로 응답                      | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                              |
| 40개 본문 모두를 Apple의 Swift 라이브러리 6.0.0이 검증                                                                    | [Examples workflow](.github/workflows/examples.yml). 2026년 10월 28일, Mac(Apple silicon, M5 Max)에서 Swift 6.4 |
| Apple의 실제 체인(Apple Root CA - G3, WWDR G6, 2025년 receipt signing 인증서)이 decode의 체인 검사를 통과                 | [test/unit/verify.test.ts](test/unit/verify.test.ts)                                                            |
| StoreKit Testing(Xcode 27.1, iOS 27.0 Simulator)의 거래와 갱신 정보를 디코딩                                              | [test/data/xcode](test/data/xcode)                                                                              |

테스트 스위트는 테스트 280개(단위, 통합, 스냅샷, 엔드투엔드)로 이루어져 있습니다.

## 데모

| 녹화                                                    | 라이트 · 다크                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `asnsim init`                                           | [라이트](docs/media/demo-init-light.svg) · [다크](docs/media/demo-init-dark.svg)                 |
| 각 단계 뒤에 검사가 붙은 권한 시나리오(이 페이지 맨 위) | [라이트](docs/media/demo-checks-light.svg) · [다크](docs/media/demo-checks-dark.svg)             |
| `--duplicate`를 붙인 `trial-renew-refund`               | [라이트](docs/media/demo-trial-light.svg) · [다크](docs/media/demo-trial-dark.svg)               |
| 실패하는 검사와 해결 방법                               | [라이트](docs/media/demo-failure-light.svg) · [다크](docs/media/demo-failure-dark.svg)           |
| StoreKit Testing이 서명한 거래에 `asnsim decode` 실행   | [라이트](docs/media/demo-decode-xcode-light.svg) · [다크](docs/media/demo-decode-xcode-dark.svg) |

2026년 10월 28일 Mac(Apple silicon, M5 Max)에서 Node.js 26.12.1로 각각 일곱 번씩 실행해 측정했으며
Node.js 시작 시간을 포함합니다. examples/node-receiver를 대상으로 한 `asnsim send --all`(알림 40개, 수신 쪽에서 각각 Apple의 라이브러리로 검증)은
0.16초에서 0.23초, 중앙값 0.17초가 걸렸고, `--dry-run`을 붙이면 0.11초에서 0.13초가 걸렸습니다.

## 상태

| 기능                                                                                        | 상태       |
| ------------------------------------------------------------------------------------------- | ---------- |
| 테스트 체인, 서명, 알림 40쌍, Sandbox와 Production                                          | 동작함     |
| 검사가 있는 시나리오, 중복 전송, 재시도, 실시간 시계와 고정 시계, 내장 시나리오 9개         | 동작함     |
| Apple Root CA - G3, 테스트 루트, StoreKit Testing 데이터를 지원하는 decode                  | 동작함     |
| 터미널, 텍스트, Markdown, JSON 보고서와 종료 코드                                           | 동작함     |
| `billingPlanType`, `commitmentInfo`, `eligibleWinBackOfferIds`, `advancedCommerceInfo` 필드 | 예정 (0.2) |
| 시나리오 하나에 여러 고객과 구독 그룹                                                       | 예정 (0.2) |
| 순서가 뒤바뀐 전송과 Production 재시도 일정의 실시간 재현                                   | 예정 (0.3) |
| App Store Server API mock (Get Transaction History, Get All Subscription Statuses)          | 예정 (0.4) |
| 안정적인 시나리오 형식과 JSON 구조                                                          | 예정 (1.0) |

## 한계

- **캡처한 것이 아니라 시뮬레이션입니다.** 페이로드는 Apple의 필드 정의와 각 알림에 대한 설명을 따르며,
  Apple 서버가 실제로 보내는 것을 복사한 것이 아닙니다. Apple 페이지에 값이 없는 곳(거래 ID 형식, 유예 기간 길이, storefront)에서는
  asnsim이 값을 고르며, 그 목록은 [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes)에 있습니다.
  모든 값은 단계별로 `set`으로 바꿀 수 있습니다.
- **Apple의 루트가 아니라 테스트 루트입니다.** asnsim이 서명한 것은 어느 것도 Apple Root CA - G3에 대해 검증되지 않습니다. 백엔드는
  테스트에서 `.asnsim/root.cer`를 신뢰해야 하고, Production에서는 절대 신뢰해서는 안 됩니다.
- **온라인 검사는 꺼져 있습니다.** 온라인 검사를 켜면 Apple의 검증기는 Apple의 OCSP 서버로 폐기 여부를 확인합니다.
  테스트 체인에는 OCSP 서버가 없으므로 테스트는 온라인 검사를 끈 상태로 실행합니다.
- **시나리오 하나에 고객 한 명,** 구독 그룹 하나와 임의 개수의 일회성 구매를 다룹니다.
- **입력에는 한도가 있습니다.** 시나리오 파일은 1 MB, 500단계까지, decode 입력은 2 MB까지, JWS는 1,000,000자까지,
  인증서 중첩은 최대 32단계, 각 응답은 처음 64 KB까지만 읽습니다.

## 문서

API 레퍼런스와 가이드: [muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/).

## 가이드

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## 출처

2026년 10월 28일에 확인했습니다:

- Apple, App Store Server Notifications:
  [notificationType](https://developer.apple.com/documentation/appstoreservernotifications/notificationtype),
  [subtype](https://developer.apple.com/documentation/appstoreservernotifications/subtype),
  [responseBodyV2DecodedPayload](https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload),
  [data](https://developer.apple.com/documentation/appstoreservernotifications/data),
  [summary](https://developer.apple.com/documentation/appstoreservernotifications/summary),
  [externalPurchaseToken](https://developer.apple.com/documentation/appstoreservernotifications/externalpurchasetoken),
  [appData](https://developer.apple.com/documentation/appstoreservernotifications/appdata),
  [status](https://developer.apple.com/documentation/appstoreservernotifications/status),
  [notificationUUID](https://developer.apple.com/documentation/appstoreservernotifications/notificationuuid),
  [JWSDecodedHeader](https://developer.apple.com/documentation/appstoreservernotifications/jwsdecodedheader),
  [Responding to App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications),
  [Enabling App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/enabling-app-store-server-notifications),
  [changelog](https://developer.apple.com/documentation/appstoreservernotifications/app-store-server-notifications-changelog).
- Apple, App Store Server API:
  [JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload),
  [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload),
  [JWSAppTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsapptransactiondecodedpayload),
  [Request a Test Notification](https://developer.apple.com/documentation/appstoreserverapi/request-a-test-notification),
  그리고 여기서 링크된 값 페이지(expirationIntent, revocationReason, revocationType,
  offerType, offerDiscountType, transactionReason, autoRenewStatus, priceIncreaseStatus).
- Apple PKI: [Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/).
- Apple의 App Store Server Library:
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0),
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0),
  [Java](https://github.com/apple/app-store-server-library-java),
  [Python](https://github.com/apple/app-store-server-library-python).
  `SignedDataVerifier`가 수행하는 검사를 참고했습니다.
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (JWS)와
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280) (X.509).

## 요구 사항

macOS, Linux, Windows에서 Node.js 22.12 이상. 그 밖에는 필요하지 않습니다. Xcode도, Apple 계정도,
webhook 외의 네트워크도 필요 없습니다. Swift 예제에는 Swift 6.0 이상이 필요합니다.

## 아키텍처

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

- 알림 데이터는 코드와 분리되어 있으며, 테스트가 Apple의 페이지와 대조해 확인합니다.
- CLI(`src/cli/`)는 인수를 파싱하고, 색상과 너비를 정하고, 종료 코드를 설정하는 일만 합니다.
- 인증서를 서명하거나 파싱하는 의존성은 없습니다. asnsim이 DER을 직접 쓰고 읽으며, 서명은 Node.js의 `crypto`가 합니다.

## 관련 프로젝트

[glassready](https://github.com/muhittincamdali/glassready)는 iOS 27 SDK로 빌드한 앱에서 Liquid Glass가 무엇을 바꾸는지,
[a11ylabel](https://github.com/muhittincamdali/a11ylabel)은 어떤 App Store 접근성 라벨을 표시할 수 있는지 보여 줍니다.
asnsim은 앱 내 구매 뒤에 있는 백엔드가 무엇을 하는지 테스트합니다.

## FAQ

**Sandbox 테스트를 대체하나요?** 아니요. Sandbox는 실제 App Store와 App Store Connect 설정을 테스트하고,
asnsim은 Sandbox 실행 전과 사이에 백엔드가 모든 알림을 어떻게 처리하는지를 원하는 만큼 자주 테스트합니다.

**asnsim의 알림이 Production 서버에 도달할 수 있나요?** 그 서버가 테스트 루트를 신뢰하는 경우에만 가능합니다.
Apple Root CA - G3만 신뢰하는 서버는 테스트에서 확인하듯 asnsim의 모든 알림을 거부합니다.

**Flutter나 React Native 전용 설정이 필요한가요?** 아니요. 앱을 무엇으로 만들었든 알림은 App Store에서 서버로 갑니다.
asnsim이 테스트하는 것은 그 알림을 처리하는 백엔드입니다.

## 기여하기

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## 라이선스

MIT 라이선스로 배포됩니다. 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.
