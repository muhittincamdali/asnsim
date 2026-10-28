// What can go wrong when asnsim delivers a notification, with the fix for each and the section of
// the troubleshooting guide that explains it. The App Store's own rules are quoted from
// https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications
// and https://developer.apple.com/documentation/appstoreservernotifications/notificationuuid
// (read 28 October 2026).

export type FindingCode =
  | 'connection-failed'
  | 'timeout'
  | 'redirect'
  | 'rejected'
  | 'unexpected-status'
  | 'duplicate-differs'
  | 'check-failed'
  | 'check-unreachable';

export interface Fix {
  steps: string[];
  guide: string;
}

export interface Finding {
  code: FindingCode;
  /** One sentence: what happened. */
  message: string;
  fix: Fix;
}

const GUIDE = 'https://github.com/muhittincamdali/asnsim/blob/main/docs/guides/troubleshooting.md';

export const RETRY_NOTE =
  'In production the App Store retries a failed notification five times, 1, 12, 24, 48 and 72 hours after the previous attempt; in the sandbox it sends it once.';

const SUCCESS_RULE =
  'The App Store counts HTTP 200 to 206 as success and every other status as a failed delivery.';

export const FIXES: Record<FindingCode, Fix> = {
  'connection-failed': {
    steps: [
      'Start the server that receives notifications and check the host, port and path of --url.',
      'A server inside a container or VM must listen on an address the machine running asnsim can reach.',
    ],
    guide: `${GUIDE}#nothing-answered`,
  },
  timeout: {
    steps: [
      'Answer as soon as the notification is stored, and do slow work (emails, analytics) afterwards.',
      'Raise --timeout if the endpoint is slow only on this machine.',
    ],
    guide: `${GUIDE}#no-answer-in-time`,
  },
  redirect: {
    steps: [
      `${SUCCESS_RULE} A redirect is not followed: give App Store Connect, and --url, the final URL (scheme, host and trailing slash included).`,
    ],
    guide: `${GUIDE}#redirects`,
  },
  rejected: {
    steps: [
      `${SUCCESS_RULE} ${RETRY_NOTE}`,
      'If the endpoint rejects payloads it cannot verify, configure its tests to trust .asnsim/root.cer with online checks off, and the bundle ID and environment in .asnsim/asnsim.json.',
      'Return 200 for notification types the server does not handle, so the App Store does not retry them.',
    ],
    guide: `${GUIDE}#rejected`,
  },
  'unexpected-status': {
    steps: [
      'The step expects another status: check the endpoint, or the expect.status of the step.',
    ],
    guide: `${GUIDE}#rejected`,
  },
  'duplicate-differs': {
    steps: [
      'The App Store gives each notification a notificationUUID to "identify, and ignore, duplicate notifications": store it, and answer a notification you have already processed with 200 without processing it again.',
    ],
    guide: `${GUIDE}#duplicates`,
  },
  'check-failed': {
    steps: [
      'The backend did not reach the state the step checks for. The guide lists what each notification means for access.',
    ],
    guide: `${GUIDE}#check-failed`,
  },
  'check-unreachable': {
    steps: ['The check URL did not answer: check its host, port and path.'],
    guide: `${GUIDE}#check-failed`,
  },
};

export function finding(code: FindingCode, message: string, extra: string[] = []): Finding {
  const fix = FIXES[code];
  return { code, message, fix: { steps: [...extra, ...fix.steps], guide: fix.guide } };
}
