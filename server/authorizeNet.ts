/**
 * Authorize.net Integration Service
 * 
 * Handles payment processing via:
 * - Accept Hosted: Secure hosted payment form for card entry
 * - CIM (Customer Information Manager): Store customer payment profiles
 * - ARB (Automated Recurring Billing): Recurring subscriptions
 */

import crypto from 'crypto';
import { BILLING_PRICES, type BillingPlanType } from '@shared/schema';

// Environment configuration
const getConfig = () => ({
  apiLoginId: process.env.AUTHORIZE_NET_API_LOGIN_ID || '',
  transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY || '',
  signatureKey: process.env.AUTHORIZE_NET_SIGNATURE_KEY || '',
  environment: (process.env.AUTHORIZE_NET_ENV || 'sandbox') as 'sandbox' | 'production',
});

const getApiUrl = () => {
  const { environment } = getConfig();
  return environment === 'production'
    ? 'https://api.authorize.net/xml/v1/request.api'
    : 'https://apitest.authorize.net/xml/v1/request.api';
};

const getAcceptHostedUrl = () => {
  const { environment } = getConfig();
  return environment === 'production'
    ? 'https://accept.authorize.net'
    : 'https://test.authorize.net';
};

// Check if Authorize.net is configured
export function isAuthorizeNetConfigured(): boolean {
  const { apiLoginId, transactionKey } = getConfig();
  return !!(apiLoginId && transactionKey);
}

// Base API request helper
async function makeApiRequest(payload: object): Promise<any> {
  const { apiLoginId, transactionKey } = getConfig();
  
  if (!apiLoginId || !transactionKey) {
    throw new Error('Authorize.net credentials not configured');
  }

  const requestBody = {
    ...payload,
    merchantAuthentication: {
      name: apiLoginId,
      transactionKey: transactionKey,
    },
  };

  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const text = await response.text();
  // Remove BOM if present
  const cleanText = text.replace(/^\uFEFF/, '');
  const result = JSON.parse(cleanText);

  if (result.messages?.resultCode === 'Error') {
    const errorMessage = result.messages?.message?.[0]?.text || 'Unknown Authorize.net error';
    throw new Error(errorMessage);
  }

  return result;
}

// ========================
// Accept Hosted (Secure Card Entry)
// ========================

interface GetHostedTokenParams {
  customerId: string; // Our internal company ID
  customerEmail: string;
  returnUrl: string;
  cancelUrl: string;
  existingCustomerProfileId?: string;
}

export async function getAcceptHostedFormToken(params: GetHostedTokenParams): Promise<{
  token: string;
  formUrl: string;
}> {
  const payload: any = {
    getHostedPaymentPageRequest: {
      refId: `company_${params.customerId}`,
      hostedPaymentSettings: {
        setting: [
          {
            settingName: 'hostedPaymentReturnOptions',
            settingValue: JSON.stringify({
              showReceipt: false,
              url: params.returnUrl,
              urlText: 'Continue',
              cancelUrl: params.cancelUrl,
              cancelUrlText: 'Cancel',
            }),
          },
          {
            settingName: 'hostedPaymentButtonOptions',
            settingValue: JSON.stringify({
              text: 'Save Payment Method',
            }),
          },
          {
            settingName: 'hostedPaymentStyleOptions',
            settingValue: JSON.stringify({
              bgColor: '#f5f5dc',
            }),
          },
          {
            settingName: 'hostedPaymentPaymentOptions',
            settingValue: JSON.stringify({
              cardCodeRequired: true,
              showCreditCard: true,
              showBankAccount: false,
            }),
          },
          {
            settingName: 'hostedPaymentSecurityOptions',
            settingValue: JSON.stringify({
              captcha: false,
            }),
          },
          {
            settingName: 'hostedPaymentBillingAddressOptions',
            settingValue: JSON.stringify({
              show: true,
              required: true,
            }),
          },
          {
            settingName: 'hostedPaymentCustomerOptions',
            settingValue: JSON.stringify({
              showEmail: true,
              requiredEmail: true,
              addPaymentProfile: true,
            }),
          },
        ],
      },
    },
  };

  // If updating existing profile, add transaction request to create profile
  if (!params.existingCustomerProfileId) {
    payload.getHostedPaymentPageRequest.transactionRequest = {
      transactionType: 'authCaptureTransaction',
      amount: '0.00',
      customer: {
        id: `company_${params.customerId}`,
        email: params.customerEmail,
      },
      profile: {
        createProfile: true,
      },
    };
  }

  const result = await makeApiRequest(payload);
  
  return {
    token: result.token,
    formUrl: `${getAcceptHostedUrl()}/payment/payment`,
  };
}

// ========================
// CIM (Customer Information Manager)
// ========================

interface CreateCustomerProfileParams {
  companyId: number;
  email: string;
  description?: string;
}

export async function createCustomerProfile(params: CreateCustomerProfileParams): Promise<{
  customerProfileId: string;
}> {
  const result = await makeApiRequest({
    createCustomerProfileRequest: {
      profile: {
        merchantCustomerId: `company_${params.companyId}`,
        description: params.description || `Company ${params.companyId}`,
        email: params.email,
      },
    },
  });

  return {
    customerProfileId: result.customerProfileId,
  };
}

export async function getCustomerProfile(customerProfileId: string): Promise<{
  profile: any;
  paymentProfiles: any[];
}> {
  const result = await makeApiRequest({
    getCustomerProfileRequest: {
      customerProfileId,
      includeIssuerInfo: true,
    },
  });

  return {
    profile: result.profile,
    paymentProfiles: result.profile?.paymentProfiles || [],
  };
}

export async function deleteCustomerPaymentProfile(
  customerProfileId: string,
  paymentProfileId: string
): Promise<void> {
  await makeApiRequest({
    deleteCustomerPaymentProfileRequest: {
      customerProfileId,
      customerPaymentProfileId: paymentProfileId,
    },
  });
}

// ========================
// ARB (Automated Recurring Billing)
// ========================

interface CreateSubscriptionParams {
  customerProfileId: string;
  paymentProfileId: string;
  planType: BillingPlanType;
  activeUserCount: number;
  companyId: number;
  startDate?: Date;
}

function calculateSubscriptionAmount(planType: BillingPlanType, userCount: number): number {
  const prices = BILLING_PRICES[planType];
  const baseCents = prices.baseCents;
  const userCents = prices.perUserCents * userCount;
  const totalCents = baseCents + userCents;
  return totalCents / 100; // Convert to dollars
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<{
  subscriptionId: string;
  amountDollars: number;
}> {
  const amount = calculateSubscriptionAmount(params.planType, params.activeUserCount);
  const startDate = params.startDate || new Date();
  
  // Format date as YYYY-MM-DD
  const formattedStartDate = startDate.toISOString().split('T')[0];
  
  const interval = params.planType === 'monthly' 
    ? { length: 1, unit: 'months' }
    : { length: 12, unit: 'months' };

  const result = await makeApiRequest({
    ARBCreateSubscriptionRequest: {
      refId: `company_${params.companyId}_${params.planType}`,
      subscription: {
        name: `AdmitSimple ${params.planType === 'monthly' ? 'Monthly' : 'Annual'} Subscription`,
        paymentSchedule: {
          interval,
          startDate: formattedStartDate,
          totalOccurrences: 9999, // Indefinite
        },
        amount: amount.toFixed(2),
        profile: {
          customerProfileId: params.customerProfileId,
          customerPaymentProfileId: params.paymentProfileId,
        },
      },
    },
  });

  return {
    subscriptionId: result.subscriptionId,
    amountDollars: amount,
  };
}

export async function updateSubscriptionAmount(
  subscriptionId: string,
  planType: BillingPlanType,
  activeUserCount: number
): Promise<void> {
  const amount = calculateSubscriptionAmount(planType, activeUserCount);
  
  await makeApiRequest({
    ARBUpdateSubscriptionRequest: {
      subscriptionId,
      subscription: {
        amount: amount.toFixed(2),
      },
    },
  });
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await makeApiRequest({
    ARBCancelSubscriptionRequest: {
      subscriptionId,
    },
  });
}

export async function getSubscriptionStatus(subscriptionId: string): Promise<{
  status: string;
  subscription: any;
}> {
  const result = await makeApiRequest({
    ARBGetSubscriptionRequest: {
      subscriptionId,
    },
  });

  return {
    status: result.subscription?.status || 'unknown',
    subscription: result.subscription,
  };
}

// ========================
// Charge Customer Profile (One-time charge)
// ========================

export async function chargeCustomerProfile(
  customerProfileId: string,
  paymentProfileId: string,
  amountDollars: number,
  description: string,
  invoiceNumber: string
): Promise<{
  transactionId: string;
  responseCode: string;
}> {
  const result = await makeApiRequest({
    createTransactionRequest: {
      refId: invoiceNumber,
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: amountDollars.toFixed(2),
        profile: {
          customerProfileId,
          paymentProfile: {
            paymentProfileId,
          },
        },
        order: {
          invoiceNumber,
          description,
        },
      },
    },
  });

  const transactionResponse = result.transactionResponse;
  
  if (transactionResponse?.responseCode !== '1') {
    const errorMessage = transactionResponse?.errors?.[0]?.errorText || 'Transaction failed';
    throw new Error(errorMessage);
  }

  return {
    transactionId: transactionResponse.transId,
    responseCode: transactionResponse.responseCode,
  };
}

// ========================
// Webhook Signature Validation
// ========================

export function validateWebhookSignature(
  payload: string,
  signatureHeader: string
): boolean {
  const { signatureKey } = getConfig();
  
  if (!signatureKey) {
    console.warn('Authorize.net signature key not configured, skipping validation');
    return true; // Allow in development
  }

  const hash = crypto
    .createHmac('sha512', signatureKey)
    .update(payload)
    .digest('hex')
    .toUpperCase();

  return hash === signatureHeader.toUpperCase();
}

// ========================
// Trial Management Helpers
// ========================

export function calculateTrialEndDate(): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + BILLING_PRICES.trialDays);
  return endDate;
}

export function isTrialExpired(trialEndDate: Date | null): boolean {
  if (!trialEndDate) return true;
  return new Date() > new Date(trialEndDate);
}

export function formatPriceDisplay(planType: BillingPlanType, userCount: number): {
  basePrice: string;
  userPrice: string;
  totalPrice: string;
  period: string;
} {
  const prices = BILLING_PRICES[planType];
  const baseDollars = prices.baseCents / 100;
  const userDollars = (prices.perUserCents * userCount) / 100;
  const totalDollars = baseDollars + userDollars;
  const period = planType === 'monthly' ? '/month' : '/year';

  return {
    basePrice: `$${baseDollars.toFixed(2)}`,
    userPrice: `$${userDollars.toFixed(2)}`,
    totalPrice: `$${totalDollars.toFixed(2)}`,
    period,
  };
}
