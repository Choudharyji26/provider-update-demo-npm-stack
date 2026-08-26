import type { RelayInboundRequest } from "../../src/routes/relay-routes.ts";

export function inboundRequestDouble(
  method: RelayInboundRequest["method"],
  url: string,
  headers: RelayInboundRequest["headers"] = {},
): RelayInboundRequest {
  return { headers, method, url };
}
