import assert from "node:assert/strict";
import test from "node:test";

import { sealEnvelope, verifyEnvelope } from "../src/signing/hmac-envelope.ts";

const envelopeBytes = JSON.stringify({ eventId: "evt-double-0002", topic: "envelope.sealed" });
const secretBytes = new TextEncoder().encode("relay-double-signing-material");

test("hmac envelope seals with an injected secret buffer and verifies in constant time", () => {
  const digestHex = sealEnvelope(envelopeBytes, secretBytes);

  assert.match(digestHex, /^[0-9a-f]{64}$/u);
  assert.equal(digestHex, sealEnvelope(envelopeBytes, secretBytes));
  assert.equal(verifyEnvelope(envelopeBytes, secretBytes, digestHex), true);
  assert.equal(verifyEnvelope(`${envelopeBytes} `, secretBytes, digestHex), false);
  assert.equal(
    verifyEnvelope(envelopeBytes, new TextEncoder().encode("unrelated-double-secret"), digestHex),
    false,
  );
  assert.equal(verifyEnvelope(envelopeBytes, secretBytes, "digest-double-0002"), false);
  assert.equal(verifyEnvelope(envelopeBytes, secretBytes, digestHex.slice(0, -1)), false);
});
