---
name: security-and-hardening
description: Harden native Unreal, Unity and Godot games against cheating, save tampering, unsafe mods or assets, plugin supply-chain risk and credential leakage. Use for multiplayer authority, RPC and save validation, platform credentials, or untrusted content. Covers native-game boundaries only.
license: MIT
---

# Game security and hardening

This is a substantially modified local game adaptation of Addy Osmani's
MIT-licensed security workflow. It is not an upstream release. Read
[sources and local changes](sources.md) for provenance and the license notice.

## Scope

Use this workflow for an Unreal, Unity, or Godot project's own trust boundaries:
client/server authority, network messages, save data, mods and imported assets,
plugins, platform credentials, and build/signing material. A separate backend,
if the project has one, follows its own security review; do not import its
controls into the game client by default.

Read [runtime policy](../../references/game-workflow/runtime-policy.md) first. This skill does
not install an anti-cheat SDK, telemetry service, certificate authority, or
network framework. Use the engine and project systems already in place.

## 1. Map the boundaries

Before choosing a control, write down:

- Which state is authoritative on a server/host, and which values are merely
  client claims.
- Every ingress: RPC/replication, matchmaking/session data, save files, cloud
  saves, mods, user-generated assets, replay files, platform callbacks, plugin
  binaries, and developer/CI credentials.
- The impact of a forged, replayed, oversized, malformed, or reordered message;
  a modified save; an asset path outside the expected root; a plugin with a
  post-install script; or a leaked signing key.
- What the client can do offline and what must fail closed when authority or
  integrity cannot be established.

Use STRIDE as a prompt, not as a generic checklist. In a game the most valuable
questions are usually "can the client claim this?", "can this file be replayed
or edited?", and "what happens when the host disconnects?".

## 2. Keep gameplay authority on the server/host

- Validate sender identity, ownership, current state, argument types/ranges,
  rate, and message size at the authority boundary. A client's position,
  currency, inventory, cooldown, damage, or match result is a claim until the
  authoritative side accepts it.
- Reject rather than silently clamp when a malformed claim would hide a bug.
  For tolerances (movement correction, latency), define the allowed window and
  test its boundary.
- Do not treat a client-side anti-cheat check or obfuscation as server authority.
  Anti-cheat tooling can raise cost; it does not make a trusted client.
- For a single-player game, authority is local, but saves and imported content
  remain untrusted inputs. For a live game, exercise reconnect, late join,
  duplicate delivery, disconnect during a transaction, and hostile/oversized
  messages using the existing network stack.
- Apply transport encryption/authentication only where the project's actual
  backend or platform requires it; do not import unrelated HTTP controls into
  a native replication protocol.

## 3. Protect saves and durable data

- Version every durable format and keep a tested migration path from supported
  old saves. Load a representative old fixture, not only a save produced by the
  current build.
- Validate structure, types, ranges, and references before applying data. A
  failed or unreadable load must not overwrite the original save; write via the
  project's atomic/backup mechanism where available.
- Keep gameplay IDs stable. Do not serialize transient object pointers as
  durable identity.
- Decide whether integrity protection is appropriate for the threat model
  (checksum/signature/server-held state). A checksum detects accidental damage,
  not a determined cheater who can change both data and check.
- Keep platform/cloud credentials and encryption keys out of save files, logs,
  client binaries, and source control.

## 4. Treat mods, assets, and plugins as untrusted input

- Restrict imported paths to an allowed root, reject traversal and unexpected
  file types, cap size/count, and validate before loading. Do not execute
  scripts, shell commands, or arbitrary code from an imported package.
- Prefer the engine's asset validation/import pipeline and a sandboxed or
  separate process for untrusted content where the platform supports it.
- Review plugin/package provenance, maintenance, license, transitive
  dependencies, and install-time scripts before adding it. Pin versions and keep
  a lockfile or equivalent; do not blanket-approve dependency build scripts.
- For user-generated content, define moderation/abuse handling separately from
  memory-safety and file-integrity checks. A content policy is not a sandbox.

## 5. Protect credentials and the build chain

- Keep store/platform signing keys, engine-license credentials, server secrets,
  and CI tokens out of the game client and repository. Use the platform's
  least-privilege mechanism and a secret store.
- Isolate untrusted pull-request builds from signing keys, platform
  credentials, production upload rights, and release branches.
- Redact secrets and personal data from logs, crash reports, test fixtures, and
  benchmark artifacts. Report the rule and location, never the value.
- Verify artifact provenance and, where the platform supports it, signing or
  checksums before distribution. Do not hand-edit a dependency lockfile.

## 6. Privacy and diagnostics

Collect only the data needed to answer a stated question. Define consent/notice
where required, retention, access, and deletion. Prefer local diagnostics and
aggregate counters over a new always-on telemetry SDK. A crash report or
diagnostic bundle is still personal data if it can identify a player; minimize
and redact it.

## 7. Verification

For each boundary, record a threat, the control, the failure behavior, and
evidence. Useful checks include:

- An unauthorized/forged RPC is rejected without changing authoritative state.
- A tampered, truncated, newer, or unsupported save fails safely and leaves the
  original intact.
- A malformed/oversized mod or asset is rejected before import/load.
- A plugin/dependency with an unreviewed install script is blocked before it runs.
- A clean secret scan finds no keys in source, logs, or artifacts.
- Reconnect/disconnect during a transaction does not duplicate or lose durable
  state.

Read [game security checklist](../../references/game-workflow/game-security-checklist.md) for
the review list. A static review can identify a risk; it cannot prove a server,
anti-cheat, or platform control works. Report unavailable runtime evidence as
not verified, not as passed.
