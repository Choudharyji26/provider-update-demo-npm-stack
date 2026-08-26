import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const expectedPins = {
  "@biomejs/biome": "1.9.4",
  "@types/express": "4.17.21",
  "@types/lodash": "4.17.13",
  "@types/node": "22.10.2",
  axios: "1.7.9",
  dayjs: "1.11.10",
  express: "4.21.2",
  lodash: "4.17.20",
  typescript: "5.6.3",
  zod: "3.23.8",
};

const manifest = JSON.parse(await readFile("package.json", "utf8"));
const list = JSON.parse(
  execFileSync("pnpm", ["list", "--depth=0", "--json"], {
    encoding: "utf8",
    env: process.env,
  }),
);

assert.equal(process.version, "v24.18.0");
assert.equal(
  execFileSync("pnpm", ["--version"], {
    encoding: "utf8",
    env: process.env,
  }).trim(),
  "11.15.1",
);
assert.deepEqual(Object.keys(manifest).sort(), [
  "dependencies",
  "name",
  "private",
  "scripts",
  "type",
]);
assert.deepEqual(Object.keys(manifest.dependencies).sort(), Object.keys(expectedPins).sort());
assert.deepEqual(Object.keys(manifest.dependencies), Object.keys(expectedPins));

const installed = list[0];
assert.ok(installed);
for (const [dependency, pin] of Object.entries(expectedPins)) {
  const entry = installed.dependencies[dependency];
  assert.ok(entry, `${dependency} is missing from the install graph`);
  assert.equal(entry.version, pin, `${dependency} resolved ${entry.version} instead of ${pin}`);
}

process.stdout.write(
  `Dependency manifest, lockfile, install, and toolchain agree for ${Object.keys(expectedPins).length} pins.\n`,
);
