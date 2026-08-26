import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const manifest = JSON.parse(await readFile("seed-manifest.json", "utf8"));
const packageManifest = JSON.parse(await readFile("package.json", "utf8"));

assert.equal(manifest.schema, "pramaan/provider-update-demo-seed/v1");
assert.deepEqual(manifest.repository, {
  owner: "Pramaan-Dev",
  name: "provider-update-demo-npm-stack",
  remote: "https://github.com/Pramaan-Dev/provider-update-demo-npm-stack.git",
  baseRef: "main",
  headPattern: "product-loop/live-demo-*",
});
assert.equal(manifest.persona.name, "Relay API");

assert.deepEqual(Object.keys(packageManifest).sort(), [
  "dependencies",
  "name",
  "private",
  "scripts",
  "type",
]);
assert.equal("devDependencies" in packageManifest, false);
assert.deepEqual(Object.keys(packageManifest.scripts), ["test"]);
assert.deepEqual(Object.keys(packageManifest.dependencies).sort(), [
  "@biomejs/biome",
  "@types/express",
  "@types/lodash",
  "@types/node",
  "axios",
  "dayjs",
  "express",
  "lodash",
  "typescript",
  "zod",
]);
assert.deepEqual(manifest.baseline.dependencies, packageManifest.dependencies);

assert.equal(await readFile(".node-version", "utf8"), `${manifest.baseline.node}\n`);
assert.equal(await readFile(".nvmrc", "utf8"), `${manifest.baseline.node}\n`);
assert.equal(
  await readFile(".tool-versions", "utf8"),
  `nodejs ${manifest.baseline.node}\npnpm 11.15.1\n`,
);
assert.equal(manifest.baseline.verificationCommand, "pnpm test");
assert.deepEqual(manifest.baseline.testPaths, [
  "tests/hmac-envelope.test.ts",
  "tests/payload-schema.test.ts",
  "tests/replay-window.test.ts",
  "tests/relay-routes.test.ts",
  "tests/webhook-dispatcher.test.ts",
]);

for (const file of manifest.baseline.testPaths) {
  assert.ok((await lstat(file)).isFile());
}

const expectedUpdate = manifest.expectedUpdate;
assert.equal(expectedUpdate.change, "npm-stack-refresh-v1");
assert.equal(expectedUpdate.kind, "general-maintenance-uplift");
assert.deepEqual(Object.keys(expectedUpdate.targetRequirements).sort(), [
  "@biomejs/biome",
  "@types/express",
  "@types/lodash",
  "@types/node",
  "axios",
  "dayjs",
  "express",
  "lodash",
  "typescript",
  "zod",
]);
for (const [dependency, requirement] of Object.entries(expectedUpdate.targetRequirements)) {
  assert.match(requirement, /^>=/u);
  assert.notEqual(requirement, manifest.baseline.dependencies[dependency]);
}

const affected = expectedUpdate.affectedPaths;
const untouched = expectedUpdate.untouchedPaths;
assert.deepEqual(affected, ["src/dispatch/webhook-dispatcher.ts", "src/routes/relay-routes.ts"]);
assert.deepEqual(untouched, [
  "src/schema/payload-schema.ts",
  "src/signing/hmac-envelope.ts",
  "src/time/windowing.ts",
]);
assert.deepEqual(expectedUpdate.automaticPatchPaths, ["package.json"]);
assert.deepEqual(expectedUpdate.manualVerificationPaths, [
  "pnpm-lock.yaml",
  "tests/relay-routes.test.ts",
  "tests/support/express.ts",
  "tests/webhook-dispatcher.test.ts",
]);
assert.equal(
  affected.some((file) => untouched.includes(file)),
  false,
);

for (const file of [...affected, ...untouched]) {
  assert.ok((await lstat(file)).isFile());
}

assert.equal(Array.isArray(expectedUpdate.outdatedInventory), true);
assert.equal(
  expectedUpdate.outdatedInventory.length,
  Object.keys(manifest.baseline.dependencies).length,
);
const inventoried = expectedUpdate.outdatedInventory.map((row) => row.dependency).sort();
assert.deepEqual(inventoried, Object.keys(manifest.baseline.dependencies).sort());
for (const row of expectedUpdate.outdatedInventory) {
  assert.equal(row.pinned, manifest.baseline.dependencies[row.dependency]);
  assert.match(row.suggestedTarget, /^>=/u);
  assert.equal(row.suggestedTarget.startsWith(row.pinned), false);
  assert.ok(row.category.length > 0);
}

async function sourceFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await sourceFiles(item)));
    } else if (item.endsWith(".ts")) {
      result.push(item);
    }
  }
  return result.sort();
}

const applicationSources = await sourceFiles("src");
const serverPatterns = [
  /\blisten\s*\(/u,
  /createServer\s*\(/u,
  /\bfetch\s*\(/u,
  /http\.request/u,
  /axios\.create/u,
];
for (const file of applicationSources) {
  const source = await readFile(file, "utf8");
  for (const pattern of serverPatterns) {
    assert.doesNotMatch(source, pattern, `Non-inert runtime call in ${file}`);
  }
}

const routesSource = await readFile("src/routes/relay-routes.ts", "utf8");
assert.match(routesSource, /^import type \{ Request \} from "express";$/mu);
assert.match(routesSource, /\bchunk\b/u);
assert.match(routesSource, /\bgroupBy\b/u);

const dispatcherSource = await readFile("src/dispatch/webhook-dispatcher.ts", "utf8");
assert.match(dispatcherSource, /^import type \{ AxiosRequestConfig \} from "axios";$/mu);
assert.match(dispatcherSource, /method: "post"/u);

const signingSource = await readFile("src/signing/hmac-envelope.ts", "utf8");
assert.match(signingSource, /timingSafeEqual/u);

for (const file of untouched) {
  const source = await readFile(file, "utf8");
  assert.doesNotMatch(source, /express|AxiosRequestConfig|"lodash"/u);
}

const untrackedPaths = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);
assert.deepEqual(untrackedPaths, []);

process.stdout.write(
  "Seed identity and bounded generic-stack impact match the deterministic manifest.\n",
);
