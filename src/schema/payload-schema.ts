import { z } from "zod";

export const RELAY_TOPICS = ["delivery.failed", "delivery.retried", "envelope.sealed"] as const;

export type RelayTopic = (typeof RELAY_TOPICS)[number];

export const relayPayloadSchema = z.object({
  eventId: z.string().regex(/^evt-[a-z0-9][a-z0-9-]{5,}$/u),
  occurredAtMs: z.number().int().nonnegative(),
  payload: z.record(z.unknown()),
  topic: z.enum(RELAY_TOPICS),
});

export type RelayPayload = z.infer<typeof relayPayloadSchema>;

export interface RelayPayloadIssue {
  message: string;
  path: string;
}

export type RelayPayloadParseResult =
  | { issues: RelayPayloadIssue[]; ok: false }
  | { ok: true; payload: RelayPayload };

export function parseRelayPayload(input: unknown): RelayPayloadParseResult {
  const result = relayPayloadSchema.safeParse(input);
  if (result.success) {
    return { ok: true, payload: result.data };
  }
  return {
    issues: result.error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.map(String).join(".") || "<root>",
    })),
    ok: false,
  };
}
