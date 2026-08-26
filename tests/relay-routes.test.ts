import assert from "node:assert/strict";
import test from "node:test";

import { buildRelayRouteTable, planRelayRouting } from "../src/routes/relay-routes.ts";
import { inboundRequestDouble } from "./support/express.ts";

test("route table buckets the relay spec and routes inbound requests without a server", () => {
  const table = buildRelayRouteTable([
    { id: "route-0004", method: "POST", path: "/relay/drain" },
    { id: "route-0001", method: "POST", path: "/relay/events" },
    { id: "route-0003", method: "PUT", path: "/relay/config" },
    { id: "route-0002", method: "GET", path: "/relay/status" },
  ]);

  assert.equal(table.bucketCount, 3);
  assert.equal(table.routeCount, 4);
  assert.deepEqual(
    table.buckets.map((bucket) => bucket.method),
    ["GET", "POST", "PUT"],
  );
  assert.deepEqual(table.buckets[1]?.batches, [
    [
      { id: "route-0001", method: "POST", path: "/relay/events" },
      { id: "route-0004", method: "POST", path: "/relay/drain" },
    ],
  ]);

  const plan = planRelayRouting(table, [
    inboundRequestDouble("POST", "/relay/events?source=double"),
    inboundRequestDouble("post", "/relay/events"),
    inboundRequestDouble("DELETE", "/relay/unknown"),
  ]);

  assert.deepEqual(Object.keys(plan.matched), ["POST /relay/events"]);
  assert.equal(plan.matchedRequestCount, 2);
  assert.deepEqual(plan.unmatched, [inboundRequestDouble("DELETE", "/relay/unknown")]);
});
