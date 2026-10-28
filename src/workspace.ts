import { createPrivateKey } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { fingerprint, readCertificates, toPem } from './pki/certificate.js';
import { type ChainOptions, createTestChain, type TestChain } from './pki/chain.js';

// The folder `asnsim init` writes (.asnsim by default): the test chain, the private key of its
// signing certificate and the app the notifications are for. Nothing else in the project changes.

export const DEFAULT_DIR = '.asnsim';

export const FILES = {
  settings: 'asnsim.json',
  rootDer: 'root.cer',
  rootPem: 'root.pem',
  intermediate: 'intermediate.pem',
  signing: 'signing.pem',
  signingKey: 'signing-key.pem',
  gitignore: '.gitignore',
} as const;

export class WorkspaceError extends Error {
  override name = 'WorkspaceError';
}

export const ENVIRONMENTS = ['Sandbox', 'Production'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

const BUNDLE_ID = /^[A-Za-z0-9][A-Za-z0-9.-]{0,154}$/;

export const appSettingsSchema = z.object({
  bundleId: z.string().regex(BUNDLE_ID, 'a bundle identifier such as com.example.app'),
  bundleVersion: z.string().min(1).max(64),
  environment: z.enum(ENVIRONMENTS),
  appAppleId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

const settingsFileSchema = z.object({
  schemaVersion: z.literal(1),
  createdAt: z.string(),
  app: appSettingsSchema,
  certificates: z.object({
    root: z.string(),
    intermediate: z.string(),
    signing: z.string(),
  }),
});

export interface Workspace {
  dir: string;
  app: AppSettings;
  chain: TestChain;
  createdAt: string;
}

export const DEFAULT_APP: AppSettings = {
  bundleId: 'com.example.app',
  bundleVersion: '1',
  environment: 'Sandbox',
};

/** Checks the app settings; Production needs appAppleId, as Apple's verifier does. */
export function checkAppSettings(app: AppSettings): AppSettings {
  const parsed = appSettingsSchema.safeParse(app);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new WorkspaceError(
      `Invalid ${issue?.path.join('.') || 'settings'}: ${issue?.message ?? 'not valid'}`,
    );
  }
  if (parsed.data.environment === 'Production' && parsed.data.appAppleId === undefined) {
    throw new WorkspaceError(
      'The Production environment needs --app-apple-id: Production notifications carry the app’s Apple ID and Apple’s verifier checks it.',
    );
  }
  return parsed.data;
}

const GITIGNORE = `# Written by asnsim init. A test chain and its private key are for one machine or one CI run:
# create them again with \`asnsim init\` rather than committing them.
*
`;

export interface InitOptions extends ChainOptions {
  force?: boolean;
}

/** Writes a new test chain and the app settings into `dir`; returns the files written. */
export function initWorkspace(dir: string, app: AppSettings, options: InitOptions = {}): string[] {
  const settings = checkAppSettings(app);
  const target = resolve(dir);
  if (existsSync(target) && !lstatSync(target).isDirectory()) {
    throw new WorkspaceError(`${dir} exists and is not a folder.`);
  }
  if (existsSync(join(target, FILES.settings)) && !options.force) {
    throw new WorkspaceError(
      `${join(dir, FILES.settings)} already exists. Pass --force to replace the test chain; backends that trust the old root.cer must then load the new one.`,
    );
  }
  mkdirSync(target, { recursive: true });
  const chain = createTestChain(options);
  const now = options.now ?? new Date();
  const files: [string, string | Uint8Array, number?][] = [
    [FILES.rootDer, chain.root],
    [FILES.rootPem, toPem(chain.root)],
    [FILES.intermediate, toPem(chain.intermediate)],
    [FILES.signing, toPem(chain.signing)],
    [FILES.signingKey, chain.signingKey.export({ type: 'pkcs8', format: 'pem' }).toString(), 0o600],
    [
      FILES.settings,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          createdAt: now.toISOString(),
          app: settings,
          certificates: {
            root: fingerprint(chain.root),
            intermediate: fingerprint(chain.intermediate),
            signing: fingerprint(chain.signing),
          },
        },
        null,
        2,
      )}\n`,
    ],
    [FILES.gitignore, GITIGNORE],
  ];
  for (const [name, content, mode] of files) {
    writeFileSync(join(target, name), content, mode === undefined ? {} : { mode });
  }
  return files.map(([name]) => join(dir, name));
}

function readFile(dir: string, name: string): Buffer {
  const path = join(dir, name);
  try {
    return readFileSync(path);
  } catch {
    throw new WorkspaceError(`Cannot read ${path}. Run \`asnsim init\` first.`);
  }
}

/** Reads the folder `asnsim init` wrote. */
export function loadWorkspace(dir: string = DEFAULT_DIR): Workspace {
  const target = resolve(dir);
  if (!existsSync(join(target, FILES.settings))) {
    throw new WorkspaceError(
      `No test chain in ${dir}. Run \`asnsim init\` first (or pass --dir to the folder it wrote).`,
    );
  }
  let settings: z.infer<typeof settingsFileSchema>;
  try {
    settings = settingsFileSchema.parse(JSON.parse(readFile(target, FILES.settings).toString()));
  } catch (error) {
    if (error instanceof WorkspaceError) throw error;
    throw new WorkspaceError(`${join(dir, FILES.settings)} is not a file asnsim init wrote.`);
  }
  const pem = (name: string) => {
    const [der] = readCertificates(readFile(target, name));
    if (!der) throw new WorkspaceError(`${join(dir, name)} holds no certificate.`);
    return der;
  };
  const chain: TestChain = {
    root: pem(FILES.rootPem),
    intermediate: pem(FILES.intermediate),
    signing: pem(FILES.signing),
    signingKey: createPrivateKey(readFile(target, FILES.signingKey)),
  };
  if (fingerprint(chain.signing) !== settings.certificates.signing) {
    throw new WorkspaceError(
      `${join(dir, FILES.signing)} is not the certificate asnsim init wrote; run \`asnsim init --force\`.`,
    );
  }
  return {
    dir: target,
    app: checkAppSettings(settings.app),
    chain,
    createdAt: settings.createdAt,
  };
}
