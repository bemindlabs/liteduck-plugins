# LiteDuck Plugins

The curated catalog of installable plugins for the [LiteDuck](../liteduck/) desktop
app. LiteDuck ships **lean** (no plugins bundled into the app); this repository is
the single source of truth — [`registry.json`](registry.json) indexes every plugin
available to install on demand.

## The plugin model

LiteDuck uses a **hybrid: declarative manifest + shell command** model — a plugin
is a folder with a `plugin.json` manifest declaring its commands plus a shell
script each command spawns. **No plugin code runs in-process** in the LiteDuck
window: commands are subprocesses, and a plugin's optional executable UI
(`ui.entry`, see [`sdk/`](sdk/)) runs **out-of-process** in an isolated
`plugin://` iframe (cross-origin, sandboxed, per-response CSP — no host or Tauri
access). See LiteDuck's design notes:
[`2026-05-28_plugin-system-design.md`](../liteduck/notes/2026-05-28_plugin-system-design.md)
(shell model) and
[`2026-05-28_plugin-ui-host-design.md`](../liteduck/notes/2026-05-28_plugin-ui-host-design.md)
+ [ADR-002](../liteduck/docs/adr-002-plugin-ui-extension-host.md) (UI host).

## Browsing the catalog

Each entry in [`registry.json`](registry.json) describes one plugin:

| field | meaning |
|---|---|
| `id` | stable id; becomes the install dir `~/.liteduck/plugins/<id>/` |
| `name` | display name |
| `version` | plugin version |
| `description` | one-line summary |
| `kind` | contribution kind (see allow-list below) |
| `network` | whether it needs network access (surfaced at install) |
| `author` | publisher |
| `source` | relative path `plugins/<id>/` to the installable folder |
| `tags` | search keywords |
| `verified` | whether this catalog has vetted the plugin |
| `ui` | whether the plugin ships an **executable UI** (ADR-002) — drives the install-time consent step |

The folders under [`plugins/`](plugins/) are the actual installable manifests
(`plugin.json` + the shell script + `SPEC.md`, and for Jira a placeholder
`auth.toml`).

## Installing a plugin

LiteDuck installs plugins on demand from this catalog. In the app:

1. Open the **Plugins** panel → **Available** tab.
2. Pick a plugin; review its declared capabilities (network, executable UI).
3. Click **Install** (or **Install anyway** for plugins that ship a UI — the
   consent step makes the trust decision explicit).

The app fetches + validates the manifest before any file touches disk, then
copies the plugin into `~/.liteduck/plugins/<id>/`. The id used is taken from
the validated manifest, never the request path. Existing user-data (e.g.
`auth.toml` you filled in) is preserved across reinstalls.

> **Install from a local folder** — the **Install from folder** action stays
> available for development: point it at a `plugins/<id>/` checkout to install
> without going through the catalog.

## Scope-ceiling rule

A manifest may declare exactly one `kind`. The allow-list is:

```
integration · formatter · linter · previewer · tool
```

Any manifest declaring `chat`, `agent`, or `llm` is **refused by the loader** — these
are on a scope-ceiling deny-list because LiteDuck core has no AI/LLM (ADR-001 is
enforced by the schema, not by review discipline). This is implemented in
LiteDuck's loader; see [`schema/plugin.schema.json`](schema/plugin.schema.json) for
the catalog's mirror of that contract.

## Security posture (user-trust v1)

- Plugins run as **subprocesses with the user's full privileges** — no OS sandbox
  in v1. A real sandbox is a documented future phase.
- The host never loads plugin code into its own address space; the only surfaces
  are the manifest schema and the script's stdin/stdout contract.
- Each manifest **declares** `network` and the host `paths` it needs; the install
  confirmation UI surfaces those so the user can review before trusting.
- UI parameters are passed to scripts as `LITEDUCK_PARAM_<KEY>` env vars, never
  interpolated into the shell command line.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the manifest rules and the checklist to
add a plugin to the registry. Want to ship a plugin with its **own UI**? Start
from the SDK and starter template:

- Authoring guide + typed bridge: [`sdk/`](sdk/) (`sdk/README.md`, `sdk/bridge.d.ts`).
- Copy-paste starter: [`templates/ui-plugin/`](templates/ui-plugin/).

**Never commit real secrets** — the bundled `plugins/jira/auth.toml` ships with
empty placeholders only.
