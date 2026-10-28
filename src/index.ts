// The JavaScript API of asnsim: everything the command line does, for test suites that want to
// sign notifications or run scenarios from code.

export {
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
  type DecodeResult,
  decode,
  DecodeError,
} from './decode/decode.js';
export { decodeJws, signJws } from './jws/jws.js';
export type * from './model.js';
export { APPLE_ROOT_CA_G3, APPLE_ROOT_CA_G3_SHA256 } from './pki/apple-root.js';
export { type CertificateInfo, readCertificate, toPem } from './pki/certificate.js';
export { createTestChain, type TestChain } from './pki/chain.js';
export { type ChainVerification, type TrustedRoot, verifySignedData } from './pki/verify.js';
export { renderDecode } from './report/decode.js';
export { renderRun } from './report/run.js';
export { FORMATS, type Format } from './report/style.js';
export type { Finding, FindingCode } from './run/findings.js';
export {
  type RunOptions,
  type RunResult,
  runScenario,
  type SendOptions,
  type StepResult,
  sendAll,
  sendNotification,
} from './run/run.js';
export { builtInScenarios, loadScenario, parseScenario, ScenarioError } from './scenario/load.js';
export type { Scenario, ScenarioInput } from './scenario/schema.js';
export {
  buildParts,
  type NotificationParts,
  type SignedNotification,
  signParts,
} from './sim/payloads.js';
export { DEFAULT_PRODUCTS, type Product } from './sim/products.js';
export { type SimulatedEvent, Simulation, SimulationError } from './sim/simulation.js';
export type { StepInput } from './sim/step.js';
export { VERSION } from './version.js';
export {
  type AppSettings,
  DEFAULT_APP,
  initWorkspace,
  loadWorkspace,
  type Workspace,
  WorkspaceError,
} from './workspace.js';
