/// <reference path="../../sdk/bridge.d.ts" />
//
// Starter LiteDuck UI plugin (ADR-002). Runs inside the isolated plugin://
// iframe; talks to LiteDuck only via `window.liteduck`. Single self-contained
// script — no imports. Replace the body with your own UI; keep output escaped.

(function () {
  var root = document.getElementById("app") || document.body;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  root.innerHTML = '<div style="padding:16px;font:13px/1.5 system-ui;opacity:.7">Loading…</div>';

  liteduck
    .runCommand("my-ui-plugin.hello")
    .then(function (res) {
      if (!res.ok) {
        root.innerHTML = '<pre style="padding:16px;color:#e5484d;white-space:pre-wrap">' + esc(res.stderr) + "</pre>";
        return;
      }
      var data = {};
      try {
        data = JSON.parse(res.stdout);
      } catch (e) {
        /* fall back to raw stdout below */
      }
      root.innerHTML =
        '<div style="padding:16px;font:13px/1.5 system-ui">' +
        '<h2 style="margin:0 0 8px;font-size:15px">My UI Plugin</h2>' +
        "<p>" + esc(data.message || res.stdout) + "</p>" +
        '<p style="opacity:.5;font-size:11px;margin-top:12px">Rendered by the plugin\'s own UI — isolated plugin:// iframe.</p>' +
        "</div>";
    })
    .catch(function (e) {
      root.innerHTML = '<pre style="padding:16px;color:#e5484d">' + esc(e) + "</pre>";
    });
})();
