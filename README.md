# DSH Statusline

A living status line for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that **takes over** the two composer status cells (`activity` and `usage`) instead of adding a third row beside them.

```
✻ DeepSeek Harness · ◌ in the ether Zzzz · ••••••••     ⚡99% ▰▰▰▰▰ · 25% ctx · 21.9M tok · ↑178.2k ↓129.9k · ⏱ 15m
```

Same facts the shipped pills reported — turns, decode rate, billed tokens, cache-hit share, context occupancy, wall time — rendered as a terminal strip that breathes at 16 bpm while working and 12 bpm while idle.

## How the takeover works

`conversation.composer.dock` is a `list` slot. The rules live in [`packages/client/ui-slots/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-slots/src/index.ts):

- registering a duplicate `id` **at the same priority throws**;
- a different priority **shadows** that cell, and **the lowest priority renders**.

The shipped cells sit at priority `0`, so this plugin registers both ids at `priority: -1`:

```js
ctx.slots.inject('conversation.composer.dock', function* () {
  yield ctx.slots.register({ id: 'activity', order: 0, priority: -1, ... }, StatusLine)
  yield ctx.slots.register({ id: 'usage',    order: 1, priority: -1, ... }, () => null)
})
```

Consequences worth knowing:

- the shipped entries stay registered underneath, so **uninstalling restores them automatically**;
- if this component ever throws, the entry *abdicates* and the shipped pill comes back on its own;
- `usage` is claimed and renders nothing, purely so the shipped perf pill cannot reappear beside the strip.

## Data

Everything comes from session projections — no polling, no client-side folding:

| Projection | Used for |
|---|---|
| `sessionStats` | turns, steps, `decodeTokens / decodeMs` → tok/s (drives bead speed), `llmMs + toolMs` → wall time |
| `tokenUsage` | billed total (`uncached + output + cacheRead + cacheWrite`), cache-hit % (`cacheRead / promptSide`), `↑in ↓out` |
| `contextPressure` | `projectedTokens ?? pressureTokens` / `contextWindow` → ctx %, clamped at 100 |
| `contextBreakdown` | surface composition, shown in the card |

Busy state comes from `useSessionStatus` — the session status stream, never token activity — so the breath cannot flicker idle between tool calls.

## Interactions

| Action | Result |
|---|---|
| hover the `✻ DeepSeek Harness` chip | card with turns/steps, decode rate, tokens, cache, context, surface + 12 palette swatches + FX toggle |
| click the chip | pin / unpin the card |
| click anywhere on the strip | converging wave crests, fired from the click point |
| palette swatch | repaints every glow (four custom properties carry the whole theme) |

Persisted choices: `localStorage["dsh.statusbar.theme"]` and `localStorage["dsh.statusbar.fx"]`.

## Layout rules that are load-bearing

- `--sb-glow` must stay a **bare RGB triple** (`0,229,255`, no `rgb()` wrapper) — it is spliced into `rgba(var(--sb-glow), a)` by every keyframe.
- breath stops at **0% / 38% / 46% / 100%** — asymmetric inhale/hold/exhale, not a sine.
- **27ch** status slot and **1.2em** glyph box, or the strip reflows once per breath.
- the splash restarts via class flip + reflow on a persistent node — never a remount.
- no `container-type` on the shell: inline-size containment reports zero intrinsic width and collapses the strip.

## Build

`client.js` is committed and loaded directly — the runtime has no build step. The stylesheet is vendored at `styles/statusbar.css` and spliced into the bundle:

```powershell
node scripts/build.mjs   # or: pnpm build
```

The script uses `JSON.stringify` for the splice. That detail matters: serializing the CSS any other way can wrap it as `{"value": "..."}`, which makes the bundle concatenate `"[object Object]"` and silently drops every rule.

## Install

### Script

```powershell
.\install.cmd                       # double-click wrapper
.\install.ps1 -DryRun               # print the plan, change nothing
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

`install.ps1` performs both halves of an install, because only one of them is a pnpm command:

1. `dsh plugin --profile <profile> add <this directory>` — links the package into the profile
2. registers it in the profile's `dsh.profile.bundles` — **this is what actually activates it**, and it has no CLI

It backs the profile manifest up before editing, restores it if registration fails, reads the result back to confirm, and is idempotent: re-running changes nothing and leaves no backup litter.

| Parameter | Default | Meaning |
|---|---|---|
| `-Profile` | `$env:DSH_PROFILE`, else `desktop` | profile under `%USERPROFILE%\.dsh\profiles` |
| `-Source` | this script's directory | package directory to install |
| `-DryRun` | — | print the plan, change nothing |

Remove it again with `.\uninstall.cmd` (dry run: `.\uninstall.ps1 -DryRun`). Uninstalling restores the shipped pills, since they were only ever shadowed.

> The `.cmd` wrappers exist because the default Windows execution policy blocks unsigned `.ps1` files.

### From an agent session

```
plugin_manager install_bundle  target: <absolute path to this directory>
```

Either route links the directory rather than copying it, so edits to `client.js` need a remove + add cycle (a fresh module generation) plus a page refresh.

## Structure

```
client.src.js        editable client source (CSS placeholder)
client.js            generated bundle - do not edit by hand
styles/statusbar.css vendored portable stylesheet (attribute-driven, 12 themes)
scripts/build.mjs    splice css -> client.js
scripts/register.mjs add/remove the bundle in a profile manifest
install.ps1/.cmd     installer (link + register, with backups)
uninstall.ps1/.cmd   remover
cordis.patch.yml     inserts the bundle row
index.js             host half (no host behaviour)
locale/en.json       Plugin Manager display metadata
locale/zh.json       same, Chinese
icon.svg             original artwork
```

## Notes and limits

- The context ring to the right of the strip is **composer chrome, not a slot** (`conversation.input.activity` has no occupants and no other ui-chat registration paints a percentage). It is left untouched rather than styled through another package's internal class names.
- `🪟` and `📦` rendered as tofu in the composer font stack, so `ctx` and `tok` are plain text.
- Visual verification is per-screenshot; there is no browser automation in this setup.
