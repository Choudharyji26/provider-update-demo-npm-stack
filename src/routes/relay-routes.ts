import type { Request } from "express";
import lodash from "lodash";

const { chunk, groupBy } = lodash;

export type RelayRouteMethod = "DELETE" | "GET" | "POST" | "PUT";

export interface RelayRouteSpec {
  id: string;
  method: RelayRouteMethod;
  path: string;
}

export interface RelayRouteBucket {
  batches: RelayRouteSpec[][];
  method: RelayRouteMethod;
  routeCount: number;
}

export interface RelayRouteTable {
  bucketCount: number;
  buckets: RelayRouteBucket[];
  routeCount: number;
}

export type RelayInboundRequest = Pick<Request, "headers" | "method" | "url">;

export interface RelayRoutingPlan {
  matched: Record<string, RelayInboundRequest[]>;
  matchedRequestCount: number;
  unmatched: RelayInboundRequest[];
}

const MAX_ROUTES_PER_BATCH = 2;

function declaredRouteKeys(table: RelayRouteTable): Set<string> {
  return new Set(
    table.buckets.flatMap((bucket) =>
      bucket.batches.flat().map((route) => `${route.method} ${route.path}`),
    ),
  );
}

function relayRouteKey(method: string, url: string): string {
  const pathname = url.split("?")[0] ?? "";
  return `${method.toUpperCase()} ${pathname}`;
}

export function buildRelayRouteTable(specs: readonly RelayRouteSpec[]): RelayRouteTable {
  const ordered = [...specs].sort((left, right) => left.id.localeCompare(right.id));
  const grouped = groupBy(ordered, (spec) => spec.method);
  const methods = Object.keys(grouped).sort() as RelayRouteMethod[];

  let routeCount = 0;
  const buckets: RelayRouteBucket[] = [];
  for (const method of methods) {
    const routes = grouped[method] ?? [];
    routeCount += routes.length;
    buckets.push({
      batches: chunk(routes, MAX_ROUTES_PER_BATCH),
      method,
      routeCount: routes.length,
    });
  }

  return {
    bucketCount: buckets.length,
    buckets,
    routeCount,
  };
}

export function planRelayRouting(
  table: RelayRouteTable,
  requests: readonly RelayInboundRequest[],
): RelayRoutingPlan {
  const routeKeys = declaredRouteKeys(table);
  const matched: Record<string, RelayInboundRequest[]> = {};
  const unmatched: RelayInboundRequest[] = [];

  for (const request of requests) {
    const key = relayRouteKey(request.method, request.url);
    if (!routeKeys.has(key)) {
      unmatched.push(request);
      continue;
    }
    const existing = matched[key];
    if (existing) {
      existing.push(request);
    } else {
      matched[key] = [request];
    }
  }

  return {
    matched,
    matchedRequestCount: Object.values(matched).reduce((sum, entries) => sum + entries.length, 0),
    unmatched,
  };
}
