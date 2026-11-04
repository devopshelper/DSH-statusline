# DSH Statusline

A living status line for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that sits in a dock cell of its own under the composer, beside the harness's own status pills — nothing is hidden or replaced.

```
✻ DeepSeek Harness · ◌ in the ether Zzzz · ••••••••   ⚡99% ▰▰▰▰▰ · ↑1.4M ↓18k · ⏱ 15m
```

The facts the shipped pills report — decode rate, cache-hit share, input/output split, wall time — rendered as a terminal strip that breathes at 16 bpm while working and 12 bpm while idle. Billed totals and context occupancy stay in the hover card rather than competing with the harness's own context meter.

## How it attaches

`conversation.composer.dock` is a `list` slot; every entry is a cell keyed by `id`, rendered in ascending `order`.

```js
ctx.slots.register({ name: 'conversation.composer.dock', id: 'statusline', order: -1, ... }, StatusLine)
```

`order: -1` puts the strip first in the row. The row lays its entries out on a single flex line, so the strip asks for a whole line and switches wrapping on for the element that holds it:

```css
.dsh-sb-shell            { flex: 1 1 100% }                    /* ask for a line */
:is(div,section,ul):has(> .dsh-sb-shell),
:is(div,section,ul):has(> * > .dsh-sb-shell) {
  flex-wrap: wrap !important;
  justify-content: center !important;
}
```

The `:has()` selectors match only an element that *directly contains this plugin's own shell* — no class names borrowed from the owner — so the shipped `activity` and `usage` pills land on a centred second line. If upstream ever restructures that markup the selectors stop matching and the layout degrades to side-by-side rather than restyling someone else's element. Two depths are covered because a slot renderer may or may not wrap each entry in its own element.

The strip caps its own width (`max-width: var(--sb-shell-max, 980px)`) and centres itself with `margin-inline: auto`.

### Taking the cells over instead

The same slot supports *replacing* the shipped pills, which is what earlier builds of this plugin did. The rules live in [`packages/client/ui-slots/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-slots/src/index.ts):

- registering a duplicate `id` **at the same priority throws**;
- a different priority **shadows** that cell, and **the lowest priority renders**.

```js
ctx.slots.inject('conversation.composer.dock', function* () {
  yield ctx.slots.register({ id: 'activity', order: 0, priority: -1, ... }, StatusLine)
  yield ctx.slots.register({ id: 'usage',    order: 1, priority: -1, ... }, () => null)
})
```

That gives a single strip with no shipped line, and because the shipped entries stay registered underneath, uninstalling — or a crash in the entry, which *abdicates* it — restores them automatically. Use it if you want one line and no duplication.

## Data

Everything comes from session projections — no polling, no client-side folding:

| Projection | Used for |
|---|---|
| `sessionStats` | turns, steps, `decodeTokens / decodeMs` → tok/s (drives bead speed), `llmMs + toolMs` → wall time |
| `tokenUsage` | cache-hit % (`cacheRead / promptSide`), `↑uncached ↓output`, and the card's billed total (`uncached + output + cacheRead + cacheWrite`) |
| `contextPressure` | `projectedTokens ?? pressureTokens` / `contextWindow` → ctx %, clamped at 100 (card only) |
| `contextBreakdown` | surface composition, shown in the card |

Busy state comes from `useSessionStatus` — the session status stream, never token activity — so the breath cannot flicker idle between tool calls.

## Interactions

| Action | Result |
|---|---|
| hover the `✻ DeepSeek Harness` chip | card with turns/steps, decode rate, billed tokens, cache, context occupancy, surface + 12 palette swatches + pixel toggle |
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

## Low-frame (pixel) mode

The bead lane is the most expensive thing on screen: eight nodes, each carrying two `box-shadow` layers, animating continuously. On RDP or any software-rendered session that is what stutters. Pixel mode keeps the strip alive but makes it move like an 8-bit sprite.

Toggle it in the card (`pixel`). It persists in `localStorage["dsh.statusbar.pixel"]` and defaults to on when the OS asks for reduced motion.

| Cost | Smooth | Pixel |
|---|---|---|
| bead nodes | 8, each with two glow shadows | 4, solid squares, no shadow |
| bead motion | continuous `translateX` | `steps(8)` - eight sprite positions per loop |
| strip breathing | `box-shadow` repaint across the whole bar | off, static inset glow |
| glyph morph | 130 ms while working | 320 ms, `steps(4)` |
| phrase halo / splash / hover filter | on | off |
| flow duration floor | 0.5 s | 0.9 s, so four stepped beads still read as flow |

The two toggles compose: `pixel` reduces *how* it moves, `fx off` (lite) removes the whole-surface effects entirely.

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

## Updating

The install is a **link**, not a copy: the profile's `package.json` points at your checkout, which means the checkout *is* the installed code. There is no registry to pull from.

```powershell
cd <your checkout>
git pull                     # client.js is committed, so this alone is a working update
.\uninstall.ps1              # unregister + unlink
.\install.ps1                # relink + register
```

Then reload the Harness Web UI with **Ctrl+Shift+R**. If the strip looks unchanged, restart DeepSeek Harness — the client bundle is fetched per module generation, and a running app can keep serving the previous one.

The uninstall/install round-trip is what forces that new generation; `git pull` on its own changes files on disk, which the running page may never re-read.

- **No build step needed** for a normal update: `client.js` is committed. Run `node scripts/build.mjs` only if you edited `client.src.js` or `styles/statusbar.css`.
- **From an agent session** the same cycle is `plugin_manager remove_bundle`, then `install_bundle` with the same directory.
- **Check what you're running:** `git -C <checkout> log -1 --oneline`.
- **Don't move or delete the checkout afterwards.** The profile points at it, so relocating it breaks the bundle on the next DSH start — re-run `install.ps1` from the new location if you do.

Your settings survive an update: theme, pixel and FX choices live in the browser's `localStorage`, not in the repo.

## Recolouring DSH's own context meter

The ring + percentage the shipped composer draws beside this strip is not a slot, and it does not use a colour of its own — it inherits DSH's label tokens:

```css
.A6Bq1a_trigger { color: var(--dsw-alias-label-tertiary) }                 /* the % */
.A6Bq1a_fill    { stroke: var(--dsw-alias-label-tertiary) }                /* the arc */
.A6Bq1a_trigger:hover, [aria-expanded="true"] { color: var(--dsw-alias-label-secondary) }
```

So it is recolourable without touching the harness — one variable, no rebuild:

```css
:root { --dsh-sb-ctx: #00e5ff }                 /* ring + percentage */
:root { --dsh-sb-ctx-hover: #7af0ff }           /* optional; defaults to --dsh-sb-ctx */
```

Paste it in DevTools to preview, or keep it in any always-on user stylesheet. The plugin already ships the rules, inert until the variable is set, and resolves to the shipped tokens when it isn't.

The rules are scoped structurally — `[data-composer-dock]` plus the meter's 14px `viewBox` ring — rather than by the hashed class name in the snippet above, because that hash changes between DSH builds.

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

- The context ring to the right of the strip is **composer chrome, not a slot** (`conversation.input.activity` has no occupants; `ContextMeter` is rendered directly by the composer's dock, after the slot). Its colour is reachable through the variables above; nothing else about it is touched.
- The shipped line stays visible below the strip, so cache-hit appears twice. Removing the duplication means taking the cells over (see above), which hides the shipped figures entirely.
- `ctx` and `tok` were dropped from the strip: the harness already renders context occupancy, and both figures are still in the hover card.
- Stacking relies on `:has()` matching the strip's own container. It is deliberately written against our element rather than the owner's classes, so the failure mode is "pills sit beside the strip again", not a broken layout elsewhere.
- `🪟` and `📦` rendered as tofu in the composer font stack, so `ctx` and `tok` were plain text (and are now gone).
- Visual verification is per-screenshot; there is no browser automation in this setup.
