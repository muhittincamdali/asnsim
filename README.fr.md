<!-- i18n-source: README.md@9262135e1f9f81eff255f1b26ba30a9c3fcaabe4 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="État de la CI"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="Dernière version: v0.1.0"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="Version du langage: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="Licence: MIT"></picture></a>
</p>

<p align="center">
<a href="#démarrage-rapide"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-fr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-fr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-fr-light.svg" alt="Commencer"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-fr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-fr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-fr-light.svg" alt="Documentation"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-fr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-fr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-fr-light.svg" alt="Guides"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-fr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-fr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-fr-light.svg" alt="Exemples"></picture></a>
</p>

> Ceci est une traduction du README anglais. En cas de différence, la version anglaise fait foi.

<!-- brand:end -->

Le point d'accès Request a Test Notification d'Apple n'envoie que le type `TEST`, et son sandbox envoie chaque App Store Server Notification une seule fois, sans les nouvelles tentatives de la production. asnsim envoie tous les types et sous-types de notification qu'Apple documente (40 paires, lues le 28 octobre 2026, y compris les valeurs `ASSIGNED` et `ASSIGNMENT_REVOKE` qu'Apple a rendues disponibles en production le 23 octobre 2026), signés comme le fait l'App Store, vers votre webhook depuis votre propre machine. Votre backend conserve le code de vérification d'Apple et ne fait confiance à la racine de test d'asnsim que dans ses tests.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml : cinq notifications envoyées à un webhook construit sur la bibliothèque Node.js d'Apple, chacune recevant la réponse 200 puis suivie d'une vérification du droit d'accès (entitlement) du client ; 5 notifications sur 5 réussies, 11 requêtes"></picture>

<sub>Enregistré avec la vraie CLI face à <a href="examples/node-receiver">examples/node-receiver</a>,
un webhook construit sur la bibliothèque Node.js d'Apple (<code>npm run demo</code>).</sub>

## Points forts

- **Les 40 notifications, cohérentes entre elles.** `SUBSCRIBED`, `DID_RENEW`, `DID_FAIL_TO_RENEW` avec et sans Billing Grace Period, `EXPIRED` pour chaque motif, changements de formule vers le haut ou vers le bas, hausses de prix, remboursements et leur annulation, révocations par Family Sharing et par l'organisation, demandes de consommation, prolongations de renouvellement, jetons d'achat externe, `RESCIND_CONSENT` et les types Advanced Commerce. Les identifiants de transaction, les dates et les informations de renouvellement d'un client restent cohérents d'une étape à l'autre.
- **Vérifié par les bibliothèques d'Apple.** Les tests confient chaque notification au `SignedDataVerifier` de la bibliothèque Node.js d'Apple 3.1.0, en Sandbox et en Production ; la bibliothèque Swift d'Apple 6.0.0 a vérifié les 40 sur un Mac (Apple silicon) avec Swift 6.4.
- **Des scénarios avec vérifications.** Un fichier YAML d'étapes, chacune pouvant être suivie d'une requête facultative qui vérifie ce qu'a fait votre backend : « après `REFUND`, `GET /entitlements/{originalTransactionId}` répond `active: false` ». Neuf scénarios sont intégrés.
- **Les règles de livraison de l'App Store.** De 200 à 206, c'est un succès ; toute autre réponse (redirections comprises) est une livraison échouée. `--retries` renvoie sans modification, comme le fait la production, et `--duplicate` envoie chaque notification deux fois pour vérifier que votre serveur ignore un `notificationUUID` répété.
- **Un décodeur pour le réel.** `asnsim decode` lit le corps d'une notification, une transaction signée ou une réponse de l'App Store Server API, décode chaque JWS qu'il contient et le vérifie hors ligne par rapport à Apple Root CA - G3, comme le font les bibliothèques d'Apple. Il lit aussi les données de StoreKit Testing d'Xcode.
- **Conçu pour la CI.** Rapports pour le terminal, en texte, en Markdown et en JSON ; code de sortie 0 si tout a réussi, 1 si une livraison, une vérification ou un contrôle a échoué, 2 en cas d'erreur d'utilisation.

## Démarrage rapide

**1. Installez asnsim.** Avec [Homebrew](https://brew.sh/), qui installe aussi Node.js :

```sh
brew install muhittincamdali/tap/asnsim
```

Ou avec npm depuis la [release GitHub](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0), qui nécessite
[Node.js](https://nodejs.org/) 22.12 ou plus récent (`node --version` l'affiche) :

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.0/asnsim-0.1.0.tgz
```

Le paquet n'est pas encore sur le registre npm ; sa publication sous le nom `@mcamdali/asnsim` est prévue.
Les deux commandes installent la même archive de la release.

**2. Créez la chaîne de test, puis faites en sorte que votre backend lui fasse confiance dans ses tests.** Dans le dossier de votre projet :

```sh
asnsim init --bundle-id com.example.app
```

Cela écrit `.asnsim/`. Dans la configuration de test de votre backend, donnez au `SignedDataVerifier` d'Apple
le fichier `.asnsim/root.cer` comme certificat racine, avec les vérifications en ligne désactivées,
puis démarrez le backend. [Trust the test root](docs/guides/trust-the-test-root.md) montre les lignes
pour Node.js, Swift, Java et Python.

**3. Envoyez des notifications à votre webhook :**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

Chaque ligne se termine par `ok` quand votre serveur a répondu comme l'App Store l'attend. Une ligne `failed`
indique ce qui s'est passé et comment y remédier ; [Troubleshooting](docs/guides/troubleshooting.md) donne les
détails.

## Ce qu'asnsim envoie

Le corps du POST est celui qu'envoie l'App Store, `{"signedPayload": "…"}`. Le JWS est signé en
ES256 par une chaîne de trois certificats portant les deux extensions Apple que contrôlent les vérificateurs d'Apple ;
le nom de chaque certificat indique `asnsim (not Apple)`. À l'intérieur se trouvent la transaction et les informations de renouvellement,
signées de la même manière, avec les champs de
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
et de [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload) d'Apple.

| Famille                      | Notifications                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Achat et renouvellement      | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`    |
| Problèmes de facturation     | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                       |
| Expiration                   | `EXPIRED` avec `VOLUNTARY`, `BILLING_RETRY`, `PRICE_INCREASE`, `PRODUCT_NOT_FOR_SALE` ou sans sous-type             |
| Changements du client        | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)          |
| Remboursements et révocation | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                     |
| Demandes du développeur      | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                                |
| Autres payloads              | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT` ; Advanced Commerce `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE` |

`asnsim types` affiche chaque paire avec ce qu'Apple dit qu'elle signifie pour l'accès. Les données qui la sous-tendent se trouvent dans
[catalog/notifications.json](catalog/notifications.json), et les tests échouent quand elles diffèrent des
valeurs des pages d'Apple. [What asnsim sends](docs/guides/notifications.md) énumère les champs
que chaque notification modifie et les valeurs qu'asnsim choisit là où les pages d'Apple n'en donnent aucune.

## Utilisation

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| Option (run, send)      | Ce qu'elle fait                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `-u, --url <url>`       | Le webhook                                                                                  |
| `-d, --dir <folder>`    | Le dossier écrit par `asnsim init`, `.asnsim` par défaut                                    |
| `--clock live\|fixed`   | Date chaque notification à l'envoi (par défaut) ou utilise les dates propres au scénario      |
| `--start <date>`        | Date du premier événement ; rend l'horloge fixe                                             |
| `--seed <text>`         | Les mêmes identifiants de transaction et notificationUUID à chaque exécution                |
| `--retries <n>`         | Renvoie une notification échouée sans la modifier, jusqu'à 5 fois                           |
| `--duplicate`           | Envoie chaque notification deux fois                                                        |
| `--timeout <ms>`        | Délai maximal par requête, 10000 par défaut                                                 |
| `-H, --header <header>` | En-tête de requête supplémentaire pour le webhook et ses vérifications, répétable           |
| `--out <folder>`        | Écrit aussi chaque corps de requête dans un fichier                                         |
| `--dry-run`             | Signe et écrit, n'envoie rien                                                               |
| `-f, --format <format>` | `tty` (par défaut), `text`, `markdown` ou `json` ; `--json` est le raccourci de la dernière |
| `-o, --output <file>`   | Écrit le rapport dans un fichier                                                            |

Codes de sortie : `0` toutes les notifications ont réussi (réponse de 200 à 206, ou l'`expect` de l'étape, et sa
vérification correspondait), `1` une livraison, une attente ou une vérification a échoué, `2` arguments incorrects, pas de chaîne de test,
scénario impossible à charger ou erreur inattendue. `asnsim decode` se termine par 1 quand un JWS
ne se vérifie pas.

### Envoyer une notification

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send` rejoue, sans l'envoyer, l'historique dont la notification a besoin (un abonnement et un renouvellement échoué
avant `BILLING_RECOVERY`, un achat avant un remboursement), de sorte que ses identifiants et ses dates sont cohérents.
`--all` envoie chacune des 40 une fois : un moyen rapide de constater qu'aucun type ne fait échouer votre handler.

### Écrire un scénario

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

Chaque étape survient au moment où l'événement surviendrait (un renouvellement à la fin de la période, une expiration 60 jours
après le début du billing retry), sauf si `after` ou `at` la déplace. [Write a scenario](docs/guides/scenarios.md)
décrit chaque clé.

| Scénario intégré               | Étapes                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `trial-renew-refund`           | essai gratuit, premier renouvellement, remboursement                                                        |
| `billing-retry-grace-recovery` | renouvellement, renouvellement échoué en Billing Grace Period, fin de la période de grâce, billing recovery |
| `billing-retry-expired`        | renouvellement échoué, expiration après 60 jours de nouvelles tentatives                                    |
| `cancel-expire-winback`        | renouvellement automatique désactivé, expiration volontaire, nouvel abonnement avec une offre win-back      |
| `upgrade-downgrade`            | passage immédiat à une formule supérieure, passage à une formule inférieure au renouvellement suivant       |
| `price-increase-accepted`      | hausse de prix en attente, acceptée, renouvellement au nouveau prix                                         |
| `price-increase-declined`      | hausse de prix en attente, expiration                                                                       |
| `consumable-refund-dispute`    | consommable, demande de consommation, remboursement, remboursement annulé                                   |
| `family-sharing-revoke`        | accès via Family Sharing, puis révoqué                                                                      |

### Décoder ce que l'App Store a envoyé

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode vérifie chaque JWS comme le fait le `SignedDataVerifier` d'Apple avec les vérifications en ligne désactivées :
trois certificats, chacun émis par le suivant, les deux extensions d'Apple, la validité à `signedDate`, la
signature ES256, par rapport à Apple Root CA - G3 (intégrée), à la racine de test de `.asnsim` et à tout
`--root`. La révocation exige le serveur OCSP d'Apple et n'est pas vérifiée.
Les données de StoreKit Testing dans Xcode sont signées par Xcode ; decode les affiche et ignore la vérification, comme le font les bibliothèques d'Apple.
[Decode what the App Store sent](docs/guides/decode.md) donne les détails.

### Depuis JavaScript

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## Vérifié avec les bibliothèques d'Apple

| Vérification                                                                                                                                                                                 | Où                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Chacune des 40 notifications, avec sa transaction, ses informations de renouvellement et son app transaction, vérifiée par la bibliothèque Node.js d'Apple 3.1.0 en Sandbox et en Production | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test`                 |
| Un webhook construit sur la bibliothèque Node.js d'Apple réussit le scénario d'entitlement et répond 200 aux 40 types                                                                        | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                                         |
| Les 40 corps vérifiés par la bibliothèque Swift d'Apple 6.0.0                                                                                                                                | [Examples workflow](.github/workflows/examples.yml) ; le 28 octobre 2026 sur un Mac (Apple silicon, M5 Max) avec Swift 6.4 |
| La vraie chaîne d'Apple (Apple Root CA - G3, WWDR G6, le certificat de signature des reçus de 2025) passe les contrôles de chaîne de decode                                                  | [test/unit/verify.test.ts](test/unit/verify.test.ts)                                                                       |
| Une transaction et des informations de renouvellement issues de StoreKit Testing (Xcode 27.1, iOS 27.0 Simulator) se décodent                                                                | [test/data/xcode](test/data/xcode)                                                                                         |

La suite compte 280 tests (unitaires, d'intégration, de snapshot et de bout en bout).

## Démo

| Enregistrement                                                                             | Clair · sombre                                                                                    |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `asnsim init`                                                                              | [clair](docs/media/demo-init-light.svg) · [sombre](docs/media/demo-init-dark.svg)                 |
| Le scénario d'entitlement avec une vérification après chaque étape (en haut de cette page) | [clair](docs/media/demo-checks-light.svg) · [sombre](docs/media/demo-checks-dark.svg)             |
| `trial-renew-refund` avec `--duplicate`                                                    | [clair](docs/media/demo-trial-light.svg) · [sombre](docs/media/demo-trial-dark.svg)               |
| Une vérification qui échoue, avec sa correction                                            | [clair](docs/media/demo-failure-light.svg) · [sombre](docs/media/demo-failure-dark.svg)           |
| `asnsim decode` sur une transaction signée par StoreKit Testing                            | [clair](docs/media/demo-decode-xcode-light.svg) · [sombre](docs/media/demo-decode-xcode-dark.svg) |

Mesuré le 28 octobre 2026 sur un Mac (Apple silicon, M5 Max) avec Node.js 26.12.1, sept exécutions
chacune, démarrage de Node.js compris : `asnsim send --all` face à examples/node-receiver (40
notifications, chacune vérifiée par la bibliothèque d'Apple dans le récepteur) a pris de 0,16 à 0,23 seconde,
médiane 0,17 ; la même chose avec `--dry-run`, de 0,11 à 0,13 seconde.

## Statut

| Fonctionnalité                                                                                                  | Statut      |
| --------------------------------------------------------------------------------------------------------------- | ----------- |
| Chaîne de test, signature, les 40 paires de notifications, Sandbox et Production                                | fonctionne  |
| Scénarios avec vérifications, doublons, nouvelles tentatives, horloges réelle et fixe ; neuf scénarios intégrés | fonctionne  |
| decode avec Apple Root CA - G3, racines de test et données de StoreKit Testing                                  | fonctionne  |
| Rapports pour le terminal, en texte, en Markdown et en JSON ; codes de sortie                                   | fonctionne  |
| Champs `billingPlanType`, `commitmentInfo`, `eligibleWinBackOfferIds`, `advancedCommerceInfo`                   | prévu (0.2) |
| Plusieurs clients et groupes d'abonnements dans un même scénario                                                | prévu (0.2) |
| Livraison dans le désordre et calendrier des nouvelles tentatives de la production en temps réel                | prévu (0.3) |
| Mock de l'App Store Server API (Get Transaction History, Get All Subscription Statuses)                         | prévu (0.4) |
| Format de scénario et structure JSON stables                                                                    | prévu (1.0) |

## Limites

- **Simulé, pas capturé.** Les payloads suivent les définitions de champs d'Apple et ses descriptions de
  chaque notification ; ce ne sont pas des copies de ce qu'envoient les serveurs d'Apple. Là où les pages d'Apple ne donnent
  aucune valeur (formats d'identifiant de transaction, durée de la période de grâce, la storefront), asnsim en choisit une, listée dans
  [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes), et chaque valeur peut être
  modifiée par étape avec `set`.
- **Une racine de test, pas celle d'Apple.** Rien de ce qu'asnsim signe ne se vérifie par rapport à Apple Root CA - G3. Un backend
  doit faire confiance à `.asnsim/root.cer` dans ses tests et ne doit jamais lui faire confiance en production.
- **Vérifications en ligne désactivées.** Quand les vérifications en ligne sont activées, les vérificateurs d'Apple contrôlent la révocation auprès du serveur OCSP d'Apple ;
  la chaîne de test n'a pas de serveur OCSP, donc les tests s'exécutent sans elles.
- **Un client par scénario,** avec un groupe d'abonnements et autant d'achats uniques que souhaité.
- **Entrées bornées.** Fichiers de scénario jusqu'à 1 Mo et 500 étapes, entrée de decode jusqu'à 2 Mo, un JWS jusqu'à
  1 000 000 caractères, certificats imbriqués sur 32 niveaux au plus et les 64 premiers Ko de chaque réponse.

## Documentation

Référence de l'API et guides : [muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/).

## Guides

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## Sources

Lues le 28 octobre 2026 :

- Apple, App Store Server Notifications :
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
- Apple, App Store Server API :
  [JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload),
  [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload),
  [JWSAppTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsapptransactiondecodedpayload),
  [Request a Test Notification](https://developer.apple.com/documentation/appstoreserverapi/request-a-test-notification)
  et les pages de valeurs vers lesquelles elles pointent (expirationIntent, revocationReason, revocationType,
  offerType, offerDiscountType, transactionReason, autoRenewStatus, priceIncreaseStatus).
- Apple PKI : [Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/).
- Les App Store Server Libraries d'Apple pour
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0),
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0),
  [Java](https://github.com/apple/app-store-server-library-java) et
  [Python](https://github.com/apple/app-store-server-library-python) : les vérifications de
  `SignedDataVerifier`.
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (JWS) et
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280) (X.509).

## Prérequis

Node.js 22.12 ou plus récent sous macOS, Linux ou Windows. Rien d'autre : pas de Xcode, pas de compte Apple, pas de
réseau en dehors de votre webhook. L'exemple Swift nécessite Swift 6.0 ou plus récent.

## Architecture

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

- Les données des notifications sont séparées du code, et les tests les comparent aux pages d'Apple.
- La CLI (`src/cli/`) se contente d'analyser les arguments, de choisir les couleurs et les largeurs et de définir le code de sortie.
- Aucune dépendance ne signe ni n'analyse de certificats : asnsim écrit et lit lui-même le DER, et le `crypto`
  de Node.js signe.

## Voir aussi

[glassready](https://github.com/muhittincamdali/glassready) montre ce que Liquid Glass change dans une
app compilée avec le SDK iOS 27, et [a11ylabel](https://github.com/muhittincamdali/a11ylabel) quelles
étiquettes d'accessibilité de l'App Store elle peut revendiquer. asnsim teste ce que fait le backend derrière ses achats.

## FAQ

**Est-ce que cela remplace les tests dans le sandbox ?** Non. Le sandbox teste le vrai App Store et votre configuration d'App Store
Connect ; asnsim teste la façon dont votre backend traite chaque notification, aussi souvent que vous le voulez, avant et entre
les exécutions dans le sandbox.

**Une notification d'asnsim peut-elle atteindre un serveur de production ?** Seulement si ce serveur fait confiance à la racine
de test. Un serveur qui ne fait confiance qu'à Apple Root CA - G3 rejette toutes les notifications d'asnsim, comme
le vérifient les tests.

**Ai-je besoin d'une configuration propre à Flutter ou à React Native ?** Non. Les notifications vont de l'App Store à
votre serveur quel que soit le langage de l'app ; ce que teste asnsim, c'est le backend qui les traite.

## Contribuer

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## Licence

Publié sous licence MIT. Voir [LICENSE](LICENSE).
