# Game security checklist

Use with `security-and-hardening` for an Unreal, Unity, or Godot project. This is
a native-game boundary checklist.

## Trust boundaries

- [ ] Authoritative server/host state is identified; client claims are not
      treated as facts.
- [ ] Every ingress is listed: RPC/replication, session/matchmaking data, save
      and cloud save, mods/assets, replay files, platform callbacks, plugins,
      CI/signing credentials.
- [ ] For each ingress: sender identity, size/rate limit, type/range validation,
      replay/duplicate handling, and failure behavior are defined.
- [ ] A single-player game still treats saves and imported content as untrusted.

## Authority and network

- [ ] Position, health, damage, currency, inventory, cooldowns, match results,
      and progression are validated or computed by the authority.
- [ ] RPC/replication handlers check sender, ownership, current state, argument
      types/ranges, rate, and message size.
- [ ] Malformed/oversized messages are rejected without mutating state.
- [ ] Reconnect, late join, duplicate delivery, and disconnect during a
      transaction are tested with the existing network stack.
- [ ] Anti-cheat/obfuscation is not presented as a substitute for authority.
- [ ] Transport encryption/authentication matches the actual backend/platform;
      unrelated HTTP controls are not applied to a native protocol.

## Saves and durable data

- [ ] Save format has a version and a tested migration from supported old saves.
- [ ] Structure, types, ranges, and references are validated before applying.
- [ ] Failed/unreadable/newer saves do not overwrite the original.
- [ ] Writes use the project's atomic/backup mechanism where available.
- [ ] Stable gameplay IDs are used; transient pointers are not persisted as IDs.
- [ ] Integrity protection matches the threat model (a checksum is not an
      anti-cheat control against a local attacker).
- [ ] Save tests use old fixtures and a corrupted/truncated/newer fixture.

## Mods, assets, and plugins

- [ ] Import paths are restricted to an allowed root; traversal and unexpected
      file types are rejected.
- [ ] Size/count limits are enforced before decode/import.
- [ ] Imported content cannot execute scripts, shell commands, or arbitrary code.
- [ ] Plugin/package provenance, maintenance, license, transitive dependencies,
      and install-time scripts are reviewed.
- [ ] Versions are pinned; dependency build scripts are not blanket-approved.
- [ ] User-generated content moderation is treated separately from sandboxing.

## Credentials and build chain

- [ ] Store/platform signing keys, engine-license credentials, server secrets,
      and CI tokens are absent from the client, logs, fixtures, and repository.
- [ ] Untrusted pull-request jobs cannot access signing keys, production upload
      rights, or release branches.
- [ ] Artifacts have provenance and platform-appropriate signing/checksums.
- [ ] Secret scanning runs before release; findings report rule/location, never
      the secret value.

## Privacy and diagnostics

- [ ] Diagnostic/telemetry data has a stated purpose, consent/notice where
      required, retention, access, and deletion path.
- [ ] Crash reports, logs, and benchmark artifacts are minimized and redacted.
- [ ] No hidden always-on telemetry is added merely to satisfy a checklist.

## Verification

- [ ] An unauthorized/forged RPC is rejected without authoritative state change.
- [ ] A tampered/truncated/newer/unsupported save fails safely and preserves the
      original.
- [ ] A malformed/oversized mod/asset is rejected before load.
- [ ] A plugin/dependency with an unreviewed install script is blocked.
- [ ] Reconnect/disconnect during a transaction does not duplicate or lose
      durable state.
- [ ] The evidence is recorded; static review alone is not a runtime pass.
