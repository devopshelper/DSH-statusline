# DSH Statusline

A living status line for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that sits in a dock cell of its own under the composer, beside the harness's own status pills — nothing is hidden or replaced.

```
✻ ◇ deepseek-v4.1-flash · ✦ Flibbertigibbeting...  · •••••••• · ▣▣◧▢▢   ⚡99% ▰▰▰▰▰ · ↑1.4M ↓18k · ⏱ 15m
✻ ◇ deepseek-v4.1-flash · ✦ Crunched for 4s        · •••••••• · ▣▣▣▢▢   ⚡99% ▰▰▰▰▰ · ↑1.4M ↓18k · ⏱ 15m
✻ ◇ deepseek-v4.1-flash · ◌ in the ether Zzzz      · ••••••••           ⚡99% ▰▰▰▰▰ · ↑1.4M ↓18k · ⏱ 15m
```

The facts the shipped pills report — decode rate, cache-hit share, input/output split, wall time — rendered as a terminal strip that breathes at 16 bpm while working and 12 bpm while idle. The chip names the model that is actually running, with a family mark; the agent's own checklist appears beside the flow lane as one box per step. Billed totals and context occupancy stay in the hover card rather than competing with the harness's own context meter. A `demo` toggle in the card plays the whole working state on demand, so you can look at the motion without spending a prompt, and the card carries `w` / `h` steppers that resize the strip where you want it.

## Status text

Three states share one 27ch slot:

| State | Shows | Source |
|---|---|---|
| working | `✦ <Verb>...` | Claude Code's 187 spinner verbs, verbatim |
| turn just ended | `✦ <PastVerb> for 12s` | Claude Code's 8 past-tense words |
| idle | `◌ <phrase> Zzzz` | this strip's own sleeping lines |

The 187 words come from `WORK_VERBS` in `client.src.js` — `Accomplishing` through `Zigzagging`, extracted from Claude Code's own array. The terminal picks one per session and holds it; the strip rotates, which is the only deliberate departure. The trailing dots are a separate animated element, so the words carry no ellipsis of their own.

The turn-end word is the one thing borrowed wholesale. Claude Code prints `✻ Crunched for 4s` when a turn completes, drawing from a second, much smaller array:

```js
["Baked", "Brewed", "Churned", "Cogitated", "Cooked", "Crunched", "Sautéed", "Worked"]
```

Here the strip marks the moment `useSessionStatus` goes busy, spends the mark when it goes idle, and holds `Crunched for 4s` for six seconds before dropping back to a sleeping phrase. Turns under 800 ms are skipped — a misfire is not worth naming. Seconds are never dropped once a minute is in play (`1m 4s`, not `1m`), because that is how the original prints it.

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
| `modelSelection` | the chip's model name and reasoning effort (`next ?? lastUsed`, so a blank session and a settled one both read) |
| `todos` | the step boxes (the same projection the harness's own checklist dock reads) |

Busy state comes from `useSessionStatus` — the session status stream, never token activity — so the breath cannot flicker idle between tool calls.

`modelSelection` and `todos` are optional: a host that does not publish them gets the plain `DeepSeek Harness` chip and no boxes, never a blank chip or a crash. Everything is shape-checked before it is rendered.

## Interactions

Every tool button in the card reads as **the state it is in**, and a latched toggle wears the accent colour: `fx on` glowing means the effects are running, `fx off` greyed means they are suppressed. The label is always the current state, never the action; the action is in the tooltip. (This is a correction: `fx off` used to be the *action* label, so a strip with the effects running said "fx off" and read as its own opposite.)

| Action | Result |
|---|---|
| hover the chip | card with turns/steps, decode rate, billed tokens, cache, context occupancy, surface + the size steppers + 12 palette swatches + the toggles |
| click the chip | pin / unpin the card |
| click anywhere on the strip | converging wave crests, fired from the click point |
| palette swatch | repaints every glow (four custom properties carry the whole theme) |
| `pixel` / `pixel on` | low-frame motion for RDP / software rendering; latched in the accent when on |
| `fx on` / `fx off` | whole-surface effects, latched in the accent while they are running; state stays identical either way |
| `beads` / `bpm` / `water` | cycles the flow lane between travelling beads, a heartbeat trace and scrolling water |
| `demo` | rehearses the working state without sending a prompt |
| `above` / `corner` | where the card hangs off the strip (see below) |
| `w − / +` | widens or narrows the strip: 900 → 980 → 1120 → 1280 → 1500 → full |
| `h − / +` | heightens or flattens it: vertical padding 2 → 4 → 6 → 9 → 12 → 16 → 20 px |
| drag the card header | moves the card anywhere; double-click the header to put it back |
| `×` | closes the card, including a pinned one |

Persisted choices: `localStorage["dsh.statusbar.theme"]`, `["dsh.statusbar.fx"]`, `["dsh.statusbar.pixel"]`, `["dsh.statusbar.flow"]`, `["dsh.statusbar.anchor"]`, `["dsh.statusbar.width"]`, `["dsh.statusbar.height"]`.

## The model chip

The chip names the model the session is actually running instead of the harness brand: a small family mark, the model id verbatim, and the reasoning effort when the adapter reports one. The harness ships no provider artwork, so the marks are original geometric hints keyed by family (`deepseek`, `claude`, `openai`, `gemini`, `llama`, `mistral`, `qwen`, `moonshot`, `grok`, and a plain tile for anything else) — a hint, not a vendor logo, and they inherit the accent colour so they follow the palette.

The id is shown as the provider spells it (`deepseek-v4.1-flash`, not `DeepSeek V4.1 Flash`). Prettifying reads nicer and makes it harder to check against the model selector; the chip truncates past 18ch instead of pushing the metrics along. The full `provider/model · effort` is in the chip's tooltip, and clicking still opens the card.

## Step boxes

Beside the flow lane the strip mirrors the agent's checklist as boxes instead of text:

| State | Box |
|---|---|
| `completed` | filled with the accent, one pop on arrival |
| `in_progress` | filled with the second accent, pulsing — this is the step being worked on |
| `pending` | hollow, dimmed |

Capped at 10 boxes with a `+N` overflow count, so a long checklist cannot push the metrics off the line. The tooltip is `2/7 · first item · second item · …`. Boxes are keyed by position *and* state, which is what lets a box that has just completed pop once instead of mutating silently.

## Card placement

The card is anchored to the strip, never to the pointer, and it has two anchors:

| | `above` (default) | `corner` |
|---|---|---|
| geometry | `left: 12px; bottom: calc(100% + 8px)` | `right: 100%; bottom: calc(100% + 5px)` |
| reads as | a panel lying over the strip | a menu pinned to the strip's top-left corner |
| tail | centred under the card | near the card's bottom-right, pointing at the corner |

In `corner` the card's bottom-right corner meets the strip's top-left corner and the card grows up and to the left, so its **right** edge is what aligns with the strip rather than its left edge. That needs a card's worth of room outside the strip, which only exists when the window is wider than the strip plus `300px + 16px`, so the room is measured once per opening and the card silently falls back to `above` when it is not there — otherwise it would hang off the left edge of the window.

Dragging is orthogonal to the anchor: it records a `translate()` offset on top of whichever anchor is active, pinned for the duration so the card's own mouse-leave cannot close it mid-gesture. Offsets are clamped against the measured, *untransformed* box, so repeated drags cannot creep and the card cannot be lost off-screen. The offset is session-scoped (it is not persisted) and a double-click on the header clears it; the anchor itself is persisted.

## The card's floating layer

The card does not render inside the dock. It is portalled onto `<body>` (`react-dom`'s `createPortal`) into a fixed layer that reproduces the strip's own rectangle, and the layer carries the same `data-sb*` attributes so the palette variables and the pixel/lite overrides still reach the card through the selectors they always used.

This is not decoration. Inside the composer dock the card shares a stacking context with the compose box, which paints later and therefore over it: the card ended up behind the textarea, half-visible and flickering as the composer repainted. Clipping compounds it — any ancestor of the dock is free to have `overflow: hidden`. On `<body>` the card has a context of its own and nothing in the dock can reach it.

Two consequences worth knowing:

- The layer is `position: fixed` at `z-index: 950`: above the dock (the shell's highest non-modal layer is 101) and below anything modal, since the shell's dialogs start at 1000 and toasts at 1100. A card that floats over a dialog would be worse than one that hides behind it.
- Because the layer stands in for the strip's box, `left: 12px` and `bottom: calc(100% + 8px)` still mean what they meant: the offsets resolve against the strip, not against the viewport. The rectangle is measured when the card opens and re-measured on `resize` and `scroll` (with a sub-pixel change guard so a scroll burst does not re-render the strip for nothing), and the pointer events are switched off on the layer so it never eats a click.

If `react-dom` is unavailable, or the strip could not be measured yet, the card falls back to the old in-place rendering rather than disappearing.


## Demo mode

The strip only moves like it is working when a turn is actually running, which makes the motion awkward to look at: every inspection costs a prompt. `demo` in the card injects the working state directly — same 187 verbs, same glyph cadence, same lane, same breath, same token-driven flow formula — with no model call behind it.

- It latches: click once, and the strip works until you click again. The button takes the accent colour while it is on, and the card's `state` row reads `working (demo)` rather than `working`.
- Turning it off runs the real turn-end path: the clock that started with the demo is spent, so you get the wave plus a `Crunched for 12s` line and then a drop back to idle. That is the one state that is otherwise impossible to see on demand.
- Each edge fires the click wave too, so the splash is visible without clicking the strip.
- A real turn always outranks it: the moment the session goes busy, the demo clears itself and restarts the clock, so the word at the end describes the actual turn.
- It is **not** persisted. A reload comes back honest, at rest. `fx off` still suppresses the wave, and in pixel mode everything steps down as usual.

The lane uses the idle-throughput fallback (`55 tok/s`, i.e. a 1.6 s loop) because there is no real decode rate during a rehearsal.


## The flow lane

The lane beside the status text has three skins, cycled from one button in the card and remembered:

| | `beads` (default) | `bpm` | `water` |
|---|---|---|---|
| shape | 8 round nodes, two offset rows | one `polyline` on a 128×17 baseline | two filled wave silhouettes, one 128×17 cell |
| working motion | `translateX` with staggered delays | a 9%-of-path dash swept by `stroke-dashoffset` | both layers scroll one wavelength per cycle; the back runs 40% slower and half a cycle out of phase |
| idle | nodes dim and barely drift | the trace is hidden — only the baseline is left, i.e. a flatline | amplitude drops to 40% via `scaleY`, the front loses its glow, the swell slows to 9 s and settles rather than stops |
| cost | 8 nodes × 2 `box-shadow` layers | one stroke, no shadows outside smooth mode | two filled paths, one `drop-shadow` on the front |

All three read the same tok/s formula (`clamp(3.2 / (1 + tps / 55), 0.5, 3.2)`), so whichever skin is on, the lane's speed means the same thing. The `bpm` sweep rate *is* the pulse rate and a fast turn visibly races. The `water` scroll is deliberately a shade slower (`× 1.15`, floored at 1 s per wavelength) because at bead speed the crests strobe instead of rolling.

The `bpm` path is generated once at module load by `ECG_PATH` — one 32-unit P-QRS-T complex repeated four times — rather than hand-written coordinates. `stroke-dasharray: 9 100` with `pathLength="100"` normalises the dash to 9% of the path regardless of its real length; the keyframe shifts `stroke-dashoffset` by `-109` (dash + gap) so the loop is seamless.

The `water` path is built the same way (`WAVE_PATH`) and has three seam-critical properties, all spelled out beside it: each hump leaves and enters with the same tangent, so periods tile without a kink; the scroll travels exactly one period (64 units), so the loop lands on an identical frame instead of jumping; and the strip is drawn from `-64` to `320` instead of `0` to `256`, i.e. with a whole period of run-up off-canvas on the left. That last one is not padding: the water travels rightward like the beads and the ECG pulse do, and a rightward scroll without the overhang would expose a gap at the leading edge once per cycle. Amplitude is a `scaleY` on the shared group with `transform-box: fill-box`, anchored to the bottom, which is why going idle is a swell settling rather than a swap between two drawings.

## Layout rules that are load-bearing

- `--sb-glow` must stay a **bare RGB triple** (`0,229,255`, no `rgb()` wrapper) — it is spliced into `rgba(var(--sb-glow), a)` by every keyframe.
- breath stops at **0% / 38% / 46% / 100%** — asymmetric inhale/hold/exhale, not a sine.
- **27ch** status slot and **1.2em** glyph box, or the strip reflows once per breath.
- the splash restarts via class flip + reflow on a persistent node — never a remount.
- no `container-type` on the shell: inline-size containment reports zero intrinsic width and collapses the strip.

Cadence lives in three constants at the top of `client.src.js`, not scattered through the component:

| | working | idle |
|---|---|---|
| `PHRASE_MS` — status text rotates | 3750 ms | 11000 ms |
| `GLYPH_MS` — `✻` morphs | 130 ms | 700 ms |
| `GLYPH_MS_PIXEL` — same, pixel mode | 320 ms | 900 ms |
| `DONE_MS` — turn-end word holds | 6000 ms | 6000 ms |

Idle is deliberately slower than one breath (5 s): the phrase lands about every second breath, so the strip reads as dozing rather than flipping.

## Low-frame (pixel) mode

The bead lane is the most expensive thing on screen: eight nodes, each carrying two `box-shadow` layers, animating continuously. On RDP or any software-rendered session that is what stutters. Pixel mode keeps the strip alive but makes it move like an 8-bit sprite.

Toggle it in the card (`pixel`). It persists in `localStorage["dsh.statusbar.pixel"]` and defaults to on when the OS asks for reduced motion.

| Cost | Smooth | Pixel |
|---|---|---|
| bead nodes | 8, each with two glow shadows | 4, solid squares, no shadow |
| bead motion | continuous `translateX` | `steps(8)` - eight sprite positions per loop |
| strip breathing | `box-shadow` repaint across the whole bar | off, static inset glow |
| glyph morph | 130 ms working / 700 ms idle | 320 ms / 900 ms idle, `steps(4)` |
| phrase halo / splash / hover filter | on | off |
| flow duration floor | 0.5 s | 0.9 s, so four stepped beads still read as flow |
| `bpm` trace glow | `drop-shadow` on the sweep | filter removed |
| `water` scroll | continuous, two layers | `steps(8)` per wavelength, front glow removed |

The toggles compose: `pixel` reduces *how* it moves, `fx off` (lite) removes the whole-surface effects entirely, and the lane skin is orthogonal to both.

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
- The card's floating layer is the one place this plugin leaves the dock. It is portal-ed onto `<body>` because inside the dock the compose box painted over it; see [the floating layer](#the-cards-floating-layer). `_scratch/render-test.mjs` covers the jump (portal target, layer rectangle, z-index, palette attributes, tool row) without a browser.
- `🪟` and `📦` rendered as tofu in the composer font stack, so `ctx` and `tok` were plain text (and are now gone).
- The provider marks are hand-drawn geometry, not vendor logos: the harness ships no provider artwork, and shipping someone's logo in a status bar is a licensing question a strip should not answer. If a mark is wrong for your provider, the family table in `client.src.js` is the one place to fix it.
- The width stepper stops at 900px rather than shrinking further. The row is `nowrap` and the status slot is a fixed 27ch by design, so a narrower strip would spill its own contents rather than reflow.
- Visual verification is per-screenshot; there is no browser automation in this setup.
