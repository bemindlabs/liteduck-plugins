# UI plugin template

A minimal LiteDuck plugin that ships its own UI (ADR-002). Copy this folder to
`plugins/<your-id>/`, rename the id, and edit `ui.js`.

```
ui-plugin/
  plugin.json   # declares `ui: { entry: "ui.js" }` + a default command
  ui.js         # your UI — runs in the isolated plugin:// iframe
```

How it works:

- LiteDuck serves this folder from the `plugin://` custom scheme and loads
  `ui.js` in a sandboxed, cross-origin iframe (no host / Tauri access).
- `ui.js` calls `liteduck.runCommand("my-ui-plugin.hello")` — one of the
  **declared** commands — and renders the result with its own markup.
- If the bundle ever fails to load, `ui.fallback: "declarative"` shows the
  command's `view` output instead, so the plugin is never blank.

See [`../../sdk/README.md`](../../sdk/README.md) for the authoring guide and
[`../../sdk/bridge.d.ts`](../../sdk/bridge.d.ts) for the typed `window.liteduck`
bridge.
