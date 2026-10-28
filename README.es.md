<!-- i18n-source: README.md@82bd21b19ac265498a5e575dd520386f497217a5 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="Estado de CI"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="Última versión: v0.1.1"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="Versión del lenguaje: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="Licencia: MIT"></picture></a>
</p>

<p align="center">
<a href="#inicio-rápido"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-es-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-es-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-es-light.svg" alt="Empezar"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-es-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-es-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-es-light.svg" alt="Documentación"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-es-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-es-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-es-light.svg" alt="Guías"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-es-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-es-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-es-light.svg" alt="Ejemplos"></picture></a>
</p>

> Esta es una traducción del README en inglés. Si hay diferencias, la versión en inglés es la vigente.

<!-- brand:end -->

El endpoint Request a Test Notification de Apple solo envía el tipo `TEST`, y su sandbox envía cada App Store Server Notification una sola vez, sin los reintentos de producción. asnsim envía todos los tipos y subtipos de notificación que Apple documenta (40 pares, consultados el 28 de octubre de 2026, incluidos los valores `ASSIGNED` y `ASSIGNMENT_REVOKE` que Apple habilitó en producción el 23 de octubre de 2026), firmados como los firma el App Store, a tu webhook desde tu propia máquina. Tu backend conserva el código de verificación de Apple y solo confía en la raíz de pruebas de asnsim en sus tests.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml: cinco notificaciones a un webhook creado con la biblioteca Node.js de Apple, cada una respondida con 200 y seguida de una comprobación del derecho de acceso (entitlement) del cliente; 5 de 5 notificaciones superadas, 11 solicitudes"></picture>

<sub>Grabado con la CLI real contra <a href="examples/node-receiver">examples/node-receiver</a>,
un webhook creado con la biblioteca Node.js de Apple (<code>npm run demo</code>).</sub>

## Lo más destacado

- **Las 40 notificaciones, coherentes entre sí.** `SUBSCRIBED`, `DID_RENEW`, `DID_FAIL_TO_RENEW` con y sin Billing Grace Period, `EXPIRED` por cada motivo, mejoras y rebajas de plan, subidas de precio, reembolsos y su reversión, revocaciones por Family Sharing y por organización, solicitudes de consumo, extensiones de renovación, tokens de compra externa, `RESCIND_CONSENT` y los tipos de Advanced Commerce. Los ID de transacción, las fechas y la información de renovación de un mismo cliente se mantienen coherentes de un paso al siguiente.
- **Verificado con las bibliotecas de Apple.** Los tests pasan cada notificación al `SignedDataVerifier` de la biblioteca Node.js de Apple 3.1.0, en Sandbox y en Production; la biblioteca Swift de Apple 6.0.0 verificó las 40 en un Mac (Apple silicon) con Swift 6.4.
- **Escenarios con comprobaciones.** Un archivo YAML de pasos, cada uno seguido de una solicitud opcional que comprueba lo que hizo tu backend: «tras `REFUND`, `GET /entitlements/{originalTransactionId}` responde `active: false`». Incluye nueve escenarios.
- **Las reglas de entrega del App Store.** De 200 a 206 es éxito; cualquier otra respuesta (redirecciones incluidas) es una entrega fallida. `--retries` reenvía sin cambios, como hace producción, y `--duplicate` envía cada notificación dos veces para comprobar que tu servidor ignora un `notificationUUID` repetido.
- **Un decodificador para lo real.** `asnsim decode` lee el cuerpo de una notificación, una transacción firmada o una respuesta de la App Store Server API, decodifica cada JWS que contiene y lo comprueba contra Apple Root CA - G3 como lo hacen las bibliotecas de Apple, sin conexión. También lee los datos de StoreKit Testing de Xcode.
- **Pensado para CI.** Informes en terminal, texto, Markdown y JSON; código de salida 0 si todo pasó, 1 si falló una entrega, una comprobación o una verificación, 2 si hubo un error de uso. Los informes ocultan las credenciales de las URL, los valores de la query, los ID y los secretos de las respuestas del webhook ([qué ocultan](docs/guides/ci.md#what-the-reports-hide)).

## Inicio rápido

**1. Instala asnsim.** Con [Homebrew](https://brew.sh/), que también instala Node.js:

```sh
brew install muhittincamdali/tap/asnsim
```

O con npm desde la [release de GitHub](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.1), que necesita
[Node.js](https://nodejs.org/) 22.12 o posterior (`node --version` lo muestra):

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.1/asnsim-0.1.1.tgz
```

El paquete aún no está en el registro de npm; está previsto publicarlo allí como `@mcamdali/asnsim`.
Ambos comandos instalan el mismo tarball de la release.

**2. Crea la cadena de pruebas y haz que tu backend confíe en ella en los tests.** En la carpeta de tu proyecto:

```sh
asnsim init --bundle-id com.example.app
```

Esto escribe `.asnsim/`. En la configuración de tests de tu backend, entrega a `SignedDataVerifier` de Apple
el archivo `.asnsim/root.cer` como certificado raíz, con las comprobaciones en línea desactivadas,
y arranca el backend. [Trust the test root](docs/guides/trust-the-test-root.md) muestra las líneas
para Node.js, Swift, Java y Python.

**3. Envía notificaciones a tu webhook:**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

Cada línea termina en `ok` cuando tu servidor respondió como espera el App Store. Una línea `failed`
dice qué ocurrió y cómo arreglarlo; [Troubleshooting](docs/guides/troubleshooting.md) tiene los
detalles.

## Qué envía asnsim

El cuerpo del POST es el que envía el App Store, `{"signedPayload": "…"}`. El JWS se firma con
ES256 mediante una cadena de tres certificados con las dos extensiones de Apple que comprueban los verificadores de Apple;
el nombre de cada certificado dice `asnsim (not Apple)`. Dentro van la transacción y la información de renovación,
firmadas del mismo modo, con los campos de
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
y [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload) de Apple.

| Familia                       | Notificaciones                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Compra y renovación           | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`   |
| Problemas de cobro            | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                      |
| Caducidad                     | `EXPIRED` con `VOLUNTARY`, `BILLING_RETRY`, `PRICE_INCREASE`, `PRODUCT_NOT_FOR_SALE` o sin subtipo                 |
| Cambios del cliente           | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)         |
| Reembolsos y revocación       | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                    |
| Solicitudes del desarrollador | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                               |
| Otros payloads                | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT`; Advanced Commerce `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE` |

`asnsim types` imprime cada par con lo que Apple dice que significa para el acceso. Los datos que lo respaldan están en
[catalog/notifications.json](catalog/notifications.json), y los tests lo comparan con los valores que listaban las páginas de Apple al leerlas el 28 de octubre de 2026, guardados como copia en el test; un tipo o subtipo que Apple añada después no se detecta solo, aparece cuando se actualiza esa copia. [What asnsim sends](docs/guides/notifications.md) enumera los campos
que cambia cada notificación y qué valores elige asnsim donde las páginas de Apple no dan ninguno.

## Uso

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| Opción (run, send)      | Qué hace                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `-u, --url <url>`       | El webhook                                                                                |
| `-d, --dir <folder>`    | La carpeta que escribió `asnsim init`, por defecto `.asnsim`                              |
| `--clock live\|fixed`   | Pone a cada notificación la fecha del envío (por defecto) o usa las fechas propias del escenario  |
| `--start <date>`        | Fecha del primer evento; deja el reloj fijo                                               |
| `--seed <text>`         | Los mismos ID de transacción y notificationUUID en cada ejecución                         |
| `--retries <n>`         | Reenvía sin cambios una notificación fallida, hasta 5 veces                               |
| `--duplicate`           | Envía cada notificación dos veces                                                         |
| `--timeout <ms>`        | Límite de tiempo por solicitud, por defecto 10000                                         |
| `-H, --header <header>` | Cabecera de solicitud adicional para el webhook y sus comprobaciones, repetible           |
| `--out <folder>`        | Escribe además cada cuerpo de solicitud en un archivo                                     |
| `--dry-run`             | Firma y escribe, no envía nada                                                            |
| `-f, --format <format>` | `tty` (por defecto), `text`, `markdown` o `json`; `--json` es la forma corta de la última |
| `-o, --output <file>`   | Escribe el informe en un archivo                                                          |

Códigos de salida: `0` todas las notificaciones pasaron (respondidas con 200 a 206, o con el `expect` del paso, y su
comprobación coincidió), `1` falló una entrega, una expectativa o una comprobación, `2` argumentos incorrectos, falta la cadena de pruebas,
un escenario que no se carga o un error inesperado. `asnsim decode` termina con 1 cuando un JWS no
se verifica.

### Enviar una notificación

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send` reproduce, sin enviarla, la historia que necesita la notificación (una suscripción y una renovación fallida
antes de `BILLING_RECOVERY`, una compra antes de un reembolso), de modo que sus ID y fechas son coherentes.
`--all` envía cada una de las 40 una vez: una forma rápida de comprobar que ningún tipo hace fallar tu handler.

### Escribir un escenario

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

Cada paso ocurre cuando ocurriría el evento (una renovación al final del período, una caducidad 60 días
después de empezar el billing retry) salvo que `after` o `at` lo muevan. [Write a scenario](docs/guides/scenarios.md)
describe todas las claves.

| Escenario integrado            | Pasos                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `trial-renew-refund`           | prueba gratuita, primera renovación, reembolso                                                      |
| `billing-retry-grace-recovery` | renovación, renovación fallida en Billing Grace Period, fin del período de gracia, billing recovery |
| `billing-retry-expired`        | renovación fallida, caducidad tras 60 días de reintentos                                            |
| `cancel-expire-winback`        | renovación automática desactivada, caducidad voluntaria, nueva suscripción con oferta win-back      |
| `upgrade-downgrade`            | mejora de plan inmediata, rebaja en la siguiente renovación                                         |
| `price-increase-accepted`      | subida de precio pendiente, aceptada, renovación al nuevo precio                                    |
| `price-increase-declined`      | subida de precio pendiente, caducidad                                                               |
| `consumable-refund-dispute`    | consumible, solicitud de consumo, reembolso, reembolso revertido                                    |
| `family-sharing-revoke`        | acceso mediante Family Sharing y después revocado                                                   |

### Decodificar lo que envió el App Store

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode comprueba cada JWS como lo hace `SignedDataVerifier` de Apple con las comprobaciones en línea desactivadas:
tres certificados, cada uno emitido por el siguiente, las dos extensiones de Apple, validez en `signedDate`, la
firma ES256, contra Apple Root CA - G3 (integrado), la raíz de pruebas de `.asnsim` y cualquier
`--root`. La revocación requiere el servidor OCSP de Apple y no se comprueba.
Los datos de StoreKit Testing de Xcode los firma Xcode, así que no pasan la comprobación; con `--environment Xcode` decode los imprime sin comprobarlos y los marca como no verificados, porque el verificador de Apple solo omite la comprobación cuando está configurado para Xcode.
[Decode what the App Store sent](docs/guides/decode.md) tiene los detalles.

### Desde JavaScript

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## Comprobado con las bibliotecas de Apple

| Comprobación                                                                                                                                                                          | Dónde                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Cada una de las 40 notificaciones, su transacción, su información de renovación y su app transaction, verificadas por la biblioteca Node.js de Apple 3.1.0 en Sandbox y en Production | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test`                    |
| Un webhook con la biblioteca Node.js de Apple supera el escenario de derechos de acceso y responde 200 a los 40 tipos                                                                 | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                                            |
| Los 40 cuerpos verificados por la biblioteca Swift de Apple 6.0.0                                                                                                                     | [Examples workflow](.github/workflows/examples.yml); el 28 de octubre de 2026 en un Mac (Apple silicon, M5 Max) con Swift 6.4 |
| La cadena real de Apple (Apple Root CA - G3, WWDR G6, el certificado de firma de recibos de 2025) supera las comprobaciones de cadena de decode                                       | [test/unit/verify.test.ts](test/unit/verify.test.ts)                                                                          |
| Se decodifican una transacción y una información de renovación de StoreKit Testing (Xcode 27.1, iOS 27.0 Simulator)                                                                   | [test/data/xcode](test/data/xcode)                                                                                            |

La suite tiene 402 tests en 24 archivos (unitarios, de integración, de snapshot y de extremo a extremo); todos pasaron con `npm test` el 28 de octubre de 2026 en un Mac (Apple silicon) con Node.js 26.

## Demo

| Grabación                                                                                      | Claro · oscuro                                                                                    |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `asnsim init`                                                                                  | [claro](docs/media/demo-init-light.svg) · [oscuro](docs/media/demo-init-dark.svg)                 |
| El escenario de derechos de acceso con una comprobación tras cada paso (arriba de esta página) | [claro](docs/media/demo-checks-light.svg) · [oscuro](docs/media/demo-checks-dark.svg)             |
| `trial-renew-refund` con `--duplicate`                                                         | [claro](docs/media/demo-trial-light.svg) · [oscuro](docs/media/demo-trial-dark.svg)               |
| Una comprobación que falla, con su solución                                                    | [claro](docs/media/demo-failure-light.svg) · [oscuro](docs/media/demo-failure-dark.svg)           |
| `asnsim decode` sobre una transacción firmada por StoreKit Testing                             | [claro](docs/media/demo-decode-xcode-light.svg) · [oscuro](docs/media/demo-decode-xcode-dark.svg) |

Medido el 28 de octubre de 2026 en un Mac (Apple silicon, M5 Max) con Node.js 26.12.1, siete ejecuciones
de cada una y con el arranque de Node.js incluido: `asnsim send --all` contra examples/node-receiver (40
notificaciones, cada una verificada por la biblioteca de Apple en el receptor) tardó de 0,16 a 0,23 segundos,
mediana 0,17; lo mismo con `--dry-run`, de 0,11 a 0,13 segundos.

## Estado

| Función                                                                                                     | Estado         |
| ----------------------------------------------------------------------------------------------------------- | -------------- |
| Cadena de pruebas, firma, los 40 pares de notificación, Sandbox y Production                                | funciona       |
| Escenarios con comprobaciones, duplicados, reintentos, relojes en vivo y fijos; nueve escenarios integrados | funciona       |
| decode con Apple Root CA - G3, raíces de pruebas y datos de StoreKit Testing                                | funciona       |
| Informes en terminal, texto, Markdown y JSON; códigos de salida                                             | funciona       |
| Campos `billingPlanType`, `commitmentInfo`, `eligibleWinBackOfferIds`, `advancedCommerceInfo`               | previsto (0.2) |
| Varios clientes y grupos de suscripción en un mismo escenario                                               | previsto (0.2) |
| Entrega desordenada y el calendario de reintentos de producción en tiempo real                              | previsto (0.3) |
| Mock de la App Store Server API (Get Transaction History, Get All Subscription Statuses)                    | previsto (0.4) |
| Formato de escenario y estructura JSON estables                                                             | previsto (1.0) |

## Límites

- **Simulado, no capturado.** Los payloads siguen las definiciones de campos de Apple y sus descripciones de
  cada notificación; no son copias de lo que envían los servidores de Apple. Donde las páginas de Apple no dan
  ningún valor (formatos de ID de transacción, duración del período de gracia, la storefront), asnsim elige uno, y se enumeran en
  [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes); cada valor puede
  cambiarse en cada paso con `set`.
- **Una raíz de pruebas, no la de Apple.** Nada de lo que firma asnsim se verifica contra Apple Root CA - G3. Un backend
  debe confiar en `.asnsim/root.cer` en sus tests y nunca debe confiar en ella en producción.
- **Comprobaciones en línea desactivadas.** Cuando las comprobaciones en línea están activadas, los verificadores de Apple comprueban la revocación con el servidor OCSP de Apple;
  la cadena de pruebas no tiene servidor OCSP, así que los tests se ejecutan con ellas desactivadas.
- **Un cliente por escenario,** con un grupo de suscripción y cualquier número de compras únicas.
- **Entrada acotada.** Archivos de escenario de hasta 1 MB y 500 pasos, entrada de decode de hasta 2 MB, un JWS de hasta
  1.000.000 de caracteres, certificados anidados como máximo 32 niveles y los primeros 64 KB de cada respuesta.

## Documentación

Referencia de la API y guías: [muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/).

## Guías

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## Fuentes

Consultadas el 28 de octubre de 2026:

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
  y las páginas de valores enlazadas desde ellas (expirationIntent, revocationReason, revocationType,
  offerType, offerDiscountType, transactionReason, autoRenewStatus, priceIncreaseStatus).
- Apple PKI: [Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/).
- Las App Store Server Libraries de Apple para
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0),
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0),
  [Java](https://github.com/apple/app-store-server-library-java) y
  [Python](https://github.com/apple/app-store-server-library-python): las comprobaciones de
  `SignedDataVerifier`.
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (JWS) y
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280) (X.509).

## Requisitos

Node.js 22.12 o posterior en macOS, Linux o Windows. Nada más: sin Xcode, sin cuenta de Apple, sin
red aparte de tu webhook. El ejemplo de Swift necesita Swift 6.4: su Package.resolved fija swift-collections 1.7.5, que necesita Swift tools 6.4.

## Arquitectura

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

- Los datos de las notificaciones están separados del código y los tests los comprueban contra las páginas de Apple.
- La CLI (`src/cli/`) solo analiza argumentos, elige colores y anchos, y fija el código de salida.
- Ninguna dependencia firma ni analiza certificados: asnsim escribe y lee el DER por sí mismo, y el `crypto`
  de Node.js firma.

## Relacionado

[glassready](https://github.com/muhittincamdali/glassready) muestra qué cambia Liquid Glass en una
app compilada con el SDK de iOS 27, y [a11ylabel](https://github.com/muhittincamdali/a11ylabel) qué
etiquetas de accesibilidad del App Store puede declarar. asnsim prueba lo que hace el backend que hay detrás de sus compras.

## Preguntas frecuentes

**¿Sustituye a probar en el sandbox?** No. El sandbox prueba el App Store real y tu configuración de App Store
Connect; asnsim prueba cómo tu backend gestiona cada notificación, tantas veces como quieras, antes y entre
las pruebas en el sandbox.

**¿Puede una notificación de asnsim llegar a un servidor de producción?** Solo si ese servidor confía en la raíz
de pruebas. Un servidor que confía solo en Apple Root CA - G3 rechaza todas las notificaciones de asnsim, como
comprueban los tests.

**¿Necesito una configuración específica para Flutter o React Native?** No. Las notificaciones van del App Store a
tu servidor sea cual sea el lenguaje de la app; lo que prueba asnsim es el backend que las gestiona.

## Contribuir

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## Licencia

Publicado bajo la licencia MIT. Consulta [LICENSE](LICENSE).
