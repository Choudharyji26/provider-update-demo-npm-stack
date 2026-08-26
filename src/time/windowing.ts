import dayjs from "dayjs";

export type ReplayWindowVerdict = "future-stamp" | "outside-window" | "within-window";

export interface ReplayWindowCheck {
  ageSeconds: number;
  toleranceSeconds: number;
  verdict: ReplayWindowVerdict;
}

export interface ReplayWindowBounds {
  earliest: string;
  latest: string;
}

const MS_PER_SECOND = 1000;

const AGE_DECIMAL_PLACES = 3;

export function replayWindowBounds(nowIso: string, toleranceSeconds: number): ReplayWindowBounds {
  const now = dayjs(nowIso);
  return {
    earliest: now.subtract(toleranceSeconds, "second").toISOString(),
    latest: now.add(toleranceSeconds, "second").toISOString(),
  };
}

export function checkReplayWindow(
  observedAtIso: string,
  nowIso: string,
  toleranceSeconds: number,
): ReplayWindowCheck {
  const observedAt = dayjs(observedAtIso);
  const now = dayjs(nowIso);
  const rawAgeSeconds = observedAt.diff(now) / MS_PER_SECOND;
  const ageSeconds = Number(rawAgeSeconds.toFixed(AGE_DECIMAL_PLACES));

  if (Math.abs(ageSeconds) <= toleranceSeconds) {
    return { ageSeconds, toleranceSeconds, verdict: "within-window" };
  }
  if (ageSeconds > 0) {
    return { ageSeconds, toleranceSeconds, verdict: "future-stamp" };
  }
  return { ageSeconds, toleranceSeconds, verdict: "outside-window" };
}
