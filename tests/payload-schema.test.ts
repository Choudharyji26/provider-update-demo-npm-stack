import assert from "node:assert/strict";
import test from "node:test";

import { parseRelayPayload, RELAY_TOPICS } from "../src/schema/payload-schema.ts";

function relayPayloadDouble() {
  return {
    eventId: "evt-double-0003",
    occurredAtMs: 1734266400000,
    payload: { attempt: 1, envelopeDigest: "digest-double-0003" },
    topic: "envelope.sealed",
  };
}

test("zod schema accepts a well-formed relay payload and reports issues for malformed ones", () => {
  const input = { ...relayPayloadDouble(), sourceModule: "double-harness" };

  const parsed = parseRelayPayload(input);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.payload.topic, "envelope.sealed");
    assert.equal("sourceModule" in parsed.payload, false);
  }

  const emptyParse = parseRelayPayload({});
  assert.equal(emptyParse.ok, false);
  if (!emptyParse.ok) {
    assert.deepEqual(emptyParse.issues.map((issue) => issue.path).sort(), [
      "eventId",
      "occurredAtMs",
      "payload",
      "topic",
    ]);
  }
  assert.deepEqual(parseRelayPayload({ ...input, topic: "double.unknown" }).ok, false);
  assert.deepEqual(RELAY_TOPICS, ["delivery.failed", "delivery.retried", "envelope.sealed"]);
});
