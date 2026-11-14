# DSH Statusline

A living status line for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), offered as one of two presentations: a bar docked under the composer (which replaces the harness's own pills line while it is on) or a floating card you can drag anywhere. One at a time, or none; choosing one switches the other off.

```
✻ ◇ deepseek-v4.1-flash · ✦ Flibbertigibbeting...  · •••••••• · 42 tok/s · ▣▣◧▢▢   ⚡99% ▰▰▰▰▰ · ↑1.4M / ↓18k · ⏱ 15m
✻ ◇ deepseek-v4.1-flash · ✦ Crunched for 4s        · •••••••• · 42 tok/s · ▣▣▣▢▢   ⚡99% ▰▰▰▰▰ · ↑1.4M / ↓18k · ⏱ 15m
✻ ◇ deepseek-v4.1-flash · ◌ in the ether Zzzz      · •••••••• · 42 tok/s           ⚡99% ▰▰▰▰▰ · ↑1.4M / ↓18k · ⏱ 15m
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

The vocabulary is replaceable. Settings → Plugins → `phrases` is a textarea: one phrase per line, as many as you like (spaces are trimmed, blank lines ignored). A non-empty list replaces both the working verbs and the idle phrases — what you typed is what the strip says — while the turn-end word (`Crunched for 4s`) and the glyph stay as they are. Empty the box, or hit reset, to get the built-in lists back. The phrases live in `localStorage["dsh.statusbar.phrases"]`; the 27ch slot still truncates long lines, so the strip never shuffles sideways.

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
| `sessionStats` | turns, steps, `decodeTokens / decodeMs` → tok/s (drives bead speed and the strip's tok/s tachometer), `llmMs + toolMs` → wall time |
| `tokenUsage` | cache-hit % (`cacheRead / promptSide`), the `↑in / ↓out` split (uncached input, output), and the card's billed total (`uncached + output + cacheRead + cacheWrite`) |
| `contextPressure` | `projectedTokens ?? pressureTokens` / `contextWindow` → ctx %, clamped at 100 (card, and the opt-in strip gauge) |
| `contextBreakdown` | surface composition, shown in the card |
| `modelSelection` | the chip's model name and reasoning effort (`next ?? lastUsed`, so a blank session and a settled one both read) |
| `todos` | the step boxes (the same projection the harness's own checklist dock reads) |

Busy state comes from `useSessionStatus` — the session status stream, never token activity — so the breath cannot flicker idle between tool calls.

`modelSelection` and `todos` are optional: a host that does not publish them gets the plain `DeepSeek Harness` chip and no boxes, never a blank chip or a crash. Everything is shape-checked before it is rendered.

### The tok/s tachometer

The strip writes down the figure the lane is drawing: `decodeTokens / decodeMs` for the session, next to a 30×16 tachometer. The arc fills toward 200 tok/s — the same ceiling the board's activity meter uses — and the needle points at the same value, so the gauge's height means speed rather than shape. A very fast session pins the needle to the right instead of wrapping it. Arc and needle ease toward a new reading (0.5 s) instead of snapping; pixel mode drops that easing, since a smooth sweep is the thing it is there to avoid. The number is the reading; the gauge is its echo.

### The context gauge

Off by default, because the composer already draws the harness's own context ring. Turn on **context gauge** in Settings → Plugins and the strip adds a compact fuel gauge to the right-hand cluster: a 22×6 runway, a fill proportional to `contextPressure`, and the percentage. It is a reading, not decoration, so the fill is semantic: the accent while there is room, amber from 75%, red from 90% — and those colours never theme, because a warning that recolours itself stops being a warning. The tooltip carries the absolute pair (`32% (41.0k / 128.0k)`). It is also in the settings preview, so you can see it before switching it on.

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
| `beads` / `bpm` / `water` / `term` / `traffic` | cycles the flow lane: travelling beads, a heartbeat trace, scrolling water, a typing terminal line, or highway traffic |
| `demo` | rehearses the working state without sending a prompt |
| `above` / `corner` | where the card hangs off the strip (see below) |
| `card` / `board` in the panel header | switches the panel between the compact card and the three-column board |
| `▼` / `▶` in the board header | folds the board to its one-line summary, or unfolds it |
| `w − / +` | widens or narrows the strip: 900 → 980 → 1120 → 1280 → 1500 → full |
| `h − / +` | heightens or flattens it: vertical padding 2 → 4 → 6 → 9 → 12 → 16 → 20 px |
| drag the card header | moves the card anywhere; double-click the header to put it back |
| drag the floating card | moves it anywhere; double-click sends it back to the default seat |
| `×` | closes the card, including a pinned one |

Persisted choices: `localStorage["dsh.statusbar.theme"]`, `["dsh.statusbar.fx"]`, `["dsh.statusbar.pixel"]`, `["dsh.statusbar.flow"]`, `["dsh.statusbar.anchor"]`, `["dsh.statusbar.view"]`, `["dsh.statusbar.collapse"]`, `["dsh.statusbar.strip"]`, `["dsh.statusbar.float"]`, `["dsh.statusbar.floatpos"]`, `["dsh.statusbar.phrases"]`, `["dsh.statusbar.context"]`, `["dsh.statusbar.harness"]`, `["dsh.statusbar.width"]`, `["dsh.statusbar.height"]`.

## The settings page

The same preferences are editable from **Settings → Plugins**, as a tab of the plugin's own (`settings.plugins.tab`, id `statusline`, order 20) — no need to open the hover card to change a palette.

| | |
|---|---|
| seats | `settings.plugins.tab` next to the shipped "all plugins" tab |
| edits | palette (12), panel view, the strip presentation (line / floating card), card position reset, the harness bar, the phrase list, the context gauge, full-surface FX, low frame rate, flow lane (all five skins), card anchor, width, height, and a reset |
| preview | a real strip, not a mock: same classes, same attributes, same theme variables, and the same lane/gauge builders the strip uses, so the preview follows the lane, phrase, context and tok/s choices as you click |
| storage | the same browser-local keys the strip reads; nothing is written to the profile |
| liveness | every write fires `dsh-statusbar:settings` on `window`, and every mounted strip (and the page itself) re-reads its keys — so the strip behind the settings updates as you click, and so does the page if you change something from the card |

The page is wrapped in the same error boundary as the strip: a broken settings page degrades to the fallback box instead of taking the Settings panel down. Registration follows the shape the shipped plugin-inventory tab uses (`label` as a function so the tab name resolves in the reader's language at draw time).


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

## Panel views

The panel has two shapes over the same figures. The **card** is the original: one column, 300 px, everything the strip truncates written out. The **board** gives the numbers room: a summary line and three columns, 680 px wide.

| | `card` (default) | `board` |
|---|---|---|
| width | 300 px | 680 px (full-width minus margins under 740 px) |
| body | seven label/value rows | summary line + ACTIVITY, TOKENS, CONTEXT columns |
| leads with | the state | a 20-block meter and a large figure per column |
| collapse | `▼` folds the board down to its summary line, `▶` unfolds it |
| switch | `card` / `board` in the panel header, or Settings → Plugins → panel |

The board also folds. Collapsed it is the summary line alone — state, turns/steps, activity meter, cache, context, in/out, wall time — with no columns and no footer, sized to that line instead of 680 px. The fold control is the `▼`/`▶` at the head of the line, and it is persisted, so a board left folded stays folded.

The switch lives in the card header rather than the tool row because it changes the panel's shape, and the choice is persisted with the rest. Both views share the same footer (palette, size, tools) and the same floating layer: only the width differs, and the corner fit is measured against the card **as it renders**, so switching to the board at the window's left edge falls back to `above` on its own instead of hanging off-screen.

The meters are twenty blocks of five percent. Activity is scaled against 200 tok/s because that is the top of the range a person can still read at a glance; cache and context are already percentages.

### One strip, two presentations

The same strip can sit in two places, chosen in Settings → Plugins:

| switch | on means | off means |
|---|---|---|
| **status line** | the strip sits in the dock under the composer and owns the hover panel | nothing is docked; the floating card (if on) is the only copy |
| **status card** | the strip floats over the conversation, draggable by its body | no floating bar |
| **harness bar** | the harness's own context ring is kept beside the strip | it is hidden, since the strip can show the same figure as its context gauge |

The first two are alternatives, not layers: choosing one switches the other off, so the same line is never drawn twice. The third is independent of both — it decides whether the harness's own status exists beside ours, and it is the only thing that decides. The floating copy is a bar, not a second panel.

In this harness version the composer dock no longer carries a line of shipped pills: its only shipped status is the context ring. **harness bar** therefore defaults to on and controls that ring; turning it off hides the ring (the strip's own opt-in context gauge can take its place).

**harness bar** works through one marker class on the shell, and the hiding rule is the only consumer of it. The line puts the marker on directly; the floating-only mode leaves a hidden marker in the dock so the same rule still applies. The rule is structural, so it can only hide siblings of the shell that are not the shell:

```css
:is(div,section,ul):has(>.dsh-sb-shell.sb-hide-default) > *
  :not(.dsh-sb-shell)          /* our shell itself */
  :not(:has(.dsh-sb-shell))    /* whatever wrapper holds it */
  { display: none }
```

With **harness bar** on, or with every presentation off, there is no marker in the dock, so nothing is hidden. The first two exclusions are not the same test — `:has()` only looks at descendants, so the shell never matches the second one. If the owner restructures the dock the selector stops matching; nothing else is ever hidden. The old version also excluded any element containing a 14×14 svg, which kept the context ring alive; that exclusion is gone, because the ring is exactly what this switch controls now.

### The floating card

The floating card is the same line, `position: fixed` on `<body>`, portalled there for the same reason the panel is (inside the dock it would lose to the compose box). It is dragged by its body anywhere in the window; the position is stored in viewport pixels under `dsh.statusbar.floatpos`, so it comes back where it was left. Until it is dragged, its home is the bottom-centre seat, clear of the composer; if the docked line is ever on at the same time (the settings avoid that), the seat becomes the line's above-left corner instead, the same one the panel's `above` anchor uses, and it follows the bar as the composer grows. Double-clicking clears the stored position and returns it home, and the settings page has a **put it back** button for the same thing.

It deliberately has no panel: the chip does not pin, hovering does nothing, and there is no `card`/`board` expansion. The panel belongs to the docked line, which has an anchor to hang it from, so the floating card is unaffected by the card anchor setting, and the board is reachable while the docked line is on.

## Card placement

The card is anchored to the strip, never to the pointer, and it has two anchors:

| | `above` (default) | `corner` |
|---|---|---|
| geometry | `left: 12px; bottom: calc(100% + 8px)` | `right: 100%; bottom: calc(100% + 5px)` |
| reads as | a panel lying over the strip | a menu pinned to the strip's top-left corner |
| tail | centred under the card | near the card's bottom-right, pointing at the corner |

In `corner` the card's bottom-right corner meets the strip's top-left corner and the card grows up and to the left, so its **right** edge is what aligns with the strip rather than its left edge. That needs a card's worth of room outside the strip, which only exists when the window is wider than the strip plus the card plus 16 px. The card's rendered width is what gets measured, not a constant: the board is more than twice as wide as the card. When there is no room the card silently falls back to `above` — otherwise it would hang off the left edge of the window.

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

The lane beside the status text has five skins, cycled from one button in the card (or picked directly on the settings page) and remembered:

| skin | shape | working | idle |
|---|---|---|---|
| `beads` (default) | 8 round nodes, two offset rows | `translateX` with staggered delays | nodes dim and barely drift |
| `bpm` | one `polyline` on a 128×17 baseline | a 9%-of-path dash swept by `stroke-dashoffset` | the trace is hidden, leaving a flatline |
| `water` | two filled wave silhouettes | both layers scroll one wavelength per cycle; the back runs 40% slower and half a cycle out of phase | amplitude drops to 40% via `scaleY`, the front loses its glow, the swell settles rather than stopping |
| `terminal` | a prompt, a command line and a block cursor | typed character by character at the token rate, cursor blinking | the same line, typed slowly, dimmer |
| `traffic` | two lanes and a dashed divider, seen from above | one car per ~22 tok/s: more cars **and** a faster road as the rate climbs | a single car with the road to itself |

All five read the same tok/s formula (`clamp(3.2 / (1 + tps / 55), 0.5, 3.2)`), so whichever skin is on, the lane's speed means the same thing: how fast tokens are landing. The `bpm` sweep rate *is* the pulse rate, the `water` scroll is a shade slower than the beads (`× 1.15`, floored at 1 s per wavelength) because at bead speed the crests strobe, and `terminal` and `traffic` are slower still — a typewriter running at bead speed is unreadable.

### The terminal

A prompt, a command, a block cursor — the skin a status line was always going to end up with.

```text
$ dsh status --watch█
```

The typewriter is a `clip-path` reveal animated with `steps(N)`, where **N is the character count of the string**, so nothing is laid out per frame and the text stays real text in the DOM. `TERM_LINE` and the step count live beside each other in the source and the render test asserts they still agree, because a mismatch is invisible at runtime (the last characters would simply clip in mid-letter). Speed is the token rate: a busy turn types the line in 1.2 s, idle takes 7 s. The cursor blinks on its own 1.05 s loop and its glow follows the palette.

### The highway

Throughput, drawn as a road. Both lanes run left to right; the number of cars **and** their speed both come from the same number, which is the point of the skin:

| token rate | cars |
|---|---|
| idle | 1 |
| ~25 tok/s | 2 |
| ~70 tok/s | 4 |
| very fast | 5 (the slot ceiling) |

Cars are spaced by fixed per-slot delays (slot *i* starts *i*/5 of a cycle after slot 0), so the gaps stay even and every car keeps its own phase when the fleet grows. Growing is immediate — a new car enters from the left, off-canvas. Shrinking is not: a car being retired finishes its crossing and is dropped on its next loop, off-canvas, instead of vanishing mid-lane. That is what `retireCar` and `liveCars` are for.

Lane offset rides an SVG `transform` attribute on the car group and motion rides a CSS `transform` on a child group: a CSS transform on the same element would replace the attribute and drop the car out of its lane.

## Layout rules that are load-bearing

- `--sb-glow` must stay a **bare RGB triple** (`0,229,255`, no `rgb()` wrapper) — it is spliced into `rgba(var(--sb-glow), a)` by every keyframe.
- breath stops at **0% / 38% / 46% / 100%** — asymmetric inhale/hold/exhale, not a sine.
- **27ch** status slot and **1.2em** glyph box, or the strip reflows once per breath.
- the dock is forced to `width: 100%`. The owner renders it as a shrink-to-fit flex child of a centred column, so `width: 100%` on our shell was resolving against a box sized *by its own content* — which made the whole strip grow and shrink as the phrase, the model id or the step boxes changed length. Stretching the dock gives the width an outside reference. Same structural `:has(> .dsh-sb-shell)` selector as the wrap rule, so the failure mode stays "the old behaviour returns".
- the splash restarts via class flip + reflow on a persistent node — never a remount.
- no `container-type` on the shell: inline-size containment reports zero intrinsic width and collapses the strip.

## The token split

`↑1.4M / ↓18k` is two directions, not one dim string:

| | in | out |
|---|---|---|
| arrow | `↑` in the second accent | `↓` in the accent |
| glow | 7px, static | 8px, and it **pulses while a turn is decoding** |
| title | "prompt tokens sent to the model, excluding cache hits" | "tokens the model has returned this session" |

The pulse is the only live part on purpose: incoming prompt tokens are already fixed by the time they are sent, while the outgoing count is the half that is actually moving. `fx off` freezes the pulse and drops both glows; pixel mode steps it at `steps(2)`.

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

`pixel` reaches the panel as well: inside it, animations and transitions are switched off entirely and the 44px drop shadow becomes a flat 14px one, because a moving card with a large blurred shadow is a full-card repaint every frame — the expensive thing on RDP. Dragging is coalesced for the same reason: one update per animation frame normally, one per ~20 a second in pixel mode, since every pointer event otherwise re-renders the strip too.

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
