# Suggested repository rules

These settings are preparation guidance only. The local seed does not create or change any remote
ruleset, installation, branch, or pull request.

## Protected `main`

- Require pull requests and a `provider-update-demo-npm-stack / pnpm test` status check before
  changes reach `main`.
- Block force pushes and branch deletion.
- Do not grant the demo GitHub App a bypass.
- Keep direct pushes disabled for the App; the provider-update flow targets a new branch.

## Product Loop demo branches

Create a narrow ruleset for `product-loop/live-demo-*`. It must include GitHub's `deletion` and
`non_fast_forward` rules, interpreted as no deletion and no force pushes. Do not give the App a
bypass. The App should be limited to this one disposable repository with metadata read, checks
read, contents read/write, and pull requests read/write; every other repository, organization, and
account permission remains disabled.

The intended topology is an unchanged `main` base plus one new `product-loop/live-demo-*` branch
with one non-merge commit. Merge, deployment, draft promotion, branch deletion, App registration,
installation changes, and permission changes require separate authorization and are outside this
seed.

## Demo-only reminder

Every dependency in this repository belongs to generic packages outside any known provider pack.
Product Loop should treat the inventory as unknown-package entries and apply only the general
maintenance uplift described in the README; no provider-specific behavior applies here.
