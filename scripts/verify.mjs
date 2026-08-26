import { execFileSync } from "node:child_process";

const testFiles = [
  "tests/hmac-envelope.test.ts",
  "tests/payload-schema.test.ts",
  "tests/replay-window.test.ts",
  "tests/relay-routes.test.ts",
  "tests/webhook-dispatcher.test.ts",
];

const commands = [
  ["pnpm", ["exec", "biome", "format", "."]],
  ["pnpm", ["exec", "biome", "lint", "."]],
  [process.execPath, ["scripts/check-syntax.mjs"]],
  ["pnpm", ["exec", "tsc", "--noEmit"]],
  [
    process.execPath,
    ["--permission", "--allow-fs-read=*", "--test-isolation=none", "--test", ...testFiles],
  ],
  ["pnpm", ["install", "--offline", "--frozen-lockfile"]],
  [process.execPath, ["scripts/check-dependencies.mjs"]],
  [process.execPath, ["scripts/check-secret-shapes.mjs"]],
  [process.execPath, ["scripts/check-seed.mjs"]],
  [process.execPath, ["scripts/check-package.mjs"]],
];

for (const [command, arguments_] of commands) {
  execFileSync(command, arguments_, {
    env: process.env,
    stdio: "inherit",
  });
}

process.stdout.write("Complete provider-update demo verification passed.\n");
