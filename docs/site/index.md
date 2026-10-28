# asnsim

asnsim simulates App Store Server Notifications V2 on your machine. It creates a test certificate
chain shaped like the App Store's, signs every notification type and subtype with it, and posts
them to your webhook as scenarios: a free trial that renews and is refunded, a renewal that fails
into Billing Grace Period and recovers, an upgrade, a price increase. Your backend keeps Apple's
own verification code and trusts the test root only in tests.

```sh
brew install muhittincamdali/tap/asnsim
asnsim init
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

Without Homebrew, npm installs the same package from the
[GitHub release](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0) (Node.js 22.12
or later):

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.0/asnsim-0.1.0.tgz
```

Publishing to the npm registry as `@mcamdali/asnsim` is planned.

## Guides

- [Trust the test root in your backend's tests](../guides/trust-the-test-root.md)
- [Write a scenario](../guides/scenarios.md)
- [What asnsim sends for each notification](../guides/notifications.md)
- [Decode what the App Store sent](../guides/decode.md)
- [Run asnsim in CI](../guides/ci.md)
- [Troubleshooting](../guides/troubleshooting.md)

## API

The command line is a thin layer over the package's exports, so a test suite can sign
notifications or play scenarios from JavaScript:

```ts
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const workspace = loadWorkspace('.asnsim');
const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace,
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

Start with {@link runScenario}, {@link sendNotification} and {@link decode}. To sign without
sending, play a {@link Simulation} and pass its events to {@link buildParts} and
{@link signParts}. The JSON reports carry `schemaVersion` 0 until the layout is declared stable in
1.0.
