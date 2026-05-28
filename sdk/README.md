# LiteDuck plugin UI SDK

Author a plugin that ships **its own UI** (ADR-002), rendered by LiteDuck's
isolated `plugin://` UI host. This is the escape hatch for plugins that need a
richer interface than the built-in [declarative views](../CONTRIBUTING.md)
(`table` / `keyvalue` / …). Most plugins should stay declarative; reach for a UI
bundle only when you genuinely need custom layout or interaction.

> **Security model.** Your UI runs in a sandboxed (`allow-scripts`, opaque
> origin), cross-origin `plugin://` iframe with its own locked-down CSP
> (`connect-src 'none'`). It **cannot** touch the LiteDuck window, its storage,
> the filesystem, or the Tauri bridge — and it has **no network**. Its only
> capability is to run the commands your manifest declares, via the bridge.

## 1. Declare the UI in `plugin.json`

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "kind": "tool",
  "surface": "page",
  "icon": "boxes",
  "pinned": true,
  "ui": { "entry": "ui.js", "fallback": "declarative" },
  "commands": [
    { "id": "my-plugin.hello", "title": "Hello", "run": "sh \"$LITEDUCK_PLUGIN_DIR/hello.sh\"", "default": true }
  ]
}
```

- **`ui.entry`** — a bare filename (no `/` or `..`) of your bundle, shipped in the
  plugin folder.
- **`ui.fallback`** — `"declarative"` renders the built-in views if the bundle
  fails to load, so your plugin is never a blank page. Keep your commands'
  `view` hints so the fallback is useful.
- Presence of `ui` ⇒ LiteDuck renders via the UI host. Omit it ⇒ declarative.

## 2. Write the bundle

The bundle is a **single, self-contained script** — **no `import`s / bare
module specifiers** (the sandbox has no module resolver or network). Bundle your
dependencies before publishing (see §3). Talk to LiteDuck via `window.liteduck`
(typed in [`bridge.d.ts`](./bridge.d.ts)):

```js
/// <reference path="../../sdk/bridge.d.ts" />
liteduck.runCommand("my-plugin.hello").then((res) => {
  if (!res.ok) { document.body.textContent = res.stderr; return; }
  document.getElementById("app").textContent = res.stdout;
});
```

- `runCommand(id, params?)` only runs commands your manifest **declared**; params
  arrive at the shell as `LITEDUCK_PARAM_<KEY>` env vars.
- `liteduck.context` (after `init`) carries `{ pluginId, workspace, dark }`.
- **Escape any command output you inject as HTML.** The frame is isolated, but
  it's good hygiene.

A ready-to-copy starting point lives in [`../templates/ui-plugin/`](../templates/ui-plugin/).

## 3. Bundling (for TypeScript / multi-file authors)

A hand-written single-file `ui.js` needs no build. If you write TS or split
files, bundle to one IIFE with no externals — e.g. with esbuild:

```sh
esbuild src/ui.ts --bundle --format=iife --platform=browser --outfile=ui.js
```

## 4. Submit

Follow the catalog [CONTRIBUTING](../CONTRIBUTING.md) guide: add your plugin
folder under `plugins/<id>/`, validate `plugin.json` against
[`schema/plugin.schema.json`](../schema/plugin.schema.json) (it includes the
`ui` object), and add a `registry.json` entry with `"ui": true` so the install
UI shows the executable-UI consent.
