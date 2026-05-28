# LiteDuck Plugins

The curated catalog of installable plugins for the [LiteDuck](../liteduck/) desktop
app. This repository is the canonical source the bundled reference plugins are
published from; [`registry.json`](registry.json) is the index of every plugin
available to install.

## The plugin model (3 lines)

LiteDuck uses a **hybrid: declarative manifest + shell command** model — a plugin
is a folder with a `plugin.json` manifest declaring its commands plus a shell
script each command spawns. No plugin code runs inside the LiteDuck process; the
only surfaces are the manifest schema and the script's stdin/stdout contract. See
the full design rationale in LiteDuck's design note
[`2026-05-28_plugin-system-design.md`](../liteduck/notes/2026-05-28_plugin-system-design.md).

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

The folders under [`plugins/`](plugins/) are the actual installable manifests
(`plugin.json` + the shell script + `SPEC.md`, and for Jira a placeholder
`auth.toml`).

## Installing a plugin today

There is **no live registry server yet**. Install from a local folder:

1. Clone or download this repository.
2. In LiteDuck open the **Plugins** panel → **Install from folder**.
3. Point it at a `plugins/<id>/` directory (e.g. `plugins/jira/`).

LiteDuck reads the folder's `plugin.json`, validates it, and copies it into
`~/.liteduck/plugins/<id>/`. The id used is taken from the manifest, never the
folder name.

> **Future phase (not live):** install-from-URL / marketplace fetch — downloading a
> plugin from a remote URL into `~/.liteduck/plugins/<id>/`. The `source` field is
> a relative path for now; remote URLs are a documented future direction with no
> server behind them today.

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
add a plugin to the registry. **Never commit real secrets** — the bundled
`plugins/jira/auth.toml` ships with empty placeholders only.
