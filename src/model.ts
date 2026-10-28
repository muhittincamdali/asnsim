// The decoded payloads of App Store Server Notifications V2, with the fields asnsim writes. Field
// names, types and meanings follow Apple's pages (read 28 October 2026):
// https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload
// https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload
// https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload
// Dates are UNIX times in milliseconds; prices are in milliunits of the currency.

export type EnvironmentName = 'Sandbox' | 'Production';

export interface TransactionPayload {
  transactionId: string;
  originalTransactionId: string;
  webOrderLineItemId?: string;
  bundleId: string;
  productId: string;
  subscriptionGroupIdentifier?: string;
  purchaseDate: number;
  originalPurchaseDate: number;
  expiresDate?: number;
  quantity: number;
  type: string;
  appAccountToken?: string;
  inAppOwnershipType: 'PURCHASED' | 'FAMILY_SHARED' | 'ASSIGNED';
  signedDate: number;
  revocationReason?: 0 | 1;
  revocationDate?: number;
  revocationType?: 'REFUND_FULL' | 'REFUND_PRORATED' | 'FAMILY_REVOKE' | 'ASSIGNMENT_REVOKE';
  revocationPercentage?: number;
  isUpgraded?: boolean;
  offerType?: 1 | 2 | 3 | 4;
  offerIdentifier?: string;
  offerDiscountType?: 'FREE_TRIAL' | 'PAY_AS_YOU_GO' | 'PAY_UP_FRONT' | 'ONE_TIME';
  offerPeriod?: string;
  environment: EnvironmentName;
  transactionReason: 'PURCHASE' | 'RENEWAL';
  storefront: string;
  storefrontId: string;
  price: number;
  currency: string;
  appTransactionId: string;
  previousOriginalTransactionId?: string;
  [extra: string]: unknown;
}

export interface RenewalInfoPayload {
  originalTransactionId: string;
  autoRenewProductId: string;
  productId: string;
  autoRenewStatus: 0 | 1;
  expirationIntent?: 1 | 2 | 3 | 4 | 5;
  isInBillingRetryPeriod?: boolean;
  gracePeriodExpiresDate?: number;
  priceIncreaseStatus?: 0 | 1;
  offerType?: 1 | 2 | 3 | 4;
  offerIdentifier?: string;
  offerDiscountType?: 'FREE_TRIAL' | 'PAY_AS_YOU_GO' | 'PAY_UP_FRONT';
  offerPeriod?: string;
  renewalPrice: number;
  currency: string;
  signedDate: number;
  environment: EnvironmentName;
  recentSubscriptionStartDate: number;
  renewalDate: number;
  appTransactionId: string;
  appAccountToken?: string;
  [extra: string]: unknown;
}

export interface AppTransactionPayload {
  receiptType: EnvironmentName;
  appAppleId?: number;
  bundleId: string;
  originalApplicationVersion: string;
  receiptCreationDate: number;
  originalPurchaseDate: number;
  originalPlatform: string;
  appTransactionId: string;
  [extra: string]: unknown;
}

/** 1 active, 2 expired, 3 billing retry, 4 Billing Grace Period, 5 revoked. */
export type SubscriptionStatus = 1 | 2 | 3 | 4 | 5;

export interface DataObject {
  appAppleId?: number;
  bundleId: string;
  bundleVersion: string;
  environment: EnvironmentName;
  signedTransactionInfo?: string;
  signedRenewalInfo?: string;
  status?: SubscriptionStatus;
  consumptionRequestReason?: string;
  [extra: string]: unknown;
}

export interface SummaryObject {
  requestIdentifier: string;
  environment: EnvironmentName;
  appAppleId?: number;
  bundleId: string;
  productId: string;
  storefrontCountryCodes?: string[];
  failedCount: number;
  succeededCount: number;
}

export interface ExternalPurchaseTokenObject {
  externalPurchaseId: string;
  tokenCreationDate: number;
  appAppleId?: number;
  bundleId: string;
  tokenExpirationDate?: number;
  tokenType?: 'SERVICES' | 'ACQUISITION' | 'CORE_TECHNOLOGY';
}

export interface AppDataObject {
  appAppleId?: number;
  bundleId: string;
  environment: EnvironmentName;
  signedAppTransactionInfo?: string;
}

/** responseBodyV2DecodedPayload: the JSON inside signedPayload. */
export interface NotificationPayload {
  notificationType: string;
  subtype?: string;
  notificationUUID: string;
  data?: DataObject;
  summary?: SummaryObject;
  externalPurchaseToken?: ExternalPurchaseTokenObject;
  appData?: AppDataObject;
  version: '2.0';
  signedDate: number;
  [extra: string]: unknown;
}

/** responseBodyV2: what the App Store POSTs to your server. */
export interface NotificationBody {
  signedPayload: string;
}
