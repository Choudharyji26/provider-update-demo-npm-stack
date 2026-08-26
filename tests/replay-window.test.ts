import assert from "node:assert/strict";
import test from "node:test";

import { checkReplayWindow, replayWindowBounds } from "../src/time/windowing.ts";

const nowIso = "2024-12-15T10:00:00.000Z";

test("replay window checks use dayjs to bound observed stamps around a fixed now", () => {
  assert.deepEqual(replayWindowBounds(nowIso, 60), {
    earliest: "2024-12-15T09:59:00.000Z",
    latest: "2024-12-15T10:01:00.000Z",
  });
  assert.deepEqual(checkReplayWindow("2024-12-15T09:59:30.000Z", nowIso, 60), {
    ageSeconds: -30,
    toleranceSeconds: 60,
    verdict: "within-window",
  });
  assert.deepEqual(checkReplayWindow("2024-12-15T09:57:30.000Z", nowIso, 60), {
    ageSeconds: -150,
    toleranceSeconds: 60,
    verdict: "outside-window",
  });
  assert.deepEqual(checkReplayWindow("2024-12-15T10:03:00.000Z", nowIso, 60), {
    ageSeconds: 180,
    toleranceSeconds: 60,
    verdict: "future-stamp",
  });
});
