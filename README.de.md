<!-- i18n-source: README.md@1fb13db0df730411c4e802dfc83364845f082f93 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="CI-Status"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="Aktuelle Version: v0.1.0"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="Sprachversion: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="Lizenz: MIT"></picture></a>
</p>

<p align="center">
<a href="#schnellstart"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-de-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-de-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-de-light.svg" alt="Loslegen"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-de-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-de-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-de-light.svg" alt="Dokumentation"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-de-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-de-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-de-light.svg" alt="Anleitungen"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-de-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-de-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-de-light.svg" alt="Beispiele"></picture></a>
</p>

> Dies ist eine Übersetzung der englischen README. Bei Abweichungen gilt die englische Fassung.

<!-- brand:end -->

Der Endpunkt Request a Test Notification von Apple sendet nur den Typ `TEST`, und Apples Sandbox sendet jede App Store Server Notification nur einmal, ohne die Wiederholungen der Produktion. asnsim sendet jeden Benachrichtigungstyp und Subtyp, den Apple dokumentiert (40 Paare, gelesen am 28. Oktober 2026, einschließlich der Werte `ASSIGNED` und `ASSIGNMENT_REVOKE`, die Apple am 23. Oktober 2026 in der Produktion bereitgestellt hat), so signiert, wie der App Store sie signiert, von deinem eigenen Rechner an deinen Webhook. Dein Backend behält Apples eigenen Verifizierungscode und vertraut dem Test-Root von asnsim nur in seinen Tests.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml: fünf Benachrichtigungen an einen Webhook auf Basis von Apples Node.js-Bibliothek, jede mit 200 beantwortet und gefolgt von einer Prüfung des Zugriffsrechts (Entitlement) des Kunden; 5 von 5 Benachrichtigungen bestanden, 11 Anfragen"></picture>

<sub>Aufgezeichnet mit der echten CLI gegen <a href="examples/node-receiver">examples/node-receiver</a>,
einen Webhook auf Basis von Apples Node.js-Bibliothek (<code>npm run demo</code>).</sub>

## Highlights

- **Alle 40 Benachrichtigungen, in sich stimmig.** `SUBSCRIBED`, `DID_RENEW`, `DID_FAIL_TO_RENEW` mit und ohne Billing Grace Period, `EXPIRED` für jeden Grund, Upgrades, Downgrades, Preiserhöhungen, Rückerstattungen und ihre Rücknahme, Widerrufe über Family Sharing und durch Organisationen, Verbrauchsanfragen, Verlängerungen der Laufzeit, Tokens für externe Käufe, `RESCIND_CONSENT` und die Advanced-Commerce-Typen. Transaktions-IDs, Daten und Verlängerungsinformationen eines Kunden bleiben von Schritt zu Schritt stimmig.
- **Mit Apples Bibliotheken verifiziert.** Die Tests übergeben jede Benachrichtigung an den `SignedDataVerifier` aus Apples Node.js-Bibliothek 3.1.0, in Sandbox und Production; Apples Swift-Bibliothek 6.0.0 hat alle 40 auf einem Mac (Apple silicon) mit Swift 6.4 verifiziert.
- **Szenarien mit Prüfungen.** Eine YAML-Datei mit Schritten, auf die jeweils eine optionale Anfrage folgen kann, die prüft, was dein Backend getan hat: „Nach `REFUND` meldet `GET /entitlements/{originalTransactionId}` `active: false`“. Neun Szenarien sind eingebaut.
- **Die Zustellregeln des App Store.** 200 bis 206 ist Erfolg, alles andere (auch Weiterleitungen) eine fehlgeschlagene Zustellung; `--retries` sendet unverändert erneut, wie es die Produktion tut, und `--duplicate` sendet jede Benachrichtigung zweimal, um zu testen, dass dein Server eine wiederholte `notificationUUID` ignoriert.
- **Ein Decoder für das Original.** `asnsim decode` liest einen Benachrichtigungs-Body, eine signierte Transaktion oder eine Antwort der App Store Server API, dekodiert jedes darin enthaltene JWS und prüft es wie Apples Bibliotheken offline gegen Apple Root CA - G3. Auch StoreKit-Testing-Daten aus Xcode liest er.
- **Für CI gemacht.** Berichte als Terminal-Ausgabe, Text, Markdown und JSON; Exit-Code 0 bedeutet bestanden, 1 eine fehlgeschlagene Zustellung, Prüfung oder Verifizierung, 2 einen Aufruffehler.

## Schnellstart

**1. asnsim installieren.** Mit [Homebrew](https://brew.sh/), das auch Node.js installiert:

```sh
brew install muhittincamdali/tap/asnsim
```

Oder mit npm aus dem [GitHub-Release](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0); dafür wird
[Node.js](https://nodejs.org/) 22.12 oder neuer benötigt (`node --version` zeigt es an):

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.0/asnsim-0.1.0.tgz
```

Das Paket ist noch nicht in der npm-Registry; die Veröffentlichung dort als `@mcamdali/asnsim` ist geplant.
Beide Befehle installieren denselben Release-Tarball.

**2. Die Testkette erzeugen und dein Backend ihr in Tests vertrauen lassen.** Im Ordner deines Projekts:

```sh
asnsim init --bundle-id com.example.app
```

Das schreibt `.asnsim/`. Gib in der Testkonfiguration deines Backends dem `SignedDataVerifier` von Apple
die Datei `.asnsim/root.cer` als Root-Zertifikat, mit ausgeschalteten Online-Prüfungen,
und starte das Backend. [Trust the test root](docs/guides/trust-the-test-root.md) zeigt die Zeilen
für Node.js, Swift, Java und Python.

**3. Benachrichtigungen an deinen Webhook senden:**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

Jede Zeile endet auf `ok`, wenn dein Server so geantwortet hat, wie der App Store es erwartet. Eine `failed`-Zeile
sagt, was passiert ist und wie du es behebst; [Troubleshooting](docs/guides/troubleshooting.md) enthält die
Einzelheiten.

## Was asnsim sendet

Der POST-Body ist der, den der App Store sendet: `{"signedPayload": "…"}`. Das JWS wird mit
ES256 von einer Kette aus drei Zertifikaten signiert, die die beiden Apple-Erweiterungen tragen, auf die Apples Verifizierer prüfen;
jeder Zertifikatsname enthält `asnsim (not Apple)`. Darin liegen die Transaktion und die Verlängerungsinformationen,
auf dieselbe Weise signiert, mit den Feldern aus Apples
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
und [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload).

| Familie                     | Benachrichtigungen                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Kauf und Verlängerung       | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`   |
| Abrechnungsprobleme         | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                      |
| Ablauf                      | `EXPIRED` mit `VOLUNTARY`, `BILLING_RETRY`, `PRICE_INCREASE`, `PRODUCT_NOT_FOR_SALE` oder ohne Subtyp              |
| Änderungen durch den Kunden | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)         |
| Rückerstattung und Widerruf | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                    |
| Anfragen des Entwicklers    | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                               |
| Weitere Payloads            | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT`; Advanced Commerce `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE` |

`asnsim types` gibt jedes Paar aus, zusammen mit dem, was es nach Apples Angaben für den Zugriff bedeutet. Die Daten dahinter stehen in
[catalog/notifications.json](catalog/notifications.json), und die Tests vergleichen sie mit den Werten, die Apples Seiten beim Lesen am 28. Oktober 2026 nannten und die als Kopie im Test liegen; einen Typ oder Subtyp, den Apple später hinzufügt, bemerken sie nicht von selbst, sondern erst, wenn diese Kopie aktualisiert wird. [What asnsim sends](docs/guides/notifications.md) listet die Felder auf,
die jede Benachrichtigung ändert, und welche Werte asnsim wählt, wo Apples Seiten keine nennen.

## Verwendung

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| Option (run, send)      | Was sie tut                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `-u, --url <url>`       | Der Webhook                                                                                    |
| `-d, --dir <folder>`    | Der Ordner, den `asnsim init` geschrieben hat, Standard `.asnsim`                              |
| `--clock live\|fixed`   | Jede Benachrichtigung beim Senden datieren (Standard) oder mit den eigenen Daten des Szenarios |
| `--start <date>`        | Datum des ersten Ereignisses; setzt die Uhr auf fixed                                          |
| `--seed <text>`         | Bei jedem Lauf dieselben Transaktions-IDs und notificationUUIDs                                |
| `--retries <n>`         | Eine fehlgeschlagene Benachrichtigung unverändert erneut senden, bis zu 5-mal                  |
| `--duplicate`           | Jede Benachrichtigung zweimal senden                                                           |
| `--timeout <ms>`        | Zeitlimit pro Anfrage, Standard 10000                                                          |
| `-H, --header <header>` | Zusätzlicher Request-Header für den Webhook und seine Prüfungen, wiederholbar                  |
| `--out <folder>`        | Jeden Request-Body zusätzlich in eine Datei schreiben                                          |
| `--dry-run`             | Signieren und schreiben, nichts senden                                                         |
| `-f, --format <format>` | `tty` (Standard), `text`, `markdown` oder `json`; `--json` ist die Kurzform des letzten        |
| `-o, --output <file>`   | Den Bericht in eine Datei schreiben                                                            |

Exit-Codes: `0` jede Benachrichtigung bestanden (mit 200 bis 206 beantwortet oder mit dem `expect` des Schritts, und seine
Prüfung stimmte), `1` eine Zustellung, Erwartung oder Prüfung ist fehlgeschlagen, `2` ungültige Argumente, keine Testkette,
ein Szenario, das sich nicht laden lässt, oder ein unerwarteter Fehler. `asnsim decode` beendet sich mit 1, wenn ein JWS
nicht verifiziert wird.

### Eine einzelne Benachrichtigung senden

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send` spielt die Vorgeschichte, die die Benachrichtigung braucht, ohne zu senden ab (ein Abonnement und eine fehlgeschlagene Verlängerung
vor `BILLING_RECOVERY`, ein Kauf vor einer Rückerstattung), sodass IDs und Daten stimmig sind.
`--all` sendet jede der 40 einmal: ein schneller Weg, um zu sehen, dass kein Typ deinen Handler zum Scheitern bringt.

### Ein Szenario schreiben

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

Jeder Schritt findet dann statt, wann das Ereignis stattfinden würde (eine Verlängerung am Ende der Laufzeit, ein Ablauf 60 Tage
nach Beginn des Billing Retry), sofern `after` oder `at` ihn nicht verschiebt. [Write a scenario](docs/guides/scenarios.md)
beschreibt jeden Schlüssel.

| Eingebautes Szenario           | Schritte                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `trial-renew-refund`           | kostenlose Testphase, erste Verlängerung, Rückerstattung                                                      |
| `billing-retry-grace-recovery` | Verlängerung, fehlgeschlagene Verlängerung in der Billing Grace Period, Ende der Kulanzzeit, Billing Recovery |
| `billing-retry-expired`        | fehlgeschlagene Verlängerung, Ablauf nach 60 Tagen Wiederholung                                               |
| `cancel-expire-winback`        | automatische Verlängerung aus, freiwilliger Ablauf, erneutes Abonnement mit Win-back-Angebot                  |
| `upgrade-downgrade`            | Upgrade sofort, Downgrade zur nächsten Verlängerung                                                           |
| `price-increase-accepted`      | Preiserhöhung ausstehend, angenommen, Verlängerung zum neuen Preis                                            |
| `price-increase-declined`      | Preiserhöhung ausstehend, Ablauf                                                                              |
| `consumable-refund-dispute`    | Verbrauchsartikel, Verbrauchsanfrage, Rückerstattung, Rückerstattung zurückgenommen                           |
| `family-sharing-revoke`        | Zugriff über Family Sharing, dann widerrufen                                                                  |

### Entschlüsseln, was der App Store gesendet hat

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode prüft jedes JWS so, wie es der `SignedDataVerifier` von Apple mit ausgeschalteten Online-Prüfungen tut:
drei Zertifikate, jedes vom nächsten ausgestellt, Apples zwei Erweiterungen, Gültigkeit zum `signedDate`, die
ES256-Signatur, und zwar gegen Apple Root CA - G3 (eingebaut), den Test-Root in `.asnsim` und jedes
`--root`. Die Sperrprüfung braucht Apples OCSP-Server und findet nicht statt.
Daten aus StoreKit Testing in Xcode signiert Xcode; decode gibt sie aus und überspringt die Prüfung, wie es auch Apples Bibliotheken tun.
[Decode what the App Store sent](docs/guides/decode.md) enthält die Einzelheiten.

### Aus JavaScript

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## Gegen Apples Bibliotheken geprüft

| Prüfung                                                                                                                                                                                    | Wo                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Jede der 40 Benachrichtigungen mit ihrer Transaktion, den Verlängerungsinformationen und der App Transaction, verifiziert von Apples Node.js-Bibliothek 3.1.0 in Sandbox und in Production | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test`                   |
| Ein Webhook auf Basis von Apples Node.js-Bibliothek besteht das Entitlement-Szenario und beantwortet alle 40 Typen mit 200                                                                 | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                                           |
| Alle 40 Bodys von Apples Swift-Bibliothek 6.0.0 verifiziert                                                                                                                                | [Examples workflow](.github/workflows/examples.yml); am 28. Oktober 2026 auf einem Mac (Apple silicon, M5 Max) mit Swift 6.4 |
| Apples echte Kette (Apple Root CA - G3, WWDR G6, das Receipt-Signing-Zertifikat von 2025) besteht die Kettenprüfungen von decode                                                           | [test/unit/verify.test.ts](test/unit/verify.test.ts)                                                                         |
| Eine Transaktion und Verlängerungsinformationen aus StoreKit Testing (Xcode 27.1, iOS 27.0 Simulator) lassen sich dekodieren                                                               | [test/data/xcode](test/data/xcode)                                                                                           |

Die Testsuite umfasst 280 Tests (Unit-, Integrations-, Snapshot- und End-to-End-Tests).

## Demo

| Aufzeichnung                                                                          | Hell · dunkel                                                                                    |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `asnsim init`                                                                         | [hell](docs/media/demo-init-light.svg) · [dunkel](docs/media/demo-init-dark.svg)                 |
| Das Entitlement-Szenario mit einer Prüfung nach jedem Schritt (oben auf dieser Seite) | [hell](docs/media/demo-checks-light.svg) · [dunkel](docs/media/demo-checks-dark.svg)             |
| `trial-renew-refund` mit `--duplicate`                                                | [hell](docs/media/demo-trial-light.svg) · [dunkel](docs/media/demo-trial-dark.svg)               |
| Eine fehlschlagende Prüfung mit ihrer Lösung                                          | [hell](docs/media/demo-failure-light.svg) · [dunkel](docs/media/demo-failure-dark.svg)           |
| `asnsim decode` auf einer von StoreKit Testing signierten Transaktion                 | [hell](docs/media/demo-decode-xcode-light.svg) · [dunkel](docs/media/demo-decode-xcode-dark.svg) |

Gemessen am 28. Oktober 2026 auf einem Mac (Apple silicon, M5 Max) mit Node.js 26.12.1, jeweils sieben Läufe,
Node.js-Start eingerechnet: `asnsim send --all` gegen examples/node-receiver (40
Benachrichtigungen, jede im Empfänger von Apples Bibliothek verifiziert) dauerte 0,16 bis 0,23 Sekunden,
Median 0,17; dasselbe mit `--dry-run` 0,11 bis 0,13 Sekunden.

## Status

| Funktion                                                                                           | Status        |
| -------------------------------------------------------------------------------------------------- | ------------- |
| Testkette, Signierung, die 40 Benachrichtigungspaare, Sandbox und Production                       | funktioniert  |
| Szenarien mit Prüfungen, Duplikate, Wiederholungen, Live- und feste Uhr; neun eingebaute Szenarien | funktioniert  |
| decode mit Apple Root CA - G3, Test-Roots und StoreKit-Testing-Daten                               | funktioniert  |
| Berichte als Terminal-Ausgabe, Text, Markdown und JSON; Exit-Codes                                 | funktioniert  |
| Felder `billingPlanType`, `commitmentInfo`, `eligibleWinBackOfferIds`, `advancedCommerceInfo`      | geplant (0.2) |
| Mehrere Kunden und Abonnementgruppen in einem Szenario                                             | geplant (0.2) |
| Zustellung in falscher Reihenfolge und der Wiederholungsplan der Produktion in Echtzeit            | geplant (0.3) |
| Mock der App Store Server API (Get Transaction History, Get All Subscription Statuses)             | geplant (0.4) |
| Stabiles Szenarioformat und JSON-Layout                                                            | geplant (1.0) |

## Grenzen

- **Simuliert, nicht mitgeschnitten.** Die Payloads folgen Apples Felddefinitionen und seinen Beschreibungen jeder
  Benachrichtigung; sie sind keine Kopien dessen, was Apples Server senden. Wo Apples Seiten keinen
  Wert nennen (Formate der Transaktions-ID, Länge der Kulanzzeit, die Storefront), wählt asnsim einen, aufgelistet in
  [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes), und jeder Wert lässt sich
  pro Schritt mit `set` ändern.
- **Ein Test-Root, nicht der von Apple.** Nichts, was asnsim signiert, lässt sich gegen Apple Root CA - G3 verifizieren. Ein Backend
  muss `.asnsim/root.cer` in seinen Tests vertrauen und darf ihm in der Produktion niemals vertrauen.
- **Online-Prüfungen aus.** Wenn Online-Prüfungen eingeschaltet sind, prüfen Apples Verifizierer die Sperrung über Apples OCSP-Server;
  die Testkette hat keinen OCSP-Server, deshalb laufen Tests mit ausgeschalteten Prüfungen.
- **Ein Kunde pro Szenario,** mit einer Abonnementgruppe und beliebig vielen Einmalkäufen.
- **Begrenzte Eingaben.** Szenariodateien bis 1 MB und 500 Schritte, decode-Eingaben bis 2 MB, ein JWS bis
  1.000.000 Zeichen, Zertifikate höchstens 32 Ebenen tief verschachtelt und die ersten 64 KB jeder Antwort.

## Dokumentation

API-Referenz und Anleitungen: [muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/).

## Anleitungen

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## Quellen

Gelesen am 28. Oktober 2026:

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
  [Request a Test Notification](https://developer.apple.com/documentation/appstoreserverapi/request-a-test-notification)
  und die Wertseiten, auf die sie verweisen (expirationIntent, revocationReason, revocationType,
  offerType, offerDiscountType, transactionReason, autoRenewStatus, priceIncreaseStatus).
- Apple PKI: [Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/).
- Apples App Store Server Libraries für
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0),
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0),
  [Java](https://github.com/apple/app-store-server-library-java) und
  [Python](https://github.com/apple/app-store-server-library-python): die Prüfungen von
  `SignedDataVerifier`.
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (JWS) und
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280) (X.509).

## Voraussetzungen

Node.js 22.12 oder neuer unter macOS, Linux oder Windows. Sonst nichts: kein Xcode, kein Apple-Konto, kein
Netzwerk außer deinem Webhook. Das Swift-Beispiel braucht Swift 6.0 oder neuer.

## Architektur

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

- Die Benachrichtigungsdaten sind vom Code getrennt, und die Tests prüfen sie gegen Apples Seiten.
- Die CLI (`src/cli/`) parst nur Argumente, wählt Farben und Breiten und setzt den Exit-Code.
- Keine Abhängigkeit signiert oder parst Zertifikate: asnsim schreibt und liest das DER selbst, und das `crypto`
  von Node.js signiert.

## Verwandt

[glassready](https://github.com/muhittincamdali/glassready) zeigt, was Liquid Glass in einer mit dem iOS-27-SDK
gebauten App ändert, und [a11ylabel](https://github.com/muhittincamdali/a11ylabel), welche
Bedienungshilfen-Labels des App Store sie angeben kann. asnsim testet, was das Backend hinter den Käufen tut.

## FAQ

**Ersetzt das Tests in der Sandbox?** Nein. Die Sandbox testet den echten App Store und deine App-Store-Connect-Konfiguration;
asnsim testet, wie dein Backend jede Benachrichtigung verarbeitet, so oft du willst, vor und zwischen den
Sandbox-Läufen.

**Kann eine Benachrichtigung von asnsim einen Produktionsserver erreichen?** Nur wenn dieser Server dem Test-Root
vertraut. Ein Server, der nur Apple Root CA - G3 vertraut, weist jede Benachrichtigung von asnsim ab, wie die Tests
prüfen.

**Brauche ich eine spezielle Einrichtung für Flutter oder React Native?** Nein. Benachrichtigungen gehen vom App Store an
deinen Server, egal, womit die App geschrieben ist; getestet wird von asnsim das Backend, das sie verarbeitet.

## Mitwirken

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## Lizenz

Veröffentlicht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE).
