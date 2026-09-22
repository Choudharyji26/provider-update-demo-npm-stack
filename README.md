# Relay API provider-update demo (generic npm stack)

Relay API is a deliberately small TypeScript fixture for the Pramaan/Product Loop
`provider.update` demo, standing in for the webhook relay internals of an internal API service.
It builds declarative route tables with lodash semantics, plans axios webhook-call descriptors
without sending them, seals and verifies envelopes through `node:crypto`, computes replay-window
checks with dayjs, and validates payloads with zod@3 schemas. Tests use hand-built inert doubles,
and the application test subprocess runs with Node's network permission disabled, so those tests
cannot contact any external system.

## Why this seed exists

This repository is an intentional **multi-stale generic-dependency fixture**. Every pinned
dependency below is genuinely behind its current upstream line, and **none of the packages belong
to any known integration provider pack**. A dependency scan is therefore expected to report this
inventory as **unknown-package** entries; no provider-specific knowledge should fire here. The
seed exists purely to exercise a baseline-to-uplift demo flow, not to model real production code.

## Run the baseline

Use exactly Node `24.18.0` and pnpm `11.15.1`:

```sh
pnpm install --frozen-lockfile
pnpm test
```

`pnpm test` runs formatting and lint (Biome 1.9-era config), syntax parsing, strict application
typechecking (TypeScript 5.6.3), network-denied tests, an offline frozen-lock dependency check,
secret-shape scanning, deterministic seed checks, and a package dry run. All application and test
code remains under strict checking.

The pinned Product Loop alpha accepts a closed customer manifest with exactly one `test` script
and no separate development-dependency section. For that reason, the small set of local
verification tools is pinned alongside runtime packages in `dependencies`; `.tool-versions`,
`.node-version`, and `.nvmrc` pin Node and pnpm without widening the closed manifest.

## Baseline inventory (informational)

| Dependency | Pinned | Suggested target line | Category |
| --- | --- | --- | --- |
| @biomejs/biome | 1.9.4 | >=2.5.10 <3.0.0 | toolchain |
| @types/express | 4.17.21 | >=5.0.6 <6.0.0 | types |
| @types/lodash | 4.17.13 | >=4.17.25 <5.0.0 | types |
| @types/node | 22.10.2 | >=26.3.0 <27.0.0 | types |
| axios | 1.7.9 | >=1.20.0 <2.0.0 | runtime |
| dayjs | 1.11.10 | >=1.11.23 <2.0.0 | runtime |
| express | 4.21.2 | >=5.2.1 <6.0.0 | runtime |
| lodash | 4.17.20 | >=4.18.1 <5.0.0 | runtime |
| typescript | 5.6.3 | >=7.0.2 <8.0.0 | toolchain |
| zod | 3.23.8 | >=4.4.3 <5.0.0 | runtime |

Exact pins are frozen in `package.json` and mirrored in `seed-manifest.json`. Suggested target
lines are informational scan output only.

## Expected maintenance uplift

Because no provider pack matches these packages, the seeded expectation is a general maintenance
uplift identified as `npm-stack-refresh-v1`: one manifest edit to `package.json` raising each pin
toward its modern major line, followed by lockfile refresh and manual review of the two most
dependency-coupled modules:

- `src/routes/relay-routes.ts` (lodash values + express request shapes)
- `src/dispatch/webhook-dispatcher.ts` (axios call-descriptor shapes)

The remaining modules must stay untouched:

- `src/schema/payload-schema.ts`
- `src/signing/hmac-envelope.ts`
- `src/time/windowing.ts`

Exact affected, manual-verification, untouched, and inventory path sets are frozen in
`seed-manifest.json` and checked as part of `pnpm test`.

## Publication boundary

The local `main` commit and Git tree are resolved only after this self-contained seed is
committed:

```sh
git rev-parse refs/heads/main
git rev-parse refs/heads/main^{tree}
```

Suggested protected-main and `product-loop/live-demo-*` branch rules are documented in
`docs/repository-rules.md`. They allow a later authorized Product Loop run to create a new demo
branch without changing `main`. This seed does not push, create a remote branch, open a pull
request, register an App, use a key, contact a provider, merge, or deploy.

Phase 0 acceptance row G4: draft pull request, no bot comment until ready for review.
