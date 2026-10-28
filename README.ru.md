<!-- i18n-source: README.md@96700b9724784fa6daebc2437aeedce047a58e27 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="Статус CI"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="Последняя версия: v0.1.2"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="Версия языка: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="Лицензия: MIT"></picture></a>
</p>

<p align="center">
<a href="#быстрый-старт"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ru-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ru-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-ru-light.svg" alt="Начать"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ru-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ru-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-ru-light.svg" alt="Документация"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ru-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ru-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-ru-light.svg" alt="Руководства"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ru-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ru-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-ru-light.svg" alt="Примеры"></picture></a>
</p>

> Это перевод README на английском языке. Если они расходятся, актуальна английская версия.

<!-- brand:end -->

Конечная точка Request a Test Notification от Apple отправляет только тип `TEST`, а её sandbox отправляет каждое App Store Server Notification один раз, без повторных попыток, которые бывают в production. asnsim отправляет все типы и подтипы уведомлений, которые описывает Apple (40 пар; сверено 28 октября 2026 года, включая значения `ASSIGNED` и `ASSIGNMENT_REVOKE`, которые Apple сделала доступными в production 23 октября 2026 года), подписанные так же, как их подписывает App Store, на ваш webhook с вашего же компьютера. Ваш бэкенд продолжает использовать собственный код проверки от Apple и доверяет тестовому корню asnsim только в своих тестах.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml: пять уведомлений на webhook, построенный на библиотеке Apple для Node.js; на каждое получен ответ 200, после чего проверяется право доступа (entitlement) клиента; пройдено 5 из 5 уведомлений, 11 запросов"></picture>

<sub>Записано с настоящим CLI на <a href="examples/node-receiver">examples/node-receiver</a>,
webhook на библиотеке Apple для Node.js (<code>npm run demo</code>).</sub>

## Основные возможности

- **Все 40 уведомлений, согласованные между собой.** `SUBSCRIBED`, `DID_RENEW`, `DID_FAIL_TO_RENEW` с Billing Grace Period и без него, `EXPIRED` для каждой причины, повышение и понижение тарифа, повышение цены, возвраты и их отмена, отзыв доступа через Family Sharing и организацией, запросы на потребление, продление подписки, токены внешней покупки, `RESCIND_CONSENT` и типы Advanced Commerce. Идентификаторы транзакций, даты и данные о продлении одного клиента остаются согласованными от шага к шагу.
- **Проверено библиотеками Apple.** Тесты передают каждое уведомление в `SignedDataVerifier` из библиотеки Apple для Node.js 3.1.0, в Sandbox и в Production; библиотека Apple для Swift 6.0.0 проверила все 40 на Mac (Apple silicon) с Swift 6.4.
- **Сценарии с проверками.** YAML-файл с шагами, после каждого из которых можно добавить необязательный запрос, проверяющий, что сделал ваш бэкенд: «после `REFUND` запрос `GET /entitlements/{originalTransactionId}` возвращает `active: false`». Девять сценариев встроены.
- **Правила доставки App Store.** Ответы от 200 до 206 означают успех, всё остальное (включая перенаправления) — неудачную доставку. `--retries` повторно отправляет уведомление без изменений, как это делает production, а `--duplicate` отправляет каждое уведомление дважды, чтобы проверить, что сервер игнорирует повторный `notificationUUID`.
- **Декодер для настоящих данных.** `asnsim decode` читает тело уведомления, подписанную транзакцию или ответ App Store Server API, декодирует каждый вложенный JWS и проверяет его по Apple Root CA - G3 офлайн, так же, как это делают библиотеки Apple. Он также читает данные StoreKit Testing из Xcode.
- **Создан для CI.** Отчёты в терминале, в виде текста, Markdown и JSON; код завершения 0 означает успех, 1 — сбой доставки, проверки или верификации, 2 — ошибку использования. Отчёты скрывают учётные данные в URL, значения query, ID и секреты в ответах webhook ([что именно скрывается](docs/guides/ci.md#what-the-reports-hide)).

## Быстрый старт

**1. Установите asnsim.** С помощью [Homebrew](https://brew.sh/), который заодно установит Node.js:

```sh
brew install muhittincamdali/tap/asnsim
```

Или через npm; для этого нужен
[Node.js](https://nodejs.org/) 22.12 или новее (версию покажет `node --version`):

```sh
npm i -g @mcamdali/asnsim
```

Обе команды устанавливают тот же архив, что и [релиз на GitHub](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.2).

**2. Создайте тестовую цепочку и сделайте так, чтобы бэкенд доверял ей в тестах.** В папке вашего проекта:

```sh
asnsim init --bundle-id com.example.app
```

Команда создаёт `.asnsim/`. В тестовой конфигурации бэкенда передайте `SignedDataVerifier` от Apple
файл `.asnsim/root.cer` в качестве корневого сертификата, отключив онлайн-проверки,
и запустите бэкенд. [Trust the test root](docs/guides/trust-the-test-root.md) показывает нужные строки
для Node.js, Swift, Java и Python.

**3. Отправьте уведомления на ваш webhook:**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

Каждая строка заканчивается на `ok`, если сервер ответил так, как ожидает App Store. Строка `failed`
объясняет, что произошло и как это исправить; подробности — в [Troubleshooting](docs/guides/troubleshooting.md).

## Что отправляет asnsim

Тело POST-запроса такое же, как отправляет App Store: `{"signedPayload": "…"}`. JWS подписывается
алгоритмом ES256 цепочкой из трёх сертификатов с двумя расширениями Apple, которые проверяют верификаторы Apple;
в имени каждого сертификата указано `asnsim (not Apple)`. Внутри лежат транзакция и данные о продлении,
подписанные так же, с полями из
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
и [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload) от Apple.

| Группа                       | Уведомления                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Покупка и продление          | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`   |
| Проблемы с оплатой           | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                      |
| Истечение                    | `EXPIRED` с `VOLUNTARY`, `BILLING_RETRY`, `PRICE_INCREASE`, `PRODUCT_NOT_FOR_SALE` или без подтипа                 |
| Изменения со стороны клиента | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)         |
| Возвраты и отзыв доступа     | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                    |
| Запросы разработчика         | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                               |
| Прочие payload               | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT`; Advanced Commerce `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE` |

`asnsim types` выводит каждую пару вместе с тем, что она, по словам Apple, означает для доступа. Данные, на которых это построено, лежат в
[catalog/notifications.json](catalog/notifications.json), и тесты сравнивают его со значениями, которые были на страницах Apple при чтении 28 октября 2026 года и сохранены копией в тесте; тип или подтип, который Apple добавит позже, сам по себе не обнаружится, а появится, когда эту копию обновят. [What asnsim sends](docs/guides/notifications.md) перечисляет поля,
которые меняет каждое уведомление, и значения, которые asnsim выбирает там, где страницы Apple их не дают.

## Использование

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| Опция (run, send)       | Что делает                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `-u, --url <url>`       | Webhook                                                                                   |
| `-d, --dir <folder>`    | Папка, созданная `asnsim init`; по умолчанию `.asnsim`                                    |
| `--clock live\|fixed`   | Ставить каждому уведомлению дату момента отправки (по умолчанию) или даты самого сценария |
| `--start <date>`        | Дата первого события; делает часы фиксированными                                          |
| `--seed <text>`         | Одни и те же идентификаторы транзакций и notificationUUID при каждом запуске              |
| `--retries <n>`         | Повторно отправлять неудавшееся уведомление без изменений, до 5 раз                       |
| `--duplicate`           | Отправлять каждое уведомление дважды                                                      |
| `--timeout <ms>`        | Ограничение по времени на запрос; по умолчанию 10000                                      |
| `-H, --header <header>` | Дополнительный заголовок запроса для webhook и его проверок; можно повторять              |
| `--out <folder>`        | Дополнительно записывать тело каждого запроса в файл                                      |
| `--dry-run`             | Подписать и записать, ничего не отправляя                                                 |
| `-f, --format <format>` | `tty` (по умолчанию), `text`, `markdown` или `json`; `--json` — краткая запись последнего |
| `-o, --output <file>`   | Записать отчёт в файл                                                                     |

Коды завершения: `0` — все уведомления прошли (получен ответ от 200 до 206 или `expect` шага, и проверка
совпала), `1` — не удалась доставка, ожидание или проверка, `2` — неверные аргументы, нет тестовой цепочки,
сценарий не загружается или произошла непредвиденная ошибка. `asnsim decode` завершается с кодом 1, если JWS
не проходит проверку.

### Отправка одного уведомления

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send` проигрывает, не отправляя, предысторию, которая нужна уведомлению (подписку и неудавшееся продление
перед `BILLING_RECOVERY`, покупку перед возвратом), поэтому идентификаторы и даты согласованы.
`--all` отправляет каждое из 40 по одному разу: быстрый способ убедиться, что ни один тип не ломает ваш handler.

### Написание сценария

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

Каждый шаг происходит тогда, когда произошло бы событие (продление в конце периода, истечение через 60 дней
после начала billing retry), если только `after` или `at` не сдвигают его. [Write a scenario](docs/guides/scenarios.md)
описывает каждый ключ.

| Встроенный сценарий            | Шаги                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `trial-renew-refund`           | бесплатный пробный период, первое продление, возврат                                               |
| `billing-retry-grace-recovery` | продление, неудавшееся продление в Billing Grace Period, конец льготного периода, billing recovery |
| `billing-retry-expired`        | неудавшееся продление, истечение после 60 дней повторных попыток                                   |
| `cancel-expire-winback`        | автопродление отключено, добровольное истечение, повторная подписка по win-back-предложению        |
| `upgrade-downgrade`            | повышение тарифа сразу, понижение при следующем продлении                                          |
| `price-increase-accepted`      | повышение цены ожидает решения, принято, продление по новой цене                                   |
| `price-increase-declined`      | повышение цены ожидает решения, истечение                                                          |
| `consumable-refund-dispute`    | расходуемый товар, запрос на потребление, возврат, отмена возврата                                 |
| `family-sharing-revoke`        | доступ через Family Sharing, затем отзыв                                                           |

### Декодирование того, что прислал App Store

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode проверяет каждый JWS так же, как `SignedDataVerifier` от Apple с отключёнными онлайн-проверками:
три сертификата, каждый выдан следующим, два расширения Apple, действительность на момент `signedDate`,
подпись ES256 — по Apple Root CA - G3 (встроен), тестовому корню в `.asnsim` и любому
`--root`. Проверка отзыва требует OCSP-сервера Apple и не выполняется.
Данные StoreKit Testing в Xcode подписывает Xcode, поэтому проверку они не проходят; с `--environment Xcode` decode выводит их без проверки и сообщает, что они не проверены: верификатор Apple тоже пропускает проверку, только когда настроен на Xcode.
Подробности — в [Decode what the App Store sent](docs/guides/decode.md).

### Из JavaScript

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## Проверено по библиотекам Apple

| Проверка                                                                                                                                              | Где                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Каждое из 40 уведомлений, его транзакция, данные о продлении и app transaction проверены библиотекой Apple для Node.js 3.1.0 в Sandbox и в Production | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test`           |
| Webhook на библиотеке Apple для Node.js проходит сценарий entitlement и отвечает 200 на все 40 типов                                                  | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                                   |
| Все 40 тел проверены библиотекой Apple для Swift 6.0.0                                                                                                | [Examples workflow](.github/workflows/examples.yml); 28 октября 2026 года на Mac (Apple silicon, M5 Max) с Swift 6.4 |
| Настоящая цепочка Apple (Apple Root CA - G3, WWDR G6, сертификат подписи квитанций 2025 года) проходит проверки цепочки в decode                      | [test/unit/verify.test.ts](test/unit/verify.test.ts)                                                                 |
| Транзакция и данные о продлении из StoreKit Testing (Xcode 27.1, iOS 27.0 Simulator) декодируются                                                     | [test/data/xcode](test/data/xcode)                                                                                   |

В наборе 717 тестов в 27 файлах (модульные, интеграционные, snapshot и сквозные); все прошли через `npm test` 28 октября 2026 года на Mac (Apple silicon) с Node.js 26.

## Демо

| Запись                                                                     | Светлая · тёмная                                                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `asnsim init`                                                              | [светлая](docs/media/demo-init-light.svg) · [тёмная](docs/media/demo-init-dark.svg)                 |
| Сценарий entitlement с проверкой после каждого шага (вверху этой страницы) | [светлая](docs/media/demo-checks-light.svg) · [тёмная](docs/media/demo-checks-dark.svg)             |
| `trial-renew-refund` с `--duplicate`                                       | [светлая](docs/media/demo-trial-light.svg) · [тёмная](docs/media/demo-trial-dark.svg)               |
| Проверка, которая не проходит, и как её исправить                          | [светлая](docs/media/demo-failure-light.svg) · [тёмная](docs/media/demo-failure-dark.svg)           |
| `asnsim decode` для транзакции, подписанной StoreKit Testing               | [светлая](docs/media/demo-decode-xcode-light.svg) · [тёмная](docs/media/demo-decode-xcode-dark.svg) |

Измерено 28 октября 2026 года на Mac (Apple silicon, M5 Max) с Node.js 26.12.1 и asnsim 0.1.2,
установленным из tarball релиза, по 29 запусков каждого варианта в три захода, с учётом запуска
Node.js: `asnsim send --all` против examples/node-receiver (40 уведомлений, каждое проверяется
библиотекой Apple в приёмнике) заняла от 0,17 до 0,26 секунды, медиана 0,19; то же с `--dry-run` —
от 0,12 до 0,17 секунды, медиана 0,13. Машина не простаивала: другая работа держала её среднюю
нагрузку (load average) между 9 и 11 (18 ядер) во время замеров, и с ростом нагрузки время растёт.

## Статус

| Возможность                                                                                                     | Статус              |
| --------------------------------------------------------------------------------------------------------------- | ------------------- |
| Тестовая цепочка, подпись, 40 пар уведомлений, Sandbox и Production                                             | работает            |
| Сценарии с проверками, дубликаты, повторные попытки, реальные и фиксированные часы; девять встроенных сценариев | работает            |
| decode с Apple Root CA - G3, тестовыми корнями и данными StoreKit Testing                                       | работает            |
| Отчёты в терминале, текстом, Markdown и JSON; коды завершения                                                   | работает            |
| Поля `billingPlanType`, `commitmentInfo`, `eligibleWinBackOfferIds`, `advancedCommerceInfo`                     | запланировано (0.2) |
| Несколько клиентов и групп подписок в одном сценарии                                                            | запланировано (0.2) |
| Доставка не по порядку и график повторных попыток production в реальном времени                                 | запланировано (0.3) |
| Мок App Store Server API (Get Transaction History, Get All Subscription Statuses)                               | запланировано (0.4) |
| Стабильный формат сценариев и структура JSON                                                                    | запланировано (1.0) |

## Ограничения

- **Симуляция, а не запись.** Payload строятся по описаниям полей и по описанию каждого уведомления от Apple;
  это не копии того, что отправляют серверы Apple. Там, где страницы Apple не дают значения
  (форматы идентификаторов транзакций, длительность льготного периода, storefront), asnsim выбирает своё; они перечислены в
  [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes), и любое значение можно
  изменить на каждом шаге через `set`.
- **Тестовый корень, а не корень Apple.** Ничто из подписанного asnsim не проходит проверку по Apple Root CA - G3. Бэкенд
  должен доверять `.asnsim/root.cer` в своих тестах и никогда не должен доверять ему в production.
- **Онлайн-проверки отключены.** Когда онлайн-проверки включены, верификаторы Apple проверяют отзыв через OCSP-сервер Apple;
  у тестовой цепочки нет OCSP-сервера, поэтому тесты запускаются с отключёнными проверками.
- **Один клиент на сценарий,** с одной группой подписок и любым числом разовых покупок.
- **Ограниченный ввод.** Файлы сценариев до 1 МБ и 500 шагов, входные данные decode до 2 МБ, JWS до
  1 000 000 символов, вложенность сертификатов не более 32 уровней и первые 64 КБ каждого ответа. Вход decode и файлы `--root` читаются потоком и отклоняются на первом байте сверх 2 МБ: `asnsim decode /dev/zero` завершается за 0,11–0,15 секунды при 72–73 МБ памяти (Mac (Apple silicon), Node.js 26, asnsim 0.1.2, средняя нагрузка около 10).

## Документация

Справочник по API и руководства: [muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/).

## Руководства

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## Источники

Сверено 28 октября 2026 года:

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
  и страницы значений, на которые они ссылаются (expirationIntent, revocationReason, revocationType,
  offerType, offerDiscountType, transactionReason, autoRenewStatus, priceIncreaseStatus).
- Apple PKI: [Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/).
- App Store Server Libraries от Apple для
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0),
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0),
  [Java](https://github.com/apple/app-store-server-library-java) и
  [Python](https://github.com/apple/app-store-server-library-python): проверки,
  которые выполняет `SignedDataVerifier`.
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (JWS) и
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280) (X.509).

## Требования

Node.js 22.12 или новее на macOS, Linux или Windows. Больше ничего: ни Xcode, ни аккаунта Apple, ни
сети, кроме вашего webhook. Для примера на Swift нужен Swift 6.4: его Package.resolved фиксирует swift-collections 1.7.5, которому нужен Swift tools 6.4.

## Архитектура

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

- Данные уведомлений хранятся отдельно от кода, и тесты сверяют их со страницами Apple.
- CLI (`src/cli/`) только разбирает аргументы, выбирает цвета и ширину и задаёт код завершения.
- Ни одна зависимость не подписывает и не разбирает сертификаты: asnsim сам записывает и читает DER, а подписывает
  `crypto` из Node.js.

## Связанное

[glassready](https://github.com/muhittincamdali/glassready) показывает, что Liquid Glass меняет в приложении,
собранном с SDK iOS 27, а [a11ylabel](https://github.com/muhittincamdali/a11ylabel) — какие метки доступности
App Store оно может заявить. asnsim проверяет, что делает бэкенд, стоящий за покупками.

## FAQ

**Это заменяет тестирование в sandbox?** Нет. Sandbox проверяет настоящий App Store и вашу конфигурацию App Store
Connect; asnsim проверяет, как ваш бэкенд обрабатывает каждое уведомление, сколько угодно раз, до запусков в sandbox
и между ними.

**Может ли уведомление от asnsim попасть на production-сервер?** Только если этот сервер доверяет тестовому
корню. Сервер, который доверяет только Apple Root CA - G3, отклоняет любое уведомление asnsim, что и проверяют
тесты.

**Нужна ли отдельная настройка для Flutter или React Native?** Нет. Уведомления идут от App Store на
ваш сервер независимо от того, на чём написано приложение; asnsim проверяет бэкенд, который их обрабатывает.

## Участие в разработке

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## Лицензия

Распространяется по лицензии MIT. Подробнее — в файле [LICENSE](LICENSE).
