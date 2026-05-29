/**
 * LiteDuck plugin UI bridge — type definitions (ADR-002).
 *
 * A plugin's UI bundle runs inside an isolated `plugin://` iframe: sandboxed
 * (`allow-scripts`, opaque origin) and cross-origin to the LiteDuck app, so it
 * has NO access to the host page, its storage, or the Tauri bridge. LiteDuck's
 * host-authored bootstrap exposes the global `window.liteduck` documented here.
 * Your bundle uses it to run the plugin's *declared* commands and render their
 * output with your own markup.
 *
 * Bridge version: 1. (The host ignores messages whose `v` it doesn't recognise.)
 *
 * Drop this file next to your UI source for editor autocomplete:
 *   /// <reference path="./bridge.d.ts" />
 */

export interface CommandResult {
  /** True when the command process exited 0. */
  ok: boolean;
  /** The command's stdout (parse it yourself — e.g. JSON.parse). */
  stdout: string;
  /** The command's stderr (shown when `ok` is false). */
  stderr: string;
  /** The process exit code. */
  exitCode: number;
}

export interface PluginContext {
  /** This plugin's id (manifest `id`). */
  pluginId: string;
  /** The open workspace directory, or null when none is open. */
  workspace: string | null;
  /** Whether LiteDuck is in dark mode — style your UI accordingly. */
  dark: boolean;
}

export interface LiteduckBridge {
  /** Context from the `init` handshake; null until it arrives (see `onContext`). */
  context: PluginContext | null;
  /**
   * Run one of the plugin's **declared** commands (a `commands[].id` from the
   * manifest). `params` are forwarded to the command's shell process as
   * `LITEDUCK_PARAM_<UPPERCASE_KEY>` env vars (never string-interpolated). The
   * host rejects the call if `commandId` is not declared by this plugin.
   */
  runCommand(commandId: string, params?: Record<string, string>): Promise<CommandResult>;
  /** Forward a log line to LiteDuck's logger (namespaced to your plugin). */
  log(level: "debug" | "info" | "warn" | "error", msg: string): void;
  /**
   * Open an external URL via the OS (gated capability). The host enforces:
   * **`https://` URLs only**, and **only** when your manifest declares
   * `network: true` (the same capability the install consent surfaced). All
   * other schemes (`http://`, `file:`, `javascript:`, opaque) are refused; the
   * URL length is bounded. Errors are surfaced in the host log, not back to
   * your code — call it as fire-and-forget.
   */
  openExternal(url: string): void;
  /** Optional: assign a callback to run when `context` is delivered. */
  onContext?: (context: PluginContext) => void;
}

declare global {
  interface Window {
    liteduck: LiteduckBridge;
  }
}

export {};
