import { timingSafeEqual } from "crypto";

// Shared machine-to-machine auth for the shared-secret API routes (lead export,
// coupon mint, marketing metrics). Fail-closed when the env var is unset, and
// timing-safe: a plain !== would leak how many leading characters match via
// response timing. The length check guards timingSafeEqual, which throws on
// unequal-length buffers.
export function isAuthorizedByApiKey(req: Request, envVarName: string): boolean {
  const expectedSecret = process.env[envVarName];
  if (!expectedSecret) return false; // fail closed if the env var is unset

  const provided = Buffer.from(req.headers.get("x-api-key") ?? "");
  const expected = Buffer.from(expectedSecret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
