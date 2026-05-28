# Contributing a plugin

This catalog lists plugins installable into the LiteDuck desktop app. A plugin is
a folder with a `plugin.json` manifest plus a shell script each contributed
command spawns. The authoritative contract is LiteDuck's loader,
[`src-tauri/src/plugins.rs`](../liteduck/src-tauri/src/plugins.rs) — when this doc
and the loader disagree, the loader wins.

## 1. Manifest rules

Every plugin needs a `plugin.json` validated against
[`schema/plugin.schema.json`](schema/plugin.schema.json). Required fields:

| field | required | notes |
|---|---|---|
| `id` | yes | stable id; install dir `~/.liteduck/plugins/<id>/`. No `/`, `\`, or `..` (loader rejects path traversal) |
| `name` | yes | display name |
| `version` | yes | version string (SemVer recommended) |
| `kind` | yes | exactly one, from the allow-list below |
| `description` | no | one-line summary |
| `network` | no | `true` if the plugin needs network access; surfaced at install |
| `paths` | no | host filesystem scopes the plugin declares it needs; surfaced at install |
| `commands` | no | array of `{ id, title, run, args? }`; `run` is spawned via `sh -c` |

Command `run` templates receive UI parameters as `LITEDUCK_PARAM_<UPPERCASE_KEY>`
environment variables. **Do not** string-interpolate user input into the `run`
template — that is a shell-injection vector; read it from the env var instead.

## 2. Allowed `kind` (allow-list)

```
integration · formatter · linter · previewer · tool
```

These are the only accepted contribution kinds (from `ALLOWED_KINDS` in
`plugins.rs`). An unknown kind is rejected at load.

## 3. Denied `kind` (scope-ceiling deny-list)

```
chat · agent · llm
```

A manifest declaring any of these is **refused at load time** (from `DENIED_KINDS`
in `plugins.rs`). LiteDuck core has no AI/LLM; the deny-list enforces ADR-001 at
the schema level, not by review discipline. Do not submit such a plugin.

## 4. Secrets discipline

- **Never commit a real credential.** Any auth contract file (e.g. Jira's
  `auth.toml`) ships with **empty placeholders only**.
- The real secret lives in the user's home copy (`~/.liteduck/plugins/<id>/...`,
  `chmod 600`, gitignored) or in an environment variable — never in this repo.
- Scripts must never echo, log, or emit secrets into stdout JSON.

## 4b. Shipping a plugin with its own UI (optional)

Commands render through LiteDuck's built-in **declarative views** by default
(`view: table | keyvalue | …`). A plugin that needs richer/interactive UI may
instead ship an **executable UI** (ADR-002): declare `ui: { entry: "ui.js" }` and
include a self-contained bundle. It runs in an isolated `plugin://` iframe
(sandboxed, cross-origin, no host/Tauri access, no network) and talks to LiteDuck
only via the `window.liteduck` bridge.

- Authoring guide + typed bridge: [`sdk/`](sdk/) (`sdk/README.md`, `sdk/bridge.d.ts`).
- Copy-paste starter: [`templates/ui-plugin/`](templates/ui-plugin/).
- Set `"ui": true` on your `registry.json` entry so the install UI shows the
  executable-UI consent step.

Prefer declarative views unless you genuinely need custom UI — keep an executable
UI's commands' `view` hints set so the `fallback: "declarative"` path stays useful.

## 5. Checklist — add a plugin to the registry

1. Create `plugins/<id>/` with:
   - `plugin.json` — validates against `schema/plugin.schema.json`; `kind` in the
     allow-list.
   - the shell script(s) referenced by each command's `run` (executable bit set).
   - `SPEC.md` — what it does, its commands, auth (if any), error classes,
     deferred items.
   - any auth-contract file with **empty placeholders only**.
2. Add an entry to [`registry.json`](registry.json) under `plugins[]`:
   ```json
   {
     "id": "<id>",
     "name": "<display name>",
     "version": "<x.y.z>",
     "description": "<one line>",
     "kind": "<allow-list kind>",
     "network": false,
     "author": "<you/org>",
     "source": "plugins/<id>/",
     "tags": ["<keyword>"],
     "verified": false
   }
   ```
   Keep the entry's `kind`, `network`, `version`, and `description` consistent with
   the plugin's `plugin.json`. Set `verified: true` only after the catalog vets it.
3. Bump the top-level `updatedAt`.
4. Verify the JSON parses:
   ```bash
   jq -e '.' registry.json schema/plugin.schema.json
   ```
5. Confirm no real secret slipped in:
   ```bash
   grep -rnE '(token|secret|password|api[_-]?key)[[:space:]]*=[[:space:]]*"[^"]+"' plugins/
   ```
