// The JavaScript API of asnsim: everything the command line does, for test suites that want to
// sign notifications or run scenarios from code.

export {
  ACCESS,
  type Access,
  type CatalogEvent,
  catalog,
  eventName,
  events,
  findEvent,
  PRODUCT_TYPES,
  type ProductType,
} from './catalog.js';
export {
  type DecodedPart,
  type DecodeOptions,
  type DecodeProblem,
  type DecodeProblemCode,
  type DecodeResult,
  decode,
  DecodeError,
  type PartKind,
} from './decode/decode.js';
export { type DecodedJws, decodeJws, type JwsHeader, signJws } from './jws/jws.js';
export type * from './model.js';
export { APPLE_ROOT_CA_G3, APPLE_ROOT_CA_G3_SHA256 } from './pki/apple-root.js';
export { type CertificateInfo, type Extension, readCertificate, toPem } from './pki/certificate.js';
export { type ChainOptions, createTestChain, type TestChain } from './pki/chain.js';
export {
  type ChainVerification,
  type Problem,
  type ProblemCode,
  type TrustedRoot,
  verifySignedData,
} from './pki/verify.js';
export { renderDecode } from './report/decode.js';
export { type RenderOptions, renderRun } from './report/run.js';
export { FORMATS, type Format } from './report/style.js';
export type { Finding, FindingCode, Fix } from './run/findings.js';
export {
  type Attempt,
  type CheckResult,
  type Clock,
  type RunOptions,
  type RunResult,
  runScenario,
  type SendOptions,
  type StepResult,
  sendAll,
  sendNotification,
} from './run/run.js';
export { builtInScenarios, loadScenario, parseScenario, ScenarioError } from './scenario/load.js';
export { type Scenario, type ScenarioInput, scenarioSchema } from './scenario/schema.js';
export {
  buildParts,
  type NotificationParts,
  type SignedNotification,
  signParts,
} from './sim/payloads.js';
export { DEFAULT_PRODUCTS, type Product } from './sim/products.js';
export type { Random } from './sim/random.js';
export {
  type SimulatedEvent,
  Simulation,
  SimulationError,
  type SimulationOptions,
} from './sim/simulation.js';
export type {
  CustomerState,
  Offer,
  Ownership,
  Revocation,
  Subscription,
  Transaction,
} from './sim/state.js';
export { type StepInput, stepSchema } from './sim/step.js';
export { VERSION } from './version.js';
export {
  type AppSettings,
  appSettingsSchema,
  DEFAULT_APP,
  type InitOptions,
  initWorkspace,
  loadWorkspace,
  type Workspace,
  WorkspaceError,
} from './workspace.js';
