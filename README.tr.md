<!-- i18n-source: README.md@9262135e1f9f81eff255f1b26ba30a9c3fcaabe4 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="CI durumu"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="Son sürüm: v0.1.0"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="Dil sürümü: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="Lisans: MIT"></picture></a>
</p>

<p align="center">
<a href="#hızlı-başlangıç"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-tr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-tr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-tr-light.svg" alt="Başlayın"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-tr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-tr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-tr-light.svg" alt="Dokümantasyon"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-tr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-tr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-tr-light.svg" alt="Rehberler"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-tr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-tr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-tr-light.svg" alt="Örnekler"></picture></a>
</p>

> Bu belge İngilizce README'nin çevirisidir. İkisi arasında fark varsa güncel olan İngilizce sürümdür.

<!-- brand:end -->

Apple'ın Request a Test Notification uç noktası yalnızca `TEST` türünü gönderir; sandbox ise her App Store Server Notification'ı yalnızca bir kez, production'daki yeniden denemeler olmadan gönderir. asnsim, Apple'ın belgelediği her bildirim türünü ve alt türünü (40 çift; 28 Ekim 2026'da okundu, Apple'ın 23 Ekim 2026'da production'da kullanıma açtığı `ASSIGNED` ve `ASSIGNMENT_REVOKE` değerleri dahil) App Store'un imzaladığı biçimde imzalayarak webhook'unuza kendi makinenizden gönderir. Backend'iniz Apple'ın kendi doğrulama kodunu korur ve asnsim'in test kökünü yalnızca testlerinde güvenilir sayar.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml: Apple'ın Node.js kütüphanesiyle yazılmış bir webhook'a beş bildirim; her biri 200 ile yanıtlanıyor ve ardından müşterinin yetkisi (entitlement) kontrol ediliyor; 5 bildirimin 5'i geçti, 11 istek"></picture>

<sub>Gerçek CLI ile <a href="examples/node-receiver">examples/node-receiver</a> üzerinde kaydedildi;
bu, Apple'ın Node.js kütüphanesiyle yazılmış bir webhook'tur (<code>npm run demo</code>).</sub>

## Öne çıkanlar

- **40 bildirimin tamamı, tutarlı biçimde.** `SUBSCRIBED`, `DID_RENEW`, Billing Grace Period'lu ve Billing Grace Period'suz `DID_FAIL_TO_RENEW`, her neden için `EXPIRED`, yükseltmeler, düşürmeler, fiyat artışları, iadeler ve iade geri almaları, Family Sharing ve kuruluş kaynaklı iptaller, tüketim talepleri, yenileme uzatmaları, harici satın alma token'ları, `RESCIND_CONSENT` ve Advanced Commerce türleri. Bir müşterinin işlem kimlikleri, tarihleri ve yenileme bilgisi adımdan adıma tutarlı kalır.
- **Apple'ın kütüphaneleriyle doğrulandı.** Testler her bildirimi Sandbox ve Production ortamlarında Apple'ın Node.js kütüphanesinin 3.1.0 sürümündeki `SignedDataVerifier`'a verir; Apple'ın Swift kütüphanesi 6.0.0 ise 40'ının hepsini Swift 6.4 ile bir Mac'te (Apple silicon) doğruladı.
- **Kontrollü senaryolar.** Her biri ardından isteğe bağlı bir istekle backend'inizin ne yaptığını kontrol edebilen adımlardan oluşan bir YAML dosyası: "`REFUND` sonrasında `GET /entitlements/{originalTransactionId}` yanıtı `active: false` olmalı". Dokuz senaryo yerleşik gelir.
- **App Store'un teslimat kuralları.** 200 ile 206 arası başarıdır; geri kalan her şey (yönlendirmeler dahil) başarısız teslimattır. `--retries` production'daki gibi bildirimi değiştirmeden yeniden gönderir, `--duplicate` ise sunucunuzun tekrarlanan bir `notificationUUID`'yi yok saydığını test etmek için her bildirimi iki kez gönderir.
- **Gerçeği çözen bir decoder.** `asnsim decode`, bir bildirim gövdesini, imzalı bir işlemi veya bir App Store Server API yanıtını okur, içindeki her JWS'yi çözer ve Apple'ın kütüphaneleri gibi, çevrimdışı olarak Apple Root CA - G3'e karşı doğrular. Xcode'daki StoreKit Testing verisini de okur.
- **CI için tasarlandı.** Terminal, düz metin, Markdown ve JSON raporları; çıkış kodu 0 başarılı, 1 teslimat, kontrol veya doğrulama hatası, 2 kullanım hatası demektir.

## Hızlı başlangıç

**1. asnsim'i kurun.** Node.js'i de kuran [Homebrew](https://brew.sh/) ile:

```sh
brew install muhittincamdali/tap/asnsim
```

Ya da [GitHub sürümünden](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0) npm ile; bunun için
[Node.js](https://nodejs.org/) 22.12 veya üstü gerekir (`node --version` sürümü yazdırır):

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.0/asnsim-0.1.0.tgz
```

Paket henüz npm registry'de değil; `@mcamdali/asnsim` adıyla oraya yayımlanması planlanıyor.
İki komut da aynı sürüm arşivini kurar.

**2. Test zincirini oluşturun, ardından backend'inizin testlerde ona güvenmesini sağlayın.** Projenizin klasöründe:

```sh
asnsim init --bundle-id com.example.app
```

Bu komut `.asnsim/` klasörünü yazar. Backend'inizin test yapılandırmasında Apple'ın
`SignedDataVerifier`'ına kök sertifika olarak `.asnsim/root.cer` dosyasını verin, çevrimiçi kontrolleri kapatın
ve backend'i başlatın. [Trust the test root](docs/guides/trust-the-test-root.md) rehberi
Node.js, Swift, Java ve Python için gereken satırları gösterir.

**3. Bildirimleri webhook'unuza gönderin:**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

Sunucunuz App Store'un beklediği gibi yanıt verdiğinde her satır `ok` ile biter. `failed` satırı
ne olduğunu ve nasıl düzeltileceğini söyler; ayrıntılar için
[Troubleshooting](docs/guides/troubleshooting.md) rehberine bakın.

## asnsim ne gönderir

POST gövdesi App Store'un gönderdiğiyle aynıdır: `{"signedPayload": "…"}`. JWS, Apple'ın
doğrulayıcılarının aradığı iki Apple uzantısını taşıyan üç sertifikalı bir zincirle ES256 ile imzalanır;
her sertifika adında `asnsim (not Apple)` yazar. İçindeki işlem ve yenileme bilgisi de aynı biçimde imzalanır ve
Apple'ın
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
ile [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload)
alanlarını içerir.

| Aile                             | Bildirimler                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Satın alma ve yenileme           | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`   |
| Faturalandırma sorunları         | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                      |
| Sona erme                        | `EXPIRED`; alt tür olarak `VOLUNTARY`, `BILLING_RETRY`, `PRICE_INCREASE`, `PRODUCT_NOT_FOR_SALE` veya alt türsüz   |
| Müşterinin yaptığı değişiklikler | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)         |
| İade ve iptal                    | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                    |
| Geliştiricinin talepleri         | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                               |
| Diğer payload'lar                | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT`; Advanced Commerce `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE` |

`asnsim types` her çifti, Apple'ın erişim açısından ne anlama geldiğini söylediğiyle birlikte yazdırır. Arkasındaki veri
[catalog/notifications.json](catalog/notifications.json) dosyasıdır ve Apple'ın sayfalarındaki
değerlerden farklı olduğunda testler başarısız olur. [What asnsim sends](docs/guides/notifications.md) rehberi,
her bildirimin hangi alanları değiştirdiğini ve Apple'ın sayfalarında değer verilmeyen yerlerde asnsim'in hangi değerleri seçtiğini listeler.

## Kullanım

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| Seçenek (run, send)     | Ne yapar                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `-u, --url <url>`       | Webhook                                                                                                    |
| `-d, --dir <folder>`    | `asnsim init` komutunun yazdığı klasör, varsayılan `.asnsim`                                               |
| `--clock live\|fixed`   | Her bildirimi gönderildiği anın tarihiyle damgalar (varsayılan) veya senaryonun kendi tarihlerini kullanır |
| `--start <date>`        | İlk olayın tarihi; saati sabit yapar                                                                       |
| `--seed <text>`         | Her çalıştırmada aynı işlem kimlikleri ve notificationUUID'ler                                             |
| `--retries <n>`         | Başarısız bildirimi değiştirmeden en fazla 5 kez yeniden gönderir                                          |
| `--duplicate`           | Her bildirimi iki kez gönderir                                                                             |
| `--timeout <ms>`        | İstek başına zaman sınırı, varsayılan 10000                                                                |
| `-H, --header <header>` | Webhook ve kontrolleri için ek istek başlığı, tekrarlanabilir                                              |
| `--out <folder>`        | Her istek gövdesini ayrıca bir dosyaya yazar                                                               |
| `--dry-run`             | İmzalar ve yazar, hiçbir şey göndermez                                                                     |
| `-f, --format <format>` | `tty` (varsayılan), `text`, `markdown` veya `json`; `--json` sonuncusunun kısaltmasıdır                    |
| `-o, --output <file>`   | Raporu bir dosyaya yazar                                                                                   |

Çıkış kodları: `0` her bildirim geçti (200 ile 206 arası yanıtlandı ya da adımın `expect` değeri sağlandı ve
kontrolü eşleşti), `1` bir teslimat, beklenti veya kontrol başarısız oldu, `2` hatalı argümanlar, test zinciri yok,
yüklenmeyen bir senaryo veya beklenmeyen bir hata. Bir JWS doğrulanmadığında `asnsim decode` 1 ile çıkar.

### Tek bir bildirim gönderin

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send`, bildirimin ihtiyaç duyduğu geçmişi (`BILLING_RECOVERY` öncesinde bir abonelik ve başarısız bir yenileme,
iade öncesinde bir satın alma) göndermeden oynatır; böylece kimlikleri ve tarihleri tutarlı olur.
`--all` 40'ının her birini bir kez gönderir: hiçbir türün handler'ınızı hataya düşürmediğini görmenin hızlı yolu.

### Senaryo yazın

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

Her adım, `after` veya `at` onu kaydırmadıkça olayın gerçekleşeceği anda gerçekleşir (yenileme dönemin sonunda,
sona erme billing retry'ın 60. gününde). [Write a scenario](docs/guides/scenarios.md)
her anahtarı açıklar.

| Yerleşik senaryo               | Adımlar                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `trial-renew-refund`           | ücretsiz deneme, ilk yenileme, iade                                                                |
| `billing-retry-grace-recovery` | yenileme, Billing Grace Period içinde başarısız yenileme, grace period sona erer, billing recovery |
| `billing-retry-expired`        | başarısız yenileme, 60 günlük yeniden deneme sonunda sona erme                                     |
| `cancel-expire-winback`        | otomatik yenileme kapalı, gönüllü sona erme, win-back teklifiyle yeniden abonelik                  |
| `upgrade-downgrade`            | hemen yükseltme, sonraki yenilemede düşürme                                                        |
| `price-increase-accepted`      | fiyat artışı beklemede, kabul edildi, yeni fiyatla yenileme                                        |
| `price-increase-declined`      | fiyat artışı beklemede, sona erme                                                                  |
| `consumable-refund-dispute`    | tüketilebilir ürün, tüketim talebi, iade, iade geri alındı                                         |
| `family-sharing-revoke`        | Family Sharing ile erişim, ardından iptal                                                          |

### App Store'un gönderdiğini çözün

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode, her JWS'yi Apple'ın `SignedDataVerifier`'ının çevrimiçi kontroller kapalıyken yaptığı gibi denetler:
her biri bir sonrakinin verdiği üç sertifika, Apple'ın iki uzantısı, `signedDate` anında geçerlilik,
ES256 imzası; bunu Apple Root CA - G3'e (yerleşik), `.asnsim` içindeki test köküne ve
verilen her `--root`'a karşı yapar. İptal kontrolü Apple'ın OCSP sunucusunu gerektirir ve yapılmaz.
Xcode'daki StoreKit Testing verisini Xcode imzalar; decode onu yazdırır ve Apple'ın kütüphaneleri gibi doğrulamayı atlar.
Ayrıntılar için [Decode what the App Store sent](docs/guides/decode.md) rehberine bakın.

### JavaScript'ten

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## Apple'ın kütüphaneleriyle kontrol edildi

| Kontrol                                                                                                                                          | Nerede                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 40 bildirimin her biri; işlemi, yenileme bilgisi ve app transaction'ı Apple'ın Node.js kütüphanesi 3.1.0 ile Sandbox ve Production'da doğrulandı | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test`            |
| Apple'ın Node.js kütüphanesiyle yazılmış bir webhook, entitlement senaryosunu geçer ve 40 türün hepsine 200 ile yanıt verir                      | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                                    |
| 40 gövdenin hepsi Apple'ın Swift kütüphanesi 6.0.0 ile doğrulandı                                                                                | [Examples workflow](.github/workflows/examples.yml); 28 Ekim 2026'da Swift 6.4 ile bir Mac'te (Apple silicon, M5 Max) |
| Apple'ın gerçek zinciri (Apple Root CA - G3, WWDR G6, 2025 receipt signing sertifikası) decode'un zincir kontrollerinden geçer                   | [test/unit/verify.test.ts](test/unit/verify.test.ts)                                                                  |
| StoreKit Testing'den (Xcode 27.1, iOS 27.0 Simulator) bir işlem ve yenileme bilgisi çözülür                                                      | [test/data/xcode](test/data/xcode)                                                                                    |

Test paketi 280 testten oluşur (birim, entegrasyon, snapshot ve uçtan uca).

## Demo

| Kayıt                                                                        | Açık · koyu                                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `asnsim init`                                                                | [açık](docs/media/demo-init-light.svg) · [koyu](docs/media/demo-init-dark.svg)                 |
| Her adımdan sonra kontrol içeren entitlement senaryosu (bu sayfanın en üstü) | [açık](docs/media/demo-checks-light.svg) · [koyu](docs/media/demo-checks-dark.svg)             |
| `--duplicate` ile `trial-renew-refund`                                       | [açık](docs/media/demo-trial-light.svg) · [koyu](docs/media/demo-trial-dark.svg)               |
| Başarısız olan bir kontrol ve çözümü                                         | [açık](docs/media/demo-failure-light.svg) · [koyu](docs/media/demo-failure-dark.svg)           |
| StoreKit Testing'in imzaladığı bir işlem üzerinde `asnsim decode`            | [açık](docs/media/demo-decode-xcode-light.svg) · [koyu](docs/media/demo-decode-xcode-dark.svg) |

28 Ekim 2026'da Node.js 26.12.1 ile bir Mac'te (Apple silicon, M5 Max) ölçüldü; her biri yedi çalıştırma,
Node.js başlangıç süresi dahil: examples/node-receiver'a karşı `asnsim send --all` (alıcıda her biri Apple'ın kütüphanesiyle
doğrulanan 40 bildirim) 0,16 ile 0,23 saniye sürdü, medyan 0,17; aynı komut `--dry-run` ile 0,11 ile 0,13 saniye.

## Durum

| Özellik                                                                                            | Durum           |
| -------------------------------------------------------------------------------------------------- | --------------- |
| Test zinciri, imzalama, 40 bildirim çifti, Sandbox ve Production                                   | çalışıyor       |
| Kontrollü senaryolar, tekrarlar, yeniden denemeler, canlı ve sabit saatler; dokuz yerleşik senaryo | çalışıyor       |
| Apple Root CA - G3, test kökleri ve StoreKit Testing verisiyle decode                              | çalışıyor       |
| Terminal, metin, Markdown ve JSON raporları; çıkış kodları                                         | çalışıyor       |
| `billingPlanType`, `commitmentInfo`, `eligibleWinBackOfferIds`, `advancedCommerceInfo` alanları    | planlandı (0.2) |
| Tek senaryoda birden fazla müşteri ve abonelik grubu                                               | planlandı (0.2) |
| Sıra dışı teslimat ve gerçek zamanlı production yeniden deneme takvimi                             | planlandı (0.3) |
| App Store Server API mock'u (Get Transaction History, Get All Subscription Statuses)               | planlandı (0.4) |
| Kararlı senaryo biçimi ve JSON düzeni                                                              | planlandı (1.0) |

## Sınırlar

- **Yakalanmış değil, simüle edilmiş.** Payload'lar Apple'ın alan tanımlarını ve her bildirim için yaptığı
  açıklamaları izler; Apple'ın sunucularının gönderdiklerinin kopyası değildir. Apple'ın sayfalarında değer
  verilmeyen yerlerde (işlem kimliği biçimleri, grace period süresi, storefront) asnsim bir değer seçer; bunlar
  [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes) rehberinde listelenir ve her değer
  adım başına `set` ile değiştirilebilir.
- **Apple'ın değil, bir test kökü.** asnsim'in imzaladığı hiçbir şey Apple Root CA - G3'e karşı doğrulanmaz. Bir backend
  testlerinde `.asnsim/root.cer` dosyasına güvenmelidir ve production'da ona asla güvenmemelidir.
- **Çevrimiçi kontroller kapalı.** Çevrimiçi kontroller açıkken Apple'ın doğrulayıcıları iptali Apple'ın OCSP sunucusuyla denetler;
  test zincirinin OCSP sunucusu yoktur, bu yüzden testler bunlar kapalıyken çalışır.
- **Senaryo başına bir müşteri;** bir abonelik grubu ve istenen sayıda tek seferlik satın alma.
- **Sınırlı girdi.** En çok 1 MB ve 500 adımlı senaryo dosyaları, en çok 2 MB decode girdisi, en çok
  1.000.000 karakterlik bir JWS, en çok 32 düzey iç içe sertifika ve her yanıtın ilk 64 KB'ı.

## Dokümantasyon

API başvurusu ve rehberler: [muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/).

## Rehberler

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## Kaynaklar

28 Ekim 2026'da okundu:

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
  ve bunlardan bağlanan değer sayfaları (expirationIntent, revocationReason, revocationType,
  offerType, offerDiscountType, transactionReason, autoRenewStatus, priceIncreaseStatus).
- Apple PKI: [Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/).
- Apple'ın App Store Server Library'leri:
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0),
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0),
  [Java](https://github.com/apple/app-store-server-library-java) ve
  [Python](https://github.com/apple/app-store-server-library-python):
  `SignedDataVerifier`'ın kontrolleri.
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (JWS) ve
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280) (X.509).

## Gereksinimler

macOS, Linux veya Windows üzerinde Node.js 22.12 veya üstü. Başka bir şey gerekmez: Xcode yok, Apple hesabı yok,
webhook'unuz dışında ağ yok. Swift örneği için Swift 6.0 veya üstü gerekir.

## Mimari

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

- Bildirim verisi koddan ayrıdır ve testler onu Apple'ın sayfalarıyla karşılaştırır.
- CLI (`src/cli/`) yalnızca argümanları ayrıştırır, renkleri ve genişlikleri seçer ve çıkış kodunu belirler.
- Hiçbir bağımlılık sertifika imzalamaz veya ayrıştırmaz: asnsim DER'i kendisi yazar ve okur, imzayı Node.js
  `crypto` atar.

## İlgili

[glassready](https://github.com/muhittincamdali/glassready), iOS 27 SDK'sıyla derlenen bir uygulamada Liquid Glass'ın
neyi değiştirdiğini, [a11ylabel](https://github.com/muhittincamdali/a11ylabel) ise hangi App Store
erişilebilirlik etiketlerini kullanabileceğinizi gösterir. asnsim, satın alımların arkasındaki backend'in ne yaptığını test eder.

## SSS

**Bu, sandbox'ta test etmenin yerini tutar mı?** Hayır. Sandbox gerçek App Store'u ve App Store Connect
yapılandırmanızı test eder; asnsim ise backend'inizin her bildirimi nasıl işlediğini, sandbox çalıştırmalarından önce ve arasında
istediğiniz sıklıkta test eder.

**asnsim'den çıkan bir bildirim bir production sunucusuna ulaşabilir mi?** Yalnızca o sunucu test köküne güveniyorsa.
Yalnızca Apple Root CA - G3'e güvenen bir sunucu, testlerin de doğruladığı gibi asnsim'in her bildirimini reddeder.

**Flutter veya React Native'e özgü bir kurulum gerekiyor mu?** Hayır. Uygulama neyle yazılmış olursa olsun
bildirimler App Store'dan sunucunuza gider; asnsim'in test ettiği, onları işleyen backend'dir.

## Katkıda bulunma

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## Lisans

MIT lisansıyla yayımlanmıştır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.
