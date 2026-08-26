import type { AxiosRequestConfig } from "axios";

export interface WebhookDeliveryInput {
  body: Readonly<Record<string, unknown>>;
  deliveryId: string;
  url: string;
}

export interface WebhookDispatchPlan {
  calls: AxiosRequestConfig[];
  deliveryId: string;
  exhaustedAttempts: boolean;
}

const HARD_ATTEMPT_CEILING = 5;

const DEFAULT_FIRST_ATTEMPT = 1;

interface RetryPlanOptions {
  firstAttempt?: number;
  maxAttempts?: number;
}

export function planWebhookDelivery(
  input: WebhookDeliveryInput,
  attempt: number,
): AxiosRequestConfig {
  return {
    data: structuredClone(input.body),
    headers: {
      "content-type": "application/json",
      "x-relay-attempt": String(attempt),
      "x-relay-delivery-id": input.deliveryId,
    },
    method: "post",
    url: input.url,
  };
}

export function planWebhookRetries(
  input: WebhookDeliveryInput,
  options?: RetryPlanOptions,
): WebhookDispatchPlan {
  const firstAttempt = Math.max(
    DEFAULT_FIRST_ATTEMPT,
    options?.firstAttempt ?? DEFAULT_FIRST_ATTEMPT,
  );
  const requestedAttempts = Math.max(1, options?.maxAttempts ?? 1);
  const attemptCount = Math.min(requestedAttempts, HARD_ATTEMPT_CEILING - firstAttempt + 1);

  const calls: AxiosRequestConfig[] = [];
  for (let attempt = firstAttempt; calls.length < attemptCount; attempt += 1) {
    calls.push(planWebhookDelivery(input, attempt));
  }

  return {
    calls,
    deliveryId: input.deliveryId,
    exhaustedAttempts: firstAttempt + requestedAttempts - 1 > HARD_ATTEMPT_CEILING,
  };
}
