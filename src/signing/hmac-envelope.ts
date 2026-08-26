import { createHmac, timingSafeEqual } from "node:crypto";

const DIGEST_HEX_PATTERN = /^[0-9a-f]{64}$/u;

const HMAC_ALGORITHM = "sha256";

function envelopeDigestHex(envelope: string, secretBytes: Uint8Array): string {
  return createHmac(HMAC_ALGORITHM, secretBytes).update(envelope, "utf8").digest("hex");
}

export function sealEnvelope(envelope: string, secretBytes: Uint8Array): string {
  return envelopeDigestHex(envelope, secretBytes);
}

export function verifyEnvelope(
  envelope: string,
  secretBytes: Uint8Array,
  digestHex: string,
): boolean {
  if (!DIGEST_HEX_PATTERN.test(digestHex)) {
    return false;
  }
  const provided = Buffer.from(digestHex.toLowerCase(), "hex");
  const expected = Buffer.from(envelopeDigestHex(envelope, secretBytes), "hex");
  return timingSafeEqual(provided, expected);
}
