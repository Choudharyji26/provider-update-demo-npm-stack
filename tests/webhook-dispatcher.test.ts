import assert from "node:assert/strict";
import test from "node:test";

import { planWebhookDelivery, planWebhookRetries } from "../src/dispatch/webhook-dispatcher.ts";

const deliveryInput = {
  body: { eventId: "evt-double-0001", topic: "delivery.retried" },
  deliveryId: "delivery-double-0001",
  url: "https://hooks.internal.example.invalid/relay/event-bus",
} as const;

test("dispatch planning emits axios descriptors without sending anything", () => {
  assert.deepEqual(planWebhookDelivery(deliveryInput, 2), {
    data: { eventId: "evt-double-0001", topic: "delivery.retried" },
    headers: {
      "content-type": "application/json",
      "x-relay-attempt": "2",
      "x-relay-delivery-id": "delivery-double-0001",
    },
    method: "post",
    url: "https://hooks.internal.example.invalid/relay/event-bus",
  });

  const plan = planWebhookRetries(deliveryInput, { maxAttempts: 3 });

  assert.equal(plan.deliveryId, "delivery-double-0001");
  assert.equal(plan.exhaustedAttempts, false);
  assert.deepEqual(
    plan.calls.map((call) => call.headers?.["x-relay-attempt"]),
    ["1", "2", "3"],
  );
  assert.ok(plan.calls.every((call) => call.method === "post"));
  assert.notEqual(plan.calls[0]?.data, plan.calls[1]?.data);
});
