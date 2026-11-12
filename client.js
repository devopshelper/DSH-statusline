window.__ModuleLoader__.load({
  id: '@local/dsh-statusbar',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /**
     * react-dom, for the card's floating layer. It is part of the web boot's
     * static module table, but a host that omits it must still get a working
     * card, so a missing module degrades to the old in-place rendering instead
     * of throwing at load and taking the whole strip down with it.
     */
    let ReactDOM = null;
    try {
      ReactDOM = require('react-dom');
    } catch (error) {
      ReactDOM = null;
    }

    /** The portable, attribute-driven status-bar stylesheet, verbatim. */
    const CSS = "/* ============================================================================\n   OpenCode Desktop Status Bar — portable stylesheet\n   ----------------------------------------------------------------------------\n   Framework-agnostic. No Solid, no preprocessor, no build step. Drop this in\n   any DOM host and drive it with attributes:\n\n     <div data-sb\n          data-sb-theme=\"cyan\"        <!-- see the palette block at the bottom -->\n          data-sb-state=\"work\"        <!-- idle | work  (+ data-sb-tool on the flow) -->\n          data-sb-lite>               <!-- FX off: no full-surface motion -->\n\n   Everything chromatic flows through four custom properties, so a theme is a\n   four-line patch and every glow keyframe recolors for free.\n   ========================================================================= */\n\n/* ---------------------------------------------------------------- tokens -- */\n\n[data-sb] {\n  /* Chromatic (per theme — overridden by [data-sb-theme=\"…\"] below) */\n  --sb-glow: 0, 229, 255;      /* rgb TRIPLE, no rgb() wrapper — spliced into rgba() */\n  --sb-accent: #00e5ff;        /* solid: glyphs, sparkline, cursor, Zzzz */\n  --sb-accent2: #5ad8ff;       /* second particle lane, whale wash detail */\n  --sb-wash: #04161b;          /* FLAT full-bar tint. Never a gradient. */\n\n  /* Rhythm — one breath is one thought. Do not add easing variety here. */\n  --sb-breath-work: 3.75s;     /* 16 breaths/min, alert */\n  --sb-breath-idle: 5s;        /* 12 breaths/min, resting */\n  --sb-ease-breath: cubic-bezier(0.37, 0, 0.63, 1); /* symmetric in/out */\n\n  /* Type */\n  --sb-fs: 12px;\n  --sb-fs-status: 12.5px;      /* the phrase is the only text allowed above 12 */\n  --sb-fs-meta: 11px;\n  --sb-text: #f2f7ff;\n  --sb-fs-family: inherit;     /* never set a font — inherit the host's UI face */\n\n  /* Layout */\n  --sb-gap-col: 18px;\n  --sb-gap-row: 3px;\n  --sb-pad-x: 16px;\n  --sb-pad-y: 6px;             /* host-adjustable 2–18px */\n\n  /* Particle lane */\n  --sb-flow-w: 128px;\n  --sb-flow-h: 17px;\n  --sb-flow-dur: 1.4s;         /* driven by tok/s — see STYLE.md §7 */\n}\n\n/* ----------------------------------------------------------------- shell -- */\n\n[data-sb] {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  column-gap: var(--sb-gap-col);\n  row-gap: var(--sb-gap-row);\n  width: 100%;\n  padding: var(--sb-pad-y) var(--sb-pad-x);\n  font-family: var(--sb-fs-family);\n  font-size: var(--sb-fs);\n  letter-spacing: 0.3px;\n  color: var(--sb-text);\n  background: #000000;                        /* true black, AMOLED-first */\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n  box-shadow: inset 0 0 30px rgba(var(--sb-glow), 0.10);\n  position: relative;\n  user-select: none;\n}\n\n/* Groups of related segments, separated by dim `·` glyphs. */\n[data-sb] .sb-group { display: flex; align-items: center; gap: 10px; white-space: nowrap }\n[data-sb] .sb-group.end { margin-left: auto }\n[data-sb] .sb-sep { opacity: 0.35 }\n\n/* The strip itself breathes. One cycle = one thought; speed IS the state. */\n[data-sb][data-sb-state=\"work\"] { animation: sb-breathe var(--sb-breath-work) var(--sb-ease-breath) infinite }\n[data-sb][data-sb-state=\"idle\"] { animation: sb-breathe-idle var(--sb-breath-idle) var(--sb-ease-breath) infinite }\n\n/* Any text that should pulse with the breath — the status phrase, the glyph. */\n[data-sb] .sb-glow { animation: sb-glow var(--sb-breath-work) var(--sb-ease-breath) infinite }\n[data-sb] .sb-alert { animation: sb-alert 1.6s ease-in-out infinite }\n\n/* ---------------------------------------------------------- status phrase -- */\n\n/* Fixed 27ch slot: phrases rotate, the bar must never shuffle sideways. */\n[data-sb] .sb-status {\n  display: inline-block;\n  min-width: 27ch;\n  max-width: 27ch;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  vertical-align: middle;\n  font-size: var(--sb-fs-status);\n}\n/* Idle is quiet, not disabled. Below ~.8 opacity it reads as greyed-out UI. */\n[data-sb][data-sb-state=\"idle\"] .sb-status {\n  opacity: 0.88;\n  font-style: italic;\n  font-weight: 500;\n  color: #eaf2fd;\n  text-shadow: 0 0 7px rgba(var(--sb-glow), 0.35);\n}\n/* Working text is the accent lifted toward white: a raw accent is unreadable\n   on dark palettes (#4d6bfe on #000 is a muddy navy). The first declaration is\n   the fallback; color-mix overrides it wherever supported. */\n[data-sb][data-sb-state=\"work\"] .sb-status {\n  color: var(--sb-text);\n  color: color-mix(in srgb, var(--sb-accent) 42%, #ffffff);\n  font-weight: 600;\n}\n\n/* Claude-style glyph: always glowing, morphs while working. Fixed box width —\n   the glyph set has different advance widths and would shift the whole bar. */\n[data-sb] .sb-flower {\n  display: inline-block;\n  width: 1.2em;\n  text-align: center;\n  font-size: 12px;\n  line-height: 1;\n  color: var(--sb-accent);\n  animation: sb-glow var(--sb-breath-work) var(--sb-ease-breath) infinite;\n}\n[data-sb] .sb-flower.idle {\n  animation: sb-glow-soft var(--sb-breath-idle) var(--sb-ease-breath) infinite;\n}\n\n/* Soft ellipsis, or a hard block cursor for terminal skins. */\n[data-sb] .sb-dots i { display: inline-block; animation: sb-dotfade 1.2s ease-in-out infinite }\n[data-sb] .sb-dots i:nth-child(2) { animation-delay: 0.18s }\n[data-sb] .sb-dots i:nth-child(3) { animation-delay: 0.36s }\n[data-sb] .sb-cursor { display: inline-block; margin-left: 2px; animation: sb-blink 1.05s steps(1) infinite }\n\n/* Sleeping Zzzz: one lazy puff per breath, drifting up and out. */\n[data-sb] .sb-zzz {\n  display: inline-block;\n  margin-left: 6px;\n  font-style: normal;\n  font-size: 10px;\n  font-weight: 700;\n  letter-spacing: 0.5px;\n  color: var(--sb-accent);\n  vertical-align: 1px;\n}\n[data-sb] .sb-zzz i { display: inline-block; font-style: normal; animation: sb-zz var(--sb-breath-idle) ease-out infinite }\n[data-sb] .sb-zzz i:nth-child(2) { animation-delay: 0.55s }\n[data-sb] .sb-zzz i:nth-child(3) { animation-delay: 1.1s }\n[data-sb] .sb-zzz i:nth-child(4) { animation-delay: 1.65s }\n\n[data-sb] .sb-queue { margin-left: 6px; color: #ffc400; font-size: 11px; font-weight: 700; text-shadow: none }\n\n/* ------------------------------------------------------- token pipeline -- */\n\n/* 8 beads, two lanes, left → right. Duration encodes tok/s; nothing else does. */\n[data-sb] .sb-flow {\n  position: relative;\n  display: inline-block;\n  width: var(--sb-flow-w);\n  height: var(--sb-flow-h);\n  overflow: hidden;\n  vertical-align: middle;\n}\n[data-sb] .sb-flow i {\n  position: absolute;\n  left: 0;\n  top: 2px;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: #f8fafc;\n  box-shadow: 0 0 10px rgba(var(--sb-glow), 1), 0 0 3px rgba(255, 255, 255, 0.95);\n  animation: sb-flow var(--sb-flow-dur) linear infinite;\n}\n[data-sb] .sb-flow i:nth-child(2) { animation-delay: calc(var(--sb-flow-dur) * -0.125) }\n[data-sb] .sb-flow i:nth-child(3) { animation-delay: calc(var(--sb-flow-dur) * -0.25) }\n[data-sb] .sb-flow i:nth-child(4) { animation-delay: calc(var(--sb-flow-dur) * -0.375) }\n[data-sb] .sb-flow i:nth-child(5) { animation-delay: calc(var(--sb-flow-dur) * -0.5) }\n[data-sb] .sb-flow i:nth-child(6) { animation-delay: calc(var(--sb-flow-dur) * -0.625) }\n[data-sb] .sb-flow i:nth-child(7) { animation-delay: calc(var(--sb-flow-dur) * -0.75) }\n[data-sb] .sb-flow i:nth-child(8) { animation-delay: calc(var(--sb-flow-dur) * -0.875) }\n[data-sb] .sb-flow i:nth-child(even) {\n  top: 10px;\n  width: 5px;\n  height: 5px;\n  background: var(--sb-accent2);\n  box-shadow: 0 0 9px rgba(var(--sb-glow), 0.95);\n}\n[data-sb] .sb-flow.idle i { background: #64748b; box-shadow: none }\n\n/* Factory mode: bits get pinched down and machined through a spinning gear. */\n[data-sb] .sb-flow.tool i {\n  background: #ffe066;\n  box-shadow: 0 0 10px rgba(255, 196, 0, 0.95);\n  animation-name: sb-flow-factory;\n}\n[data-sb] .sb-flow.tool i:nth-child(even) { background: #ffc400; box-shadow: 0 0 9px rgba(255, 196, 0, 0.9) }\n[data-sb] .sb-flow-gear {\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  z-index: 2;\n  width: 12px;\n  height: 12px;\n  margin: -6px 0 0 -6px;\n  line-height: 12px;\n  text-align: center;\n  font-size: 11px;\n  color: #ffc400;\n  opacity: 0;\n  pointer-events: none;\n  text-shadow: 0 0 8px rgba(255, 196, 0, 0.9);\n  transition: opacity 0.18s ease;\n}\n[data-sb] .sb-flow.tool .sb-flow-gear { opacity: 1; animation: sb-spin 1.6s linear infinite }\n\n/* ------------------------------------------------------------- meters ---- */\n\n/* Cache hit rate as block glyphs: zero subpixel blur, monospace-safe. */\n[data-sb] .sb-blocks { display: inline-block; font-size: var(--sb-fs-meta); line-height: 1; letter-spacing: 1px; vertical-align: middle }\n[data-sb] .sb-blocks .on { color: inherit; text-shadow: 0 0 7px currentColor }\n[data-sb] .sb-blocks .off { opacity: 0.25 }\n[data-sb] .sb-num { font-variant-numeric: tabular-nums }\n\n[data-sb] .sb-flash { animation: sb-flash 0.9s ease-out 1 }\n[data-sb] .sb-bump {\n  position: absolute;\n  left: 100%;\n  top: -3px;\n  margin-left: 5px;\n  font-size: 10px;\n  font-weight: 700;\n  color: #00e676;\n  pointer-events: none;\n  white-space: nowrap;\n  animation: sb-bump 1.2s ease-out forwards;\n}\n[data-sb] .sb-loading { animation: sb-loading 1.3s ease-in-out infinite }\n\n/* ---------------------------------------------------------------- splash -- */\n\n/* Two crests enter from the ends, converge on the click, swell at contact,\n   then bounce home. --sb-x = meeting point in px, --sb-w = bar width in px.\n   Defaults keep the wave sane if a host forgets to measure. */\n[data-sb] .sb-splash { position: absolute; inset: 0; pointer-events: none; overflow: hidden; display: none; --sb-x: 50vw; --sb-w: 100vw }\n[data-sb] .sb-splash.go { display: block }\n[data-sb] .sb-splash i {\n  position: absolute;\n  left: var(--sb-sx, 13%);\n  top: 50%;\n  width: 200px;\n  height: 200px;\n  margin: -100px 0 0 -100px;\n  border-radius: 50%;\n  opacity: 0;\n  background: radial-gradient(circle, rgba(var(--sb-glow), 0.6) 0%, rgba(var(--sb-glow), 0.18) 45%, transparent 72%);\n}\n[data-sb] .sb-splash b,\n[data-sb] .sb-splash u {\n  position: absolute;\n  top: -40%;\n  width: 220px;\n  height: 180%;\n  margin-left: -110px;                        /* centres land exactly on the target */\n  border-radius: 50%;\n  opacity: 0;\n  background: radial-gradient(ellipse at center, rgba(var(--sb-glow), 0.5) 0%, rgba(var(--sb-glow), 0.16) 45%, transparent 72%);\n}\n[data-sb] .sb-splash b { left: 0 }            /* left crest travels right */\n[data-sb] .sb-splash u { left: 100% }         /* right crest travels left */\n[data-sb] .sb-splash.go i { animation: sb-impact 0.55s ease-out 0.4s forwards }\n[data-sb] .sb-splash.go b { animation: sb-wave-in-r 1.2s cubic-bezier(0.3, 0.6, 0.35, 1) forwards }\n[data-sb] .sb-splash.go u { animation: sb-wave-in-l 1.2s cubic-bezier(0.3, 0.6, 0.35, 1) forwards }\n\n/* Incoming-event flash: one-shot inset glow over the whole strip. */\n[data-sb] .sb-ping { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; animation: sb-ping 0.55s ease-out 1 }\n\n/* ---------------------------------------------------------- ocean / VT ---- */\n\n/* Whale is driving: flat wash + a single glint sweeping the top edge. */\n[data-sb][data-sb-ocean] {\n  background: var(--sb-wash);\n  border-top: 1px solid var(--sb-accent);\n  box-shadow: inset 0 0 30px rgba(var(--sb-glow), 0.14);\n}\n[data-sb][data-sb-ocean]::after {\n  content: \"\";\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 0;\n  height: 2px;\n  pointer-events: none;\n  opacity: 0.75;\n  background: linear-gradient(90deg, transparent 0%, rgba(var(--sb-glow), 0.75) 50%, transparent 100%);\n  background-size: 200% 100%;\n  animation: sb-wave 7s linear infinite;\n}\n[data-sb][data-sb-ocean] .sb-flow.idle i { background: #475569; box-shadow: none }\n\n/* Hover: lean in a touch; the card reveals the numbers the bar truncates. */\n[data-sb][data-sb-hover] { filter: brightness(1.08) }\n\n/* Scanline skin: faint CRT raster over everything, above the content. */\n[data-sb][data-sb-scan]::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  z-index: 1;\n  pointer-events: none;\n  opacity: 0.16;\n  background: repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0 1px, transparent 1px 3px);\n}\n\n/* ---------------------------------------------------------------- card ---- */\n\n/* Anchored bottom-left of the bar. Never follows the pointer. 300px wide. */\n[data-sb] .sb-card {\n  position: absolute;\n  left: 12px;\n  bottom: calc(100% + 8px);\n  z-index: 50;\n  width: 300px;\n  max-width: calc(100vw - 28px);\n  padding: 8px 11px;\n  border-radius: 10px;\n  pointer-events: auto;\n  font-size: 11px;\n  line-height: 1.6;\n  background: #000000;\n  border: 1px solid rgba(var(--sb-glow), 0.22);\n  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.95);\n  animation: sb-card-in 0.16s ease-out 1;\n}\n[data-sb] .sb-card::after {\n  content: \"\";\n  position: absolute;\n  top: 100%;\n  left: 50%;\n  margin-left: -5px;\n  border: 5px solid transparent;\n  border-top-color: rgba(var(--sb-glow), 0.22);\n}\n[data-sb] .sb-card.pinned { border-color: rgba(var(--sb-glow), 0.45) }\n\n[data-sb] .sb-row { display: flex; justify-content: space-between; gap: 16px; white-space: nowrap }\n[data-sb] .sb-k { color: rgba(150, 170, 190, 0.9) }\n[data-sb] .sb-v { color: #ffffff; font-variant-numeric: tabular-nums }\n\n[data-sb] .sb-spark { display: block; width: 100%; height: 26px; margin-top: 5px }\n[data-sb] .sb-spark polyline {\n  fill: none;\n  stroke: var(--sb-accent);\n  stroke-width: 1.5;\n  stroke-linejoin: round;\n  stroke-linecap: round;\n  filter: drop-shadow(0 0 3px rgba(var(--sb-glow), 0.85));\n}\n[data-sb] .sb-spark-base { stroke: rgba(255, 255, 255, 0.1); stroke-width: 1 }\n\n[data-sb] .sb-palette {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  margin-top: 7px;\n  padding-top: 7px;\n  border-top: 1px solid rgba(255, 255, 255, 0.08);\n  pointer-events: auto;\n}\n[data-sb] .sb-swatch {\n  width: 13px;\n  height: 13px;\n  padding: 0;\n  border-radius: 50%;\n  border: 1px solid rgba(255, 255, 255, 0.28);\n  cursor: pointer;\n  transition: transform 0.12s ease, border-color 0.15s ease;\n}\n[data-sb] .sb-swatch:hover { transform: scale(1.18) }\n[data-sb] .sb-swatch.on { border: 2px solid #ffffff }\n\n[data-sb] .sb-tools { display: flex; align-items: center; gap: 5px; margin-top: 7px; pointer-events: auto }\n[data-sb] .sb-tool-k { font-size: 9.5px; letter-spacing: 0.6px; text-transform: uppercase; color: rgba(150, 170, 190, 0.85) }\n[data-sb] .sb-tool-v { min-width: 26px; text-align: center; font-size: 10px; color: #fff; font-variant-numeric: tabular-nums }\n[data-sb] .sb-mini {\n  width: 16px;\n  height: 16px;\n  padding: 0;\n  line-height: 1;\n  border-radius: 4px;\n  border: 1px solid rgba(255, 255, 255, 0.18);\n  background: transparent;\n  color: #cfd9e6;\n  font: inherit;\n  font-size: 11px;\n  cursor: pointer;\n}\n[data-sb] .sb-mini:hover { border-color: rgba(var(--sb-glow), 0.65); color: #fff }\n[data-sb] .sb-fx {\n  margin-left: auto;\n  padding: 2px 7px;\n  border-radius: 6px;\n  border: 1px solid rgba(255, 255, 255, 0.18);\n  background: transparent;\n  color: #cfd9e6;\n  font: inherit;\n  font-size: 9.5px;\n  letter-spacing: 0.5px;\n  text-transform: uppercase;\n  cursor: pointer;\n}\n[data-sb] .sb-fx:hover { border-color: rgba(var(--sb-glow), 0.65); color: #fff }\n\n/* ------------------------------------------------------------- lite mode -- */\n\n/* FX off. Kills every full-surface repaint, keeps small motion. State stays\n   identical — lite is a rendering budget, never a different information set. */\n[data-sb][data-sb-lite] { box-shadow: none !important; animation: none !important }\n[data-sb][data-sb-lite][data-sb-hover] { filter: none }\n[data-sb][data-sb-lite] .sb-ping { display: none }\n[data-sb][data-sb-lite] .sb-splash { display: none !important }\n[data-sb][data-sb-lite] .sb-spark polyline { filter: none }\n/* Freeze the breath but keep a static halo — lite must not mean dim text. */\n[data-sb][data-sb-lite] .sb-glow {\n  animation: none !important;\n  text-shadow: 0 0 8px rgba(var(--sb-glow), 0.6);\n}\n[data-sb][data-sb-lite] .sb-card,\n[data-sb][data-sb-lite] .sb-swatch { transition: none }\n\n/* ----------------------------------------------------------- keyframes --- */\n\n/* Asymmetric on purpose: inhale at 0–38%, short hold to 46%, slow exhale out.\n   A symmetric sine reads as a machine pulsing; this reads as breathing. */\n@keyframes sb-breathe {\n  0%   { box-shadow: inset 0 0 26px rgba(var(--sb-glow), 0.30), 0 0 12px rgba(var(--sb-glow), 0.12) }\n  38%  { box-shadow: inset 0 0 62px rgba(var(--sb-glow), 0.70), 0 0 26px rgba(var(--sb-glow), 0.35) }\n  46%  { box-shadow: inset 0 0 56px rgba(var(--sb-glow), 0.62), 0 0 23px rgba(var(--sb-glow), 0.31) }\n  100% { box-shadow: inset 0 0 26px rgba(var(--sb-glow), 0.30), 0 0 12px rgba(var(--sb-glow), 0.12) }\n}\n@keyframes sb-breathe-idle {\n  0%   { box-shadow: inset 0 0 20px rgba(var(--sb-glow), 0.14), 0 0 8px rgba(var(--sb-glow), 0.05) }\n  38%  { box-shadow: inset 0 0 46px rgba(var(--sb-glow), 0.38), 0 0 16px rgba(var(--sb-glow), 0.16) }\n  46%  { box-shadow: inset 0 0 41px rgba(var(--sb-glow), 0.33), 0 0 14px rgba(var(--sb-glow), 0.13) }\n  100% { box-shadow: inset 0 0 20px rgba(var(--sb-glow), 0.14), 0 0 8px rgba(var(--sb-glow), 0.05) }\n}\n@keyframes sb-glow {\n  0%   { text-shadow: 0 0 6px rgba(var(--sb-glow), 0.40) }\n  38%  { text-shadow: 0 0 14px rgba(var(--sb-glow), 0.95) }\n  46%  { text-shadow: 0 0 12px rgba(var(--sb-glow), 0.85) }\n  100% { text-shadow: 0 0 6px rgba(var(--sb-glow), 0.40) }\n}\n@keyframes sb-glow-soft {\n  0%   { text-shadow: 0 0 4px rgba(var(--sb-glow), 0.45) }\n  38%  { text-shadow: 0 0 9px rgba(var(--sb-glow), 0.85) }\n  46%  { text-shadow: 0 0 8px rgba(var(--sb-glow), 0.75) }\n  100% { text-shadow: 0 0 4px rgba(var(--sb-glow), 0.45) }\n}\n@keyframes sb-alert {\n  0%, 100% { text-shadow: 0 0 6px rgba(255, 23, 68, 0.35) }\n  50%      { text-shadow: 0 0 14px rgba(255, 23, 68, 0.95) }\n}\n@keyframes sb-dotfade { 0%, 100% { opacity: 0.2 } 50% { opacity: 1 } }\n@keyframes sb-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }\n@keyframes sb-zz {\n  0%   { opacity: 0; transform: translate(0, 2px) scale(0.7) }\n  28%  { opacity: 0.9 }\n  100% { opacity: 0; transform: translate(4px, -9px) scale(1.2) }\n}\n@keyframes sb-flow {\n  0%   { opacity: 0; transform: translateX(0) }\n  12%  { opacity: 1 }\n  88%  { opacity: 1 }\n  100% { opacity: 0; transform: translateX(128px) }\n}\n/* Pinch to 34% through the middle, where the gear sits. */\n@keyframes sb-flow-factory {\n  0%   { opacity: 0;    transform: translateX(0)   scale(0.7) }\n  12%  { opacity: 1;    transform: translateX(16px) scale(1) }\n  44%  { opacity: 0.55; transform: translateX(55px) scale(0.34) }\n  56%  { opacity: 0.55; transform: translateX(73px) scale(0.34) }\n  88%  { opacity: 1;    transform: translateX(112px) scale(1) }\n  100% { opacity: 0;    transform: translateX(128px) scale(0.7) }\n}\n@keyframes sb-wave { 0% { background-position: -160% 0 } 100% { background-position: 160% 0 } }\n@keyframes sb-ping {\n  0%   { box-shadow: inset 0 0 0 rgba(var(--sb-glow), 0); opacity: 1 }\n  20%  { box-shadow: inset 0 0 70px rgba(var(--sb-glow), 0.85) }\n  100% { box-shadow: inset 0 0 0 rgba(var(--sb-glow), 0); opacity: 0 }\n}\n@keyframes sb-impact {\n  0%   { transform: scale(0.2); opacity: 0 }\n  30%  { transform: scale(1.1); opacity: 1 }\n  100% { transform: scale(2.6); opacity: 0 }\n}\n/* 45% → 55% hold is the collision: they swell at contact instead of passing\n   through each other, then rebound. Don't collapse that hold. */\n@keyframes sb-wave-in-r {\n  0%   { transform: translateX(0) scaleX(0.55); opacity: 0 }\n  12%  { opacity: 0.9 }\n  45%  { transform: translateX(var(--sb-x)) scaleX(1.15); opacity: 1 }\n  55%  { transform: translateX(var(--sb-x)) scaleX(1.4); opacity: 1 }\n  100% { transform: translateX(0) scaleX(0.55); opacity: 0 }\n}\n@keyframes sb-wave-in-l {\n  0%   { transform: translateX(0) scaleX(0.55); opacity: 0 }\n  12%  { opacity: 0.9 }\n  45%  { transform: translateX(calc(var(--sb-x) - var(--sb-w))) scaleX(1.15); opacity: 1 }\n  55%  { transform: translateX(calc(var(--sb-x) - var(--sb-w))) scaleX(1.4); opacity: 1 }\n  100% { transform: translateX(0) scaleX(0.55); opacity: 0 }\n}\n@keyframes sb-flash {\n  0%   { filter: none }\n  25%  { filter: brightness(1.9) drop-shadow(0 0 6px currentColor) }\n  100% { filter: none }\n}\n@keyframes sb-bump {\n  0%   { opacity: 1; transform: translateY(0) }\n  60%  { opacity: 1; transform: translateY(-7px) }\n  100% { opacity: 0; transform: translateY(-12px) }\n}\n@keyframes sb-loading { 0%, 100% { opacity: 0.35 } 50% { opacity: 0.95 } }\n@keyframes sb-spin { to { transform: rotate(360deg) } }\n@keyframes sb-card-in { from { opacity: 0 } to { opacity: 1 } }\n\n/* ------------------------------------------------------------- palettes -- */\n\n/* 12 presets. Add one by copying four lines — every glow in the file follows. */\n\n[data-sb][data-sb-theme=\"cyan\"]      { --sb-accent:#00e5ff; --sb-accent2:#5ad8ff; --sb-glow:0,229,255;   --sb-wash:#04161b }\n[data-sb][data-sb-theme=\"green\"]     { --sb-accent:#00e676; --sb-accent2:#57e39a; --sb-glow:0,230,118;   --sb-wash:#04160c }\n[data-sb][data-sb-theme=\"matrix\"]    { --sb-accent:#00ff6a; --sb-accent2:#0aff9d; --sb-glow:0,255,106;   --sb-wash:#02120a }\n[data-sb][data-sb-theme=\"magenta\"]   { --sb-accent:#ff2d95; --sb-accent2:#ff7ab8; --sb-glow:255,45,149;  --sb-wash:#170510 }\n[data-sb][data-sb-theme=\"violet\"]    { --sb-accent:#b026ff; --sb-accent2:#c777ff; --sb-glow:176,38,255;  --sb-wash:#100518 }\n[data-sb][data-sb-theme=\"amber\"]     { --sb-accent:#ffb300; --sb-accent2:#ffcf66; --sb-glow:255,179,0;   --sb-wash:#150f03 }\n[data-sb][data-sb-theme=\"ice\"]       { --sb-accent:#8ad8ff; --sb-accent2:#c7ecff; --sb-glow:138,216,255; --sb-wash:#05111a }\n[data-sb][data-sb-theme=\"blood\"]     { --sb-accent:#ff1744; --sb-accent2:#ff6b86; --sb-glow:255,23,68;   --sb-wash:#150306 }\n[data-sb][data-sb-theme=\"cyberpunk\"] { --sb-accent:#fcee0a; --sb-accent2:#ff2d95; --sb-glow:252,238,10;  --sb-wash:#14120a }\n[data-sb][data-sb-theme=\"cyberwar\"]  { --sb-accent:#ff2b2b; --sb-accent2:#39ff14; --sb-glow:255,43,43;   --sb-wash:#140606 }\n[data-sb][data-sb-theme=\"superblack\"]{ --sb-accent:#ffffff; --sb-accent2:#9aa4b2; --sb-glow:255,255,255; --sb-wash:#000000 }\n[data-sb][data-sb-theme=\"deepseek\"]  { --sb-accent:#4d6bfe; --sb-accent2:#679efe; --sb-glow:77,107,254;  --sb-wash:#0b1226 }\n\n@media (prefers-reduced-motion: reduce) {\n  /* Host may also expose this as data-sb-lite. Both are wiring, not policy. */\n  [data-sb] { animation: none }\n}\n";

    /**
     * Scoped overrides. The strip now occupies a dock cell rather than adding a
     * row beside the shipped ones, so it has to grow into the row, stay on one
     * line, and keep its own rounded chrome.
     */
    const SHELL_CSS =
      /* No `container-type` here: inline-size containment reports zero intrinsic
         width, which collapsed the strip into a narrow centred box and made
         every container query fire at once. The strip takes the row's width.

         `flex: 1 1 100%` asks for a full line: in a wrapping dock row the
         shipped pills fall to the line below, and in a non-wrapping row the
         strip simply shrinks beside them instead of overflowing. */
      '.dsh-sb-shell{display:block;width:100%;flex:1 1 100%;min-width:0;margin:1px 0}' +
      /* Stack the shipped pills *under* the strip.
         The dock row renders its entries on a single flex line, so a child
         cannot move a sibling to another row on its own. This matches only the
         element that DIRECTLY contains our own shell - no class names borrowed
         from the owner - and turns wrapping on there. If the owner ever
         restructures its markup the selector simply stops matching and the
         layout degrades to "beside", never to someone else's element. */
      ':is(div,section,ul):has(> .dsh-sb-shell),:is(div,section,ul):has(> * > .dsh-sb-shell){flex-wrap:wrap!important;justify-content:center!important;row-gap:4px}' +
      /* Pin the strip's width to the layout instead of to its text.
         The owner's dock is a shrink-to-fit flex child of a centred column, so
         `width:100%` on our shell was resolving against a content-sized box -
         which made the whole strip grow and shrink as the phrase, the model id
         or the step boxes changed length. Making the dock span the composer
         gives the shell a width with an outside reference. Same structural
         selector as the wrap rule above: if the owner restructures, it stops
         matching and the layout degrades to today's behaviour. */
      ':is(div,section,ul):has(> .dsh-sb-shell){width:100%}' +
      '.dsh-sb-shell [data-sb]{display:flex;align-items:center;flex-wrap:nowrap;width:100%;max-width:var(--sb-shell-max,980px);margin:0 auto;box-sizing:border-box;border:1px solid rgba(var(--sb-glow),.16);border-radius:10px}' +
      '.dsh-sb-shell [data-sb] .sb-group{min-width:0}' +
      '.dsh-sb-shell [data-sb] .sb-status{flex:0 1 auto;min-width:0}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-flow,.dsh-sb-shell [data-sb] .sb-sep,.dsh-sb-shell [data-sb] .dsh-sb-chip,.dsh-sb-shell [data-sb] .dsh-sb-metric{flex:0 0 auto}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-chip{display:inline-flex;align-items:center;gap:6px;padding:1px 6px 1px 3px;margin-left:-3px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;letter-spacing:inherit;cursor:help}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-chip:hover{background:rgba(var(--sb-glow),.10)}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-brand{display:inline-flex;align-items:center;gap:4px;min-width:0;max-width:18ch;font-weight:600;opacity:.92;white-space:nowrap}' +
      /* The model chip: family mark plus the model id it is actually running.
         The id is shown verbatim - a prettified "DeepSeek V4.1 Flash" would be
         nicer to read and worse to check against the model selector - and it
         truncates rather than pushing the strip around on a long id. */
      '.dsh-sb-shell [data-sb] .sb-mark{flex:0 0 auto;width:11px;height:11px;color:var(--sb-accent);opacity:.95}' +
      '.dsh-sb-shell [data-sb] .sb-modelname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.dsh-sb-shell [data-sb] .sb-effort{flex:0 0 auto;font-size:9.5px;font-weight:500;letter-spacing:.4px;text-transform:uppercase;opacity:.55}' +
      /* ---- the agent's checklist, as boxes ----------------------------------
         Same information the harness's own checklist dock carries, compressed
         to the shape of the work: one box per step, filled when done, pulsing
         while it is the step being worked on, hollow while it waits. Capped, so
         a long checklist cannot push the metrics off the line. */
      '.dsh-sb-shell [data-sb] .sb-steps{display:inline-flex;align-items:center;gap:3px;flex:0 0 auto}' +
      '.dsh-sb-shell [data-sb] .sb-step{display:inline-block;width:6px;height:6px;border-radius:2px;border:1px solid rgba(var(--sb-glow),.5);background:transparent}' +
      '.dsh-sb-shell [data-sb] .sb-step.pending{opacity:.5}' +
      '.dsh-sb-shell [data-sb] .sb-step.active{background:var(--sb-accent2);border-color:transparent;animation:sb-step-pulse 1.1s ease-in-out infinite}' +
      '.dsh-sb-shell [data-sb] .sb-step.done{background:var(--sb-accent);border-color:transparent;box-shadow:0 0 6px rgba(var(--sb-glow),.5);animation:sb-step-pop .34s ease-out 1}' +
      '.dsh-sb-shell [data-sb] .sb-step-more{font-size:9.5px;font-weight:700;opacity:.55;margin-left:1px}' +
      '@keyframes sb-step-pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.4);opacity:1}}' +
      '@keyframes sb-step-pop{0%{transform:scale(.35)}60%{transform:scale(1.35)}100%{transform:scale(1)}}' +
      /* Size steppers in the card: label | - | value | + for each axis. */
      '.dsh-sb-shell [data-sb] .sb-size{display:flex;align-items:center;gap:5px;margin-top:7px;pointer-events:auto;font-size:9.5px}' +
      '.dsh-sb-shell [data-sb] .sb-size .sb-tool-k{letter-spacing:.6px}' +
      '.dsh-sb-shell [data-sb] .sb-size .sb-tool-v{min-width:28px}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-metric{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-variant-numeric:tabular-nums}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-dim{opacity:.82}' +
      /* ---- the token split --------------------------------------------------
         In and out read as two directions, not as one dim string: the arrow
         carries the glow (accent for out, second accent for in) and the slash
         between them is a hairline. Out pulses while a turn is decoding - it is
         the only half of this pair that is moving. */
      '.dsh-sb-shell [data-sb] .sb-io{display:inline-flex;align-items:center;gap:5px}' +
      '.dsh-sb-shell [data-sb] .sb-io b{font-weight:700;line-height:1;font-size:11.5px}' +
      '.dsh-sb-shell [data-sb] .sb-in,.dsh-sb-shell [data-sb] .sb-out{display:inline-flex;align-items:center;gap:2px}' +
      '.dsh-sb-shell [data-sb] .sb-in-arrow{color:var(--sb-accent2);text-shadow:0 0 7px rgba(var(--sb-glow),.55)}' +
      '.dsh-sb-shell [data-sb] .sb-out-arrow{color:var(--sb-accent);text-shadow:0 0 8px rgba(var(--sb-glow),.7)}' +
      '.dsh-sb-shell [data-sb] .sb-io-v{opacity:.92}' +
      '.dsh-sb-shell [data-sb] .sb-io-sep{opacity:.25;margin:0 1px}' +
      '.dsh-sb-shell [data-sb][data-sb-state="work"] .sb-out-arrow{animation:sb-io-pulse 1.1s ease-in-out infinite}' +
      '@keyframes sb-io-pulse{0%,100%{opacity:.45}50%{opacity:1}}' +
      '.dsh-sb-shell [data-sb] .sb-ok{color:#00e676}' +
      '.dsh-sb-shell [data-sb] .sb-warn{color:#ffc400}' +
      '.dsh-sb-shell [data-sb] .sb-bad{color:#ff5252}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-nodata{opacity:.45}' +
      /* Turn-end word: accent, upright, no dots or Zzzz - it is a full stop. */
      '.dsh-sb-shell [data-sb] .sb-status.sb-done{font-style:normal;font-weight:600;color:var(--sb-accent);text-shadow:0 0 9px rgba(var(--sb-glow),.45)}' +
      /* ---- optional flow lane: flat ECG trace -------------------------------
         Same lane box as the bead line, so switching styles moves nothing. One
         bright dash sweeps the polyline; --sb-flow-dur still encodes tok/s, so
         the sweep is the pulse rate. At rest the trace disappears and only the
         baseline is left: a flatline, asleep. */
      '.dsh-sb-shell [data-sb] .sb-ecg{position:relative;display:inline-block;width:var(--sb-flow-w);height:var(--sb-flow-h);overflow:hidden;vertical-align:middle}' +
      '.dsh-sb-shell [data-sb] .sb-ecg svg{display:block;width:100%;height:100%}' +
      '.dsh-sb-shell [data-sb] .sb-ecg polyline{fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}' +
      '.dsh-sb-shell [data-sb] .sb-ecg-base{stroke:rgba(var(--sb-glow),.3)}' +
      '.dsh-sb-shell [data-sb] .sb-ecg-trace{stroke:var(--sb-accent);stroke-dasharray:9 100;stroke-dashoffset:0;animation:sb-ecg var(--sb-flow-dur) linear infinite;filter:drop-shadow(0 0 3px rgba(var(--sb-glow),.85))}' +
      '.dsh-sb-shell [data-sb] .sb-ecg.idle .sb-ecg-trace{display:none}' +
      '.dsh-sb-shell [data-sb] .sb-ecg.idle .sb-ecg-base{stroke:rgba(var(--sb-glow),.16)}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-ecg-trace{filter:none}' +
      '.dsh-sb-shell [data-sb][data-sb-lite] .sb-ecg-trace{filter:none}' +
      '@keyframes sb-ecg{from{stroke-dashoffset:0}to{stroke-dashoffset:-109}}' +
      /* ---- water ------------------------------------------------------------
         Two filled silhouettes in the same 128x17 cell: a dim back swell and the
         accent front, each scrolling exactly one wavelength per cycle so the
         loop has no seam. The front leads; the back runs 40% slower with a half
         cycle of offset, which is what makes it read as depth rather than two
         identical stripes.

         Amplitude is a scaleY on the shared group, anchored to the bottom, so
         going idle is a swell settling under the strip instead of a jump between
         two drawings. Pixel mode steps the scroll like everything else. */
      '.dsh-sb-shell [data-sb] .sb-wave{position:relative;display:inline-block;width:var(--sb-flow-w);height:var(--sb-flow-h);overflow:hidden;vertical-align:middle}' +
      '.dsh-sb-shell [data-sb] .sb-wave svg{display:block;width:100%;height:100%}' +
      '.dsh-sb-shell [data-sb] .sb-wave .sb-wave-amp{transform-box:fill-box;transform-origin:50% 100%;transition:transform .6s ease}' +
      '.dsh-sb-shell [data-sb] .sb-wave .sb-wave-scroll{animation:sb-wave-scroll var(--sb-wave-dur,3s) linear infinite}' +
      '.dsh-sb-shell [data-sb] .sb-wave .sb-wave-front{fill:var(--sb-accent);opacity:.9;filter:drop-shadow(0 0 4px rgba(var(--sb-glow),.7))}' +
      '.dsh-sb-shell [data-sb] .sb-wave .sb-wave-back{animation-duration:calc(var(--sb-wave-dur,3s) * 1.4);animation-delay:calc(var(--sb-wave-dur,3s) * -0.5);opacity:.4}' +
      '.dsh-sb-shell [data-sb] .sb-wave .sb-wave-back path{fill:var(--sb-accent2)}' +
      '.dsh-sb-shell [data-sb] .sb-wave.idle .sb-wave-amp{transform:scaleY(.4)}' +
      '.dsh-sb-shell [data-sb] .sb-wave.idle .sb-wave-front{opacity:.55;filter:none}' +
      '@keyframes sb-wave-scroll{from{transform:translateX(0)}to{transform:translateX(64px)}}' +
      /* ---- whale ------------------------------------------------------------
         The water field above is shared by both water skins. The whale sits
         between the back swell and the front one, so the front fill passes over
         it and the dive is hidden by the water itself - no mask, no clipping
         path, no second copy of the wave.

         Swim and dive are separate transforms on nested groups: the swim is a
         straight crossing with a fade at each edge (which is what hides the wrap),
         the dive is one traversal of the same duration. The spout is timed off
         the same clock, so a drift between spout and breach cannot happen. */
      '.dsh-sb-shell [data-sb] .sb-whale .sb-whale-swim{animation:sb-whale-swim var(--sb-whale-dur,6s) linear infinite}' +
      '.dsh-sb-shell [data-sb] .sb-whale .sb-whale-dive{animation:sb-whale-dive var(--sb-whale-dur,6s) ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}' +
      '.dsh-sb-shell [data-sb] .sb-whale .sb-whale-body{filter:drop-shadow(0 0 3px rgba(var(--sb-glow),.55))}' +
      '.dsh-sb-shell [data-sb] .sb-whale .sb-whale-body path{fill:var(--sb-accent2)}' +
      '.dsh-sb-shell [data-sb] .sb-whale .sb-whale-eye{fill:#04070d}' +
      '.dsh-sb-shell [data-sb] .sb-whale .sb-whale-spout{fill:var(--sb-text);opacity:0;animation:sb-whale-spout var(--sb-whale-dur,6s) ease-out infinite}' +
      '.dsh-sb-shell [data-sb] .sb-whale .sb-whale-tail{transform-box:fill-box;transform-origin:100% 50%;animation:sb-whale-tail 1.2s ease-in-out infinite}' +
      /* Idle water is flat (the waves settle to 40% amplitude), so the whale
         floats lower and breathes instead of diving. */
      '.dsh-sb-shell [data-sb] .sb-whale.idle .sb-whale-dive{animation-name:sb-whale-bob;animation-duration:calc(var(--sb-whale-dur,12s) * 0.4)}' +
      '.dsh-sb-shell [data-sb] .sb-whale.idle .sb-whale-spout{animation:none;opacity:0}' +
      '.dsh-sb-shell [data-sb] .sb-whale.idle .sb-whale-tail{animation-duration:2.4s}' +
      '@keyframes sb-whale-swim{0%{transform:translateX(-46px);opacity:0}7%{opacity:1}93%{opacity:1}100%{transform:translateX(292px);opacity:0}}' +
      '@keyframes sb-whale-dive{0%,6%{transform:translateY(-2px) rotate(-2deg)}18%{transform:translateY(1px) rotate(1deg)}30%{transform:translateY(-4px) rotate(-3deg)}42%{transform:translateY(6px) rotate(4deg)}56%{transform:translateY(13px) rotate(6deg)}72%{transform:translateY(9px) rotate(4deg)}86%{transform:translateY(0) rotate(-1deg)}94%,100%{transform:translateY(-2px) rotate(-2deg)}}' +
      '@keyframes sb-whale-bob{0%,100%{transform:translateY(2px) rotate(-1deg)}50%{transform:translateY(5px) rotate(1deg)}}' +
      '@keyframes sb-whale-spout{0%,26%{opacity:0;transform:translateY(3px)}31%{opacity:.95;transform:translateY(0)}40%{opacity:.7;transform:translateY(-4px)}47%,100%{opacity:0;transform:translateY(-8px)}}' +
      '@keyframes sb-whale-tail{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}' +
      /* ---- highway ----------------------------------------------------------
         Two lanes, a dashed divider, three cars. The upper lane runs right and
         the lower one runs left, with the oncoming car mirrored so its headlight
         is its leading edge - the two directions are what make this read as a
         road instead of as particles with wheels.

         The road itself is static. Motion lives in the cars: their speed is the
         token rate, so a fast model is a fast road. Each car has its own factor
         and a negative delay so they never travel in convoy. */
      '.dsh-sb-shell [data-sb] .sb-traffic{position:relative;display:inline-block;width:var(--sb-flow-w);height:var(--sb-flow-h);overflow:hidden;vertical-align:middle}' +
      '.dsh-sb-shell [data-sb] .sb-traffic svg{display:block;width:100%;height:100%}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-road rect{fill:rgba(var(--sb-glow),.45)}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-car path{fill:var(--sb-accent)}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-run-wide path{fill:var(--sb-accent2)}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-run-back path{fill:var(--sb-text);opacity:.9}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-car-wheel{fill:#04070d}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-car-light{fill:var(--sb-text);filter:drop-shadow(0 0 3px rgba(var(--sb-glow),.9))}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-car-run{animation:sb-car-right var(--sb-traffic-dur,3s) linear infinite}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-run-tight{animation-duration:calc(var(--sb-traffic-dur,3s) * .85);animation-delay:calc(var(--sb-traffic-dur,3s) * -.35)}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-run-wide{animation-duration:calc(var(--sb-traffic-dur,3s) * 1.15);animation-delay:calc(var(--sb-traffic-dur,3s) * -.62)}' +
      '.dsh-sb-shell [data-sb] .sb-traffic .sb-run-back{animation-name:sb-car-left;animation-duration:calc(var(--sb-traffic-dur,3s) * 1.05);animation-delay:calc(var(--sb-traffic-dur,3s) * -.45)}' +
      '@keyframes sb-car-right{0%{transform:translateX(-44px);opacity:0}6%{opacity:1}94%{opacity:1}100%{transform:translateX(292px);opacity:0}}' +
      '@keyframes sb-car-left{0%{transform:translateX(292px);opacity:0}6%{opacity:1}94%{opacity:1}100%{transform:translateX(-44px);opacity:0}}' +
      '.dsh-sb-shell [data-sb] .sb-tools{flex-wrap:wrap;gap:4px}' +
      /* Six buttons have to fit 278px of card. Tighten the padding and the gap
         rather than let the row wrap into a second line nobody expects. */
      '.dsh-sb-shell [data-sb] .sb-tools .sb-fx{padding:2px 6px}' +
      /* Tool row: keep the group hard right instead of letting every .sb-fx
         claim an auto margin, and make the X read as a close. */
      '.dsh-sb-shell [data-sb] .sb-tools .sb-fx{margin-left:0}' +
      '.dsh-sb-shell [data-sb] .sb-tools .sb-fx:first-child{margin-left:auto}' +
      '.dsh-sb-shell [data-sb] .sb-tools .sb-close{font-size:11px;line-height:1;letter-spacing:0;padding:2px 6px}' +
      /* A latched tool button. Only the demo ever latches, so the accent here
         means exactly "this strip is being exercised, not observed". */
      '.dsh-sb-shell [data-sb] .sb-tools .sb-fx.on{color:var(--sb-accent);border-color:rgba(var(--sb-glow),.8);box-shadow:0 0 9px rgba(var(--sb-glow),.28)}' +
      '.dsh-sb-shell [data-sb] .sb-tools .sb-fx.on:hover{color:#fff;border-color:var(--sb-accent)}' +
      /* A toggle that is off reads as inactive rather than as an unlit button
         that might be the current state. Only the latched toggles dim. */
      '.dsh-sb-shell [data-sb] .sb-tools .sb-fx.sb-pixel:not(.on),.dsh-sb-shell [data-sb] .sb-tools .sb-fx.sb-fxtoggle:not(.on){opacity:.78}' +
      '.dsh-sb-shell [data-sb][data-sb-lite] .sb-tools .sb-fx.on{box-shadow:none}' +
      /* ---- card placement ---------------------------------------------------
         The corner anchor turns the card round: its bottom-right corner lands
         on the strip's top-left corner, the tail points down at the chip, and
         the card grows up and left - a menu pinned to the corner instead of a
         panel lying over the strip. */
      '.dsh-sb-shell [data-sb] .sb-card.corner{left:auto;right:100%;bottom:calc(100% + 5px);border-bottom-right-radius:3px}' +
      '.dsh-sb-shell [data-sb] .sb-card.corner::after{left:auto;right:11px}' +
      '.dsh-sb-shell [data-sb] .sb-card.dragging{animation:none;cursor:grabbing}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-card-head{cursor:grab;touch-action:none}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-card-head:active{cursor:grabbing}' +
      '.dsh-sb-shell [data-sb] .sb-card .dsh-sb-card-head{font-size:9.5px;letter-spacing:.7px;text-transform:uppercase;color:rgba(150,170,190,.85);margin-bottom:5px}' +
      /* ---- pixel mode: low-frame, low-paint ------------------------------
         For RDP and other software-rendered sessions. The strip keeps moving,
         but it moves like an 8-bit sprite: quantised steps instead of a smooth
         sweep, no glow shadows to re-rasterise, and no full-surface breathing. */
      '.dsh-sb-shell [data-sb][data-sb-pixel]{animation:none!important;box-shadow:inset 0 0 18px rgba(var(--sb-glow),.12)!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flow i{box-shadow:none!important;border-radius:1px;width:5px;height:5px;animation-timing-function:steps(8,end)!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flow i:nth-child(even){background:var(--sb-accent2);border-radius:1px}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flow-gear{text-shadow:none}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-wave .sb-wave-scroll{animation-timing-function:steps(8,end)!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-wave .sb-wave-front{filter:none}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-step{animation-timing-function:steps(4,end)!important;box-shadow:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-io .sb-out-arrow{animation-timing-function:steps(2,end)!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-io .sb-out-arrow,.dsh-sb-shell [data-sb][data-sb-pixel] .sb-io .sb-in-arrow{text-shadow:none}' +
      '.dsh-sb-shell [data-sb][data-sb-lite] .sb-io .sb-out-arrow{animation:none;text-shadow:none}' +
      '.dsh-sb-shell [data-sb][data-sb-lite] .sb-io .sb-in-arrow{text-shadow:none}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-whale .sb-whale-swim,.dsh-sb-shell [data-sb][data-sb-pixel] .sb-whale .sb-whale-dive{animation-timing-function:steps(6,end)!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-whale .sb-whale-body,.dsh-sb-shell [data-sb][data-sb-lite] .sb-whale .sb-whale-body{filter:none}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-traffic .sb-car-run{animation-timing-function:steps(8,end)!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-traffic .sb-car-light,.dsh-sb-shell [data-sb][data-sb-lite] .sb-traffic .sb-car-light{filter:none}' +
      '.dsh-sb-shell [data-sb][data-sb-lite] .sb-wave .sb-wave-front{filter:none}' +
      '.dsh-sb-shell [data-sb][data-sb-lite] .sb-step.done{box-shadow:none}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flower,' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-dots i,' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-zzz i{animation-timing-function:steps(4,end)!important;text-shadow:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-status{text-shadow:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-splash{display:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel][data-sb-hover]{filter:none!important}' +
      /* ---- floating layer ---------------------------------------------------
         The card is portal-ed onto <body>. Inside the composer dock it could
         not win: the compose box paints in a later stacking context (and the
         dock's ancestors are free to clip), so an inline card sat behind the
         textarea and flickered as the composer repainted over it.

         The layer is a fixed stand-in for the strip's own box - same rectangle,
         same offsets - so `.sb-card { left:12px; bottom:calc(100% + 8px) }` and
         its corner variant keep resolving against the strip they point at, with
         no second set of numbers to keep in sync. It carries the same
         data-sb* attributes the strip does, so the palette variables and the
         pixel/lite overrides reach the card through the same selectors; the
         ghost only has to stop looking like a strip. */
      '.dsh-sb-portal{pointer-events:none;margin:0!important;border:0!important;background:none!important;box-shadow:none!important}' +
      '.dsh-sb-portal>.dsh-sb-ghost{display:block;width:100%;height:100%;max-width:none;margin:0;padding:0;border:0;border-radius:0;background:none!important;box-shadow:none!important;animation:none!important}' +
      /* ---- DSH's own context meter -----------------------------------------
         The ring and percentage the shipped composer draws after this slot.
         Inert until told otherwise: set --dsh-sb-ctx to any CSS colour on an
         ancestor (or :root) and both the reading and the arc take it;
         --dsh-sb-ctx-hover covers the hover / expanded state. Unset, these
         rules resolve to the exact tokens the shipped meter already uses.
         Selector is structural on purpose — the shipped class hash changes
         between builds, but [data-composer-dock] and the 14px ring do not. */
      '[data-composer-dock]>span:has(>button>svg[viewBox="0 0 14 14"])>button{color:var(--dsh-sb-ctx,var(--dsw-alias-label-tertiary))}' +
      '[data-composer-dock]>span:has(>button>svg[viewBox="0 0 14 14"])>button>svg>circle+circle{stroke:var(--dsh-sb-ctx,var(--dsw-alias-label-tertiary))}' +
      '[data-composer-dock]>span:has(>button>svg[viewBox="0 0 14 14"])>button:hover,' +
      '[data-composer-dock]>span:has(>button>svg[viewBox="0 0 14 14"])>button[aria-expanded="true"]{color:var(--dsh-sb-ctx-hover,var(--dsh-sb-ctx,var(--dsw-alias-label-secondary)))}' +
      '@media (prefers-reduced-motion:reduce){.dsh-sb-shell [data-sb]{animation:none!important}}' +
      /* ---- settings page ----------------------------------------------------
         Uses the host's own tokens so it belongs in Settings, and keeps the
         preview in the strip's own language. Nothing here is scoped to
         `.dsh-sb-shell`: the page is not inside the dock. */
      '.dsh-sb-settings{display:flex;flex-direction:column;gap:14px;max-width:760px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}' +
      '.dsh-sb-settings .sb-set-title{margin:0;font-size:15px;font-weight:600}' +
      '.dsh-sb-settings .sb-set-intro{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px}' +
      '.dsh-sb-settings .sb-set-preview{margin:2px 0 4px;pointer-events:none}' +
      '.dsh-sb-settings .sb-set-group{display:flex;flex-direction:column;gap:8px;padding:12px 0 0;border-top:.5px solid var(--dsw-alias-border-l2)}' +
      '.dsh-sb-settings .sb-set-group-title{font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}' +
      '.dsh-sb-settings .sb-set-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
      '.dsh-sb-settings .sb-set-label{flex:0 0 96px;color:var(--dsw-alias-label-secondary);font-size:12px}' +
      '.dsh-sb-settings .sb-set-choices,.dsh-sb-settings .sb-set-stepper,.dsh-sb-settings .sb-set-swatches{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}' +
      '.dsh-sb-settings .sb-set-choice{appearance:none;padding:3px 10px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1.5;cursor:pointer}' +
      '.dsh-sb-settings .sb-set-choice[data-on]{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent)}' +
      '@media (hover:hover){.dsh-sb-settings .sb-set-choice:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-tertiary)}}' +
      '.dsh-sb-settings .sb-set-choice:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}' +
      '.dsh-sb-settings .sb-set-stepper .sb-set-choice{min-width:26px;padding:2px 0;text-align:center;font-variant-numeric:tabular-nums}' +
      '.dsh-sb-settings .sb-set-value{min-width:52px;text-align:center;font-variant-numeric:tabular-nums;font-size:12px}' +
      '.dsh-sb-settings .sb-set-swatch{width:20px;height:20px;padding:0;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);cursor:pointer;transition:transform .12s ease,border-color .15s ease}' +
      '.dsh-sb-settings .sb-set-swatch.on{border:2px solid var(--dsw-alias-label-primary);transform:scale(1.1)}' +
      '@media (hover:hover){.dsh-sb-settings .sb-set-swatch:hover{transform:scale(1.15)}}' +
      '.dsh-sb-settings .sb-set-swatch:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}' +
      '.dsh-sb-settings .sb-set-foot{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:10px;border-top:.5px solid var(--dsw-alias-border-l2)}' +
      '.dsh-sb-settings .sb-set-hint{color:var(--dsw-alias-label-tertiary);font-size:11px}';

    const GLYPHS = ['\u273B', '\u273D', '\u2736', '\u2733', '\u2722', '\u00B7'];

    /* The spinner vocabulary, verbatim from Claude Code's own array — 187 words
       pulled out of the shipped binary. The terminal picks one per session and
       holds it; the strip rotates, which is the only deliberate departure.
       Trailing dots are drawn separately, so no ellipsis belongs in the word. */
    const WORK_VERBS = [
      'Accomplishing', 'Actioning', 'Actualizing', 'Architecting', 'Baking', 'Beaming',
      'Beboppin\'', 'Befuddling', 'Billowing', 'Blanching', 'Bloviating', 'Boogieing',
      'Boondoggling', 'Booping', 'Bootstrapping', 'Brewing', 'Bunning', 'Burrowing',
      'Calculating', 'Canoodling', 'Caramelizing', 'Cascading', 'Catapulting', 'Cerebrating',
      'Channeling', 'Channelling', 'Choreographing', 'Churning', 'Clauding', 'Coalescing',
      'Cogitating', 'Combobulating', 'Composing', 'Computing', 'Concocting', 'Considering',
      'Contemplating', 'Cooking', 'Crafting', 'Creating', 'Crunching', 'Crystallizing',
      'Cultivating', 'Deciphering', 'Deliberating', 'Determining', 'Dilly-dallying', 'Discombobulating',
      'Doing', 'Doodling', 'Drizzling', 'Ebbing', 'Effecting', 'Elucidating',
      'Embellishing', 'Enchanting', 'Envisioning', 'Evaporating', 'Fermenting', 'Fiddle-faddling',
      'Finagling', 'Flamb\u00E9ing', 'Flibbertigibbeting', 'Flowing', 'Flummoxing', 'Fluttering',
      'Forging', 'Forming', 'Frolicking', 'Frosting', 'Gallivanting', 'Galloping',
      'Garnishing', 'Generating', 'Gesticulating', 'Germinating', 'Gitifying', 'Grooving',
      'Gusting', 'Harmonizing', 'Hashing', 'Hatching', 'Herding', 'Honking',
      'Hullaballooing', 'Hyperspacing', 'Ideating', 'Imagining', 'Improvising', 'Incubating',
      'Inferring', 'Infusing', 'Ionizing', 'Jitterbugging', 'Julienning', 'Kneading',
      'Leavening', 'Levitating', 'Lollygagging', 'Manifesting', 'Marinating', 'Meandering',
      'Metamorphosing', 'Misting', 'Moonwalking', 'Moseying', 'Mulling', 'Mustering',
      'Musing', 'Nebulizing', 'Nesting', 'Newspapering', 'Noodling', 'Nucleating',
      'Orbiting', 'Orchestrating', 'Osmosing', 'Perambulating', 'Percolating', 'Perusing',
      'Philosophising', 'Photosynthesizing', 'Pollinating', 'Pondering', 'Pontificating', 'Pouncing',
      'Precipitating', 'Prestidigitating', 'Processing', 'Proofing', 'Propagating', 'Puttering',
      'Puzzling', 'Quantumizing', 'Razzle-dazzling', 'Razzmatazzing', 'Recombobulating', 'Reticulating',
      'Roosting', 'Ruminating', 'Saut\u00E9ing', 'Scampering', 'Schlepping', 'Scurrying',
      'Seasoning', 'Shenaniganing', 'Shimmying', 'Simmering', 'Skedaddling', 'Sketching',
      'Slithering', 'Smooshing', 'Sock-hopping', 'Spelunking', 'Spinning', 'Sprouting',
      'Stewing', 'Sublimating', 'Swirling', 'Swooping', 'Symbioting', 'Synthesizing',
      'Tempering', 'Thinking', 'Thundering', 'Tinkering', 'Tomfoolering', 'Topsy-turvying',
      'Transfiguring', 'Transmuting', 'Twisting', 'Undulating', 'Unfurling', 'Unravelling',
      'Vibing', 'Waddling', 'Wandering', 'Warping', 'Whatchamacalliting', 'Whirlpooling',
      'Whirring', 'Whisking', 'Wibbling', 'Working', 'Wrangling', 'Zesting',
      'Zigzagging',
    ];

    /* A second, much smaller array: the past tenses Claude Code prints when a
       turn ends — `✻ Crunched for 4s`. Eight words, no more. */
    const PAST_VERBS = ['Baked', 'Brewed', 'Churned', 'Cogitated', 'Cooked', 'Crunched', 'Saut\u00E9ed', 'Worked'];

    /* One ECG complex, 32 units wide on a 17-unit-tall baseline, repeated four
       times to span the 128-unit lane: flat, small P bump, deep Q, tall R, deep
       S, T bump, flat. Filled in once at load rather than hand-written. */
    const ECG_PATH = (function () {
      const unit = [
        [0, 8.5], [7, 8.5], [8.5, 7.2], [10, 8.5],
        [13, 8.5], [14, 10.2], [15.5, 2], [17, 15],
        [18.5, 8.5], [20.5, 6.6], [22.5, 8.5], [32, 8.5],
      ];
      const points = [];
      for (let repeat = 0; repeat < 4; repeat += 1) {
        for (let index = 0; index < unit.length; index += 1) {
          points.push((unit[index][0] + repeat * 32) + ',' + unit[index][1]);
        }
      }
      return points.join(' ');
    })();
    /* One wave on a 20-unit-tall box: two mirrored quadratic humps make a
       64-unit period. Three things matter and all are load-bearing:

       - each hump leaves and enters with the same tangent (control offset
         `16, -9` in, `16, -9` out), so tiling the period leaves no kink;
       - the scroll travels exactly one period (64 units), so the loop lands
         back on an identical frame instead of jumping;
       - the strip is drawn from -64 to 320 rather than 0 to 256, i.e. with a
         whole period of run-up off-canvas on the left and to spare on the
         right. The water travels rightward like the beads and the pulse do, and
         without that overhang a rightward scroll would expose a gap at the
         leading edge.

       The fill closes down to y=22 and back so the silhouette reads as water
       rather than a line. */
    const WAVE_PATH = (function () {
      const period = 64;
      const from = -period;
      const to = 320;
      const segments = ['M' + from + ' 12'];
      for (let x = from; x < to; x += period) {
        segments.push('q' + period / 4 + ' -9 ' + period / 2 + ' 0');
        segments.push('q' + period / 4 + ' 9 ' + period / 2 + ' 0');
      }
      segments.push('L' + to + ' 22 L' + from + ' 22 Z');
      return segments.join(' ');
    })();
    /* Lane speeds. The wave uses the same tok/s formula as the beads; idle is a
       slow swell rather than a crawl, because a wave that stops reads as a bug. */
    const WAVE_IDLE_SECONDS = 9;
    /* Highway divider: dashes every 32 units on the 256-unit road, which is the
       same spacing the water uses for its crests. Built once, not per render. */
    const ROAD_DASHES = (function () {
      const out = [];
      for (let x = 4; x < 256; x += 32) out.push(x);
      return out;
    })();

    const IDLE_PHRASES = [
      'waiting to cogitate',
      'dozing in latent space',
      'in the ether',
      'half awake',
      'dreaming of gradients',
      'standing by',
    ];

    /* Idle is a sleeping animal, not a screensaver: the phrase lands about
       every second breath and the glyph steps ~2x slower. Working stays brisk
       — there the motion is the only visible signal that tokens are moving. */
    const PHRASE_MS = { work: 3750, idle: 11000 };
    const GLYPH_MS = { work: 130, idle: 700 };
    /* Pixel mode quantises both to a low frame rate; its idle step is slower
       still, because a stepped morph reads as judder when it runs fast. */
    const GLYPH_MS_PIXEL = { work: 320, idle: 900 };
    /* How long the turn-end word stays up before the strip drops back to idle. */
    const DONE_MS = 6000;
    /* Shorter than this is not a turn worth naming — a misfire or a keystroke. */
    const DONE_MIN_MS = 800;

    const THEMES = [
      { id: 'deepseek', dot: '#4d6bfe', label: 'deepseek' },
      { id: 'cyan', dot: '#00e5ff', label: 'amoled cyan' },
      { id: 'green', dot: '#00e676', label: 'matrix' },
      { id: 'matrix', dot: '#00ff6a', label: 'hacker' },
      { id: 'magenta', dot: '#ff2d95', label: 'neon pink' },
      { id: 'violet', dot: '#b026ff', label: 'ultraviolet' },
      { id: 'amber', dot: '#ffb300', label: 'solar' },
      { id: 'ice', dot: '#8ad8ff', label: 'ice' },
      { id: 'blood', dot: '#ff1744', label: 'blood' },
      { id: 'cyberpunk', dot: '#fcee0a', label: 'cyberpunk' },
      { id: 'cyberwar', dot: '#ff2b2b', label: 'cyberwar' },
      { id: 'superblack', dot: '#ffffff', label: 'super black' },
    ];
    const THEME_IDS = THEMES.map((theme) => theme.id);

    const STORE_THEME = 'dsh.statusbar.theme';
    const STORE_FX = 'dsh.statusbar.fx';
    const STORE_PIXEL = 'dsh.statusbar.pixel';
    const STORE_FLOW = 'dsh.statusbar.flow';
    const STORE_ANCHOR = 'dsh.statusbar.anchor';
    const STORE_WIDTH = 'dsh.statusbar.width';
    const STORE_HEIGHT = 'dsh.statusbar.height';

    /* Size steppers. The strip is capped at 980px by the shell so it lines up
       with the conversation column; `full` drops the cap for readers who want
       the line to run edge to edge. Height is the bar's vertical padding - the
       only honest way to make a flex row taller without changing its type.
       The narrowest step stops at 900 rather than shrinking to nothing: the row
       is `flex-wrap:nowrap` (one line is the whole idea) and the status slot is a
       fixed 27ch, so a genuinely narrow strip would spill its own contents. */
    const WIDTH_STEPS = [900, 980, 1120, 1280, 1500, 'full'];
    const HEIGHT_STEPS = [2, 4, 6, 9, 12, 16, 20];
    const WIDTH_DEFAULT = 1;
    const HEIGHT_DEFAULT = 2;

    /* Where the card hangs off the strip. `above` is the original: left edges
       aligned, sitting over the strip. `corner` drops the card's bottom-right
       corner onto the strip's top-left corner, so it grows up and to the left
       like a menu pinned to that corner. */
    const ANCHOR_ABOVE = 'above';
    const ANCHOR_CORNER = 'corner';
    const CARD_W = 300;

    /* Flow lanes. `beads` is the original travelling-particle line; `ecg` is a
       flat heartbeat trace with one bright pulse sweeping it; `wave` is two
       layered water silhouettes scrolling by one wavelength per cycle. All three
       read the same live token rate, so the lane's speed always means the same
       thing whichever skin is on. */
    const FLOW_BEADS = 'beads';
    const FLOW_ECG = 'ecg';
    const FLOW_WAVE = 'wave';
    const FLOW_WHALE = 'whale';
    const FLOW_TRAFFIC = 'traffic';
    const FLOW_ORDER = [FLOW_BEADS, FLOW_ECG, FLOW_WAVE, FLOW_WHALE, FLOW_TRAFFIC];

    /* Lane copy, keyed by the lane itself: one table instead of a ternary chain
       in three places (title, button label, next-lane tooltip). */
    const FLOW_TEXT = {
      [FLOW_BEADS]: {
        busy: 'flow.busy',
        idle: 'flow.idle',
        label: 'flowmode.beads',
        title: 'flowmode.title.beads',
      },
      [FLOW_ECG]: {
        busy: 'flow.ecg.busy',
        idle: 'flow.ecg.idle',
        label: 'flowmode.ecg',
        title: 'flowmode.title.ecg',
      },
      [FLOW_WAVE]: {
        busy: 'flow.wave.busy',
        idle: 'flow.wave.idle',
        label: 'flowmode.wave',
        title: 'flowmode.title.wave',
      },
      [FLOW_WHALE]: {
        busy: 'flow.whale.busy',
        idle: 'flow.whale.idle',
        label: 'flowmode.whale',
        title: 'flowmode.title.whale',
      },
      [FLOW_TRAFFIC]: {
        busy: 'flow.traffic.busy',
        idle: 'flow.traffic.idle',
        label: 'flowmode.traffic',
        title: 'flowmode.title.traffic',
      },
    };
    const flowText = (mode) => FLOW_TEXT[mode] || FLOW_TEXT[FLOW_BEADS];

    /** Smooth mode draws 8 beads; pixel mode halves the nodes it has to paint. */
    const BEADS_SMOOTH = 8;
    const BEADS_PIXEL = 4;

    function readStored(key, fallback, allowed) {
      try {
        const raw = window.localStorage.getItem(key);
        if (typeof raw === 'string' && (allowed === undefined || allowed.indexOf(raw) >= 0)) return raw;
      } catch (error) {
        /* private mode or a blocked origin */
      }
      return fallback;
    }
    function writeStored(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        /* quota or blocked storage: the choice simply does not persist */
      }
    }

    /* One channel for "a setting changed somewhere else".
       The strip reads its preferences from storage once, at mount; the settings
       page writes them. Without a signal the open strip would keep the old theme
       until a reload. The event only means "re-read the known keys" - it carries
       no payload, so it cannot desync from the storage names. */
    const SETTINGS_EVENT = 'dsh-statusbar:settings';
    function announceSettings() {
      try {
        window.dispatchEvent(new Event(SETTINGS_EVENT));
      } catch (error) {
        /* no window: the strip will pick the value up on its next mount */
      }
    }
    function announceLater() {
      window.setTimeout(announceSettings, 0);
    }
    /** Step indexes are stored as strings; anything out of range falls back. */
    function readStoredIndex(key, fallback, length) {
      const stored = Number(readStored(key, String(fallback)));
      return Number.isInteger(stored) && stored >= 0 && stored < length ? stored : fallback;
    }

    /** Reduced-motion is the sane default for pixel mode. */
    function prefersReduced() {
      try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (error) {
        return false;
      }
    }

    function readRunning(raw, sessionId) {
      if (raw === undefined || raw === null) return null;
      let entry = raw;
      if (typeof raw.get === 'function') entry = raw.get(sessionId);
      if (entry === undefined || entry === null) return null;
      if (typeof entry === 'boolean') return entry;
      if (typeof entry === 'object' && 'running' in entry) return entry.running === true;
      return null;
    }

    function isFace(value) {
      return value !== null && typeof value === 'object' && typeof value.getSnapshot === 'function' && typeof value.subscribe === 'function';
    }

    /**
     * Subscribe to one session projection.
     *
     * `useProjection(key)` hands back either the published value or the face
     * store for it; both shapes are accepted. The subscription is keyed on the
     * projection name rather than the face object, so a face rebuilt per render
     * cannot churn the subscription.
     */
    function useFaceValue(hook, key) {
      const face = typeof hook === 'function' ? hook(key) : undefined;
      const faceRef = React.useRef(face);
      faceRef.current = face;
      const [published, setPublished] = React.useState(undefined);
      React.useEffect(() => {
        const current = faceRef.current;
        if (!isFace(current)) return undefined;
        let alive = true;
        const read = () => {
          if (alive) setPublished(current.getSnapshot());
        };
        read();
        const dispose = current.subscribe(read);
        return () => {
          alive = false;
          if (typeof dispose === 'function') dispose();
        };
      }, [key]);
      return isFace(face) ? published : face;
    }

    function num(value) {
      return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    }

    /* ---- the live model ---------------------------------------------------
       `modelSelection` is the durable projection the harness's own model
       selector reads: `{ next, lastUsed }`, each a `{ provider, model,
       reasoningEffort? }`. `next` is what the session will run, `lastUsed` what
       it ran last, so the pair covers a blank session and a settled one. */
    function readSelection(raw) {
      if (raw === null || typeof raw !== 'object') return null;
      const candidate = raw.next || raw.lastUsed;
      if (candidate === null || typeof candidate !== 'object') return null;
      if (typeof candidate.model !== 'string' || candidate.model.length === 0) return null;
      return {
        provider: typeof candidate.provider === 'string' ? candidate.provider : '',
        model: candidate.model,
        effort: typeof candidate.reasoningEffort === 'string' ? candidate.reasoningEffort : '',
      };
    }

    /**
     * Which family mark to draw. The harness ships no provider artwork, so these
     * are original geometric marks keyed by the model's family - a hint, not a
     * vendor logo, and every one of them inherits the strip's text colour so it
     * follows the palette like the rest of the chrome.
     */
    function modelFamily(selection) {
      const text = (selection.provider + ' ' + selection.model).toLowerCase();
      if (/deepseek/.test(text)) return 'deepseek';
      if (/claude|anthropic/.test(text)) return 'claude';
      if (/gpt|openai|^o[134]\b/.test(text)) return 'openai';
      if (/gemini|google|gemma/.test(text)) return 'gemini';
      if (/llama|meta/.test(text)) return 'llama';
      if (/mistral|codestral/.test(text)) return 'mistral';
      if (/qwen|tongyi/.test(text)) return 'qwen';
      if (/kimi|moonshot/.test(text)) return 'moonshot';
      if (/grok|xai/.test(text)) return 'grok';
      return 'unknown';
    }

    function providerMark(family) {
      const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' };
      const solid = { fill: 'currentColor', stroke: 'none' };
      const shape = (tag, props) => h(tag, Object.assign({ key: tag + (props.d || props.cx || '') }, props));
      const body = {
        deepseek: [
          shape('path', Object.assign({ d: 'M1.2 7.2c1.6-2.6 3.4-2.6 4.6-.9s2.9 1.8 4-1' }, stroke)),
          shape('path', Object.assign({ d: 'M1.2 10.4c1.6-2.6 3.4-2.6 4.6-.9s2.9 1.8 4-1' }, stroke)),
          shape('circle', Object.assign({ cx: 6, cy: 3.1, r: 1.1 }, solid)),
        ],
        claude: [shape('path', Object.assign({ d: 'M6 1v10M1 6h10M2.5 2.5l7 7M9.5 2.5l-7 7' }, stroke))],
        openai: [
          shape('path', Object.assign({ d: 'M6 1.1 10.1 3.5v4.9L6 10.9 1.9 8.4V3.5z' }, stroke)),
          shape('circle', Object.assign({ cx: 6, cy: 6, r: 1.5 }, solid)),
        ],
        gemini: [shape('path', Object.assign({ d: 'M6 .9 7.7 4.3 11.1 6 7.7 7.7 6 11.1 4.3 7.7.9 6 4.3 4.3z' }, solid))],
        llama: [
          shape('circle', Object.assign({ cx: 4.3, cy: 6, r: 2.7 }, stroke)),
          shape('circle', Object.assign({ cx: 7.7, cy: 6, r: 2.7 }, stroke)),
        ],
        mistral: [
          shape('rect', Object.assign({ x: 1.6, y: 2.2, width: 1.6, height: 7.6, rx: 0.8 }, solid)),
          shape('rect', Object.assign({ x: 5.2, y: 1.2, width: 1.6, height: 9.6, rx: 0.8 }, solid)),
          shape('rect', Object.assign({ x: 8.8, y: 3.6, width: 1.6, height: 4.8, rx: 0.8 }, solid)),
        ],
        qwen: [
          shape('path', Object.assign({ d: 'M6 1.2 10.2 3.6v4.8L6 10.8 1.8 8.4V3.6z' }, stroke)),
          shape('circle', Object.assign({ cx: 6, cy: 6, r: 0.9 }, solid)),
        ],
        moonshot: [shape('path', Object.assign({ d: 'M7.6 1.1a5.1 5.1 0 1 0 .1 9.9 4.1 4.1 0 0 1-.1-9.9z' }, solid))],
        grok: [shape('path', Object.assign({ d: 'M2.4 2.4 9.6 9.6M9.6 2.4 2.4 9.6' }, stroke))],
        unknown: [
          shape('rect', Object.assign({ x: 2, y: 2, width: 8, height: 8, rx: 2.2 }, stroke)),
          shape('circle', Object.assign({ cx: 6, cy: 6, r: 1.1 }, solid)),
        ],
      }[family] || [];
      return h(
        'svg',
        { className: 'sb-mark', viewBox: '0 0 12 12', 'aria-hidden': true, focusable: 'false' },
        body,
      );
    }

    /* ---- the step boxes ---------------------------------------------------
       `todos` is the same projection the harness's own checklist dock reads:
       `[{ content, status: 'pending' | 'in_progress' | 'completed' }]`. The
       strip mirrors it as boxes rather than text, so the shape of the work is
       readable without reading the list again. */
    const STEPS_MAX = 10;
    function readSteps(raw) {
      return Array.isArray(raw) ? raw.filter((item) => item !== null && typeof item === 'object' && typeof item.status === 'string') : [];
    }
    function stepTone(status) {
      if (status === 'completed') return 'done';
      if (status === 'in_progress') return 'active';
      return 'pending';
    }

    /** 3821456 → "3.8M", 42100 → "42.1k", 820 → "820". */
    function compact(value) {
      const n = num(value);
      if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
      return String(Math.round(n));
    }

    /** Milliseconds → "38s", "4m", "1h 12m". */
    function duration(ms) {
      const total = Math.max(0, Math.round(num(ms) / 1000));
      if (total < 60) return total + 's';
      const minutes = Math.floor(total / 60);
      if (minutes < 60) return minutes + 'm';
      return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
    }

    /** Turn length the way Claude Code prints it: "4s", "1m 4s" — seconds never
     *  dropped once a minute is in play. */
    function turnDuration(ms) {
      const total = Math.max(0, Math.round(num(ms) / 1000));
      if (total < 60) return total + 's';
      return Math.floor(total / 60) + 'm ' + (total % 60) + 's';
    }

    /**
     * Semantic colors never theme: a warning that recolors itself to match the
     * palette stops being a warning.
     */
    function cacheTone(percent) {
      if (percent >= 80) return 'sb-ok';
      if (percent >= 40) return 'dsh-sb-dim';
      if (percent >= 15) return 'sb-warn';
      return 'sb-bad';
    }
    function contextTone(percent) {
      if (percent >= 90) return 'sb-bad';
      if (percent >= 75) return 'sb-warn';
      return 'dsh-sb-dim';
    }

    class Guard extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error: error };
      }
      componentDidCatch() {
        /* The fallback carries the message in its title. */
      }
      render() {
        if (this.state.error !== null) return this.props.fallback(this.state.error);
        return this.props.children;
      }
    }

    /** Only shown if the live render throws; a blank dock cell would be silent. */
    function renderFallback(error) {
      const message = error instanceof Error ? error.message : String(error);
      return h(
        'div',
        { className: 'dsh-sb-shell' },
        h(
          'div',
          { 'data-sb': '', 'data-sb-theme': 'deepseek', 'data-sb-state': 'idle', 'data-sb-lite': '', title: message },
          h('div', { className: 'sb-group' }, h('span', { className: 'sb-flower idle' }, '\u25CC'), h('span', null, 'status bar unavailable')),
        ),
      );
    }

    function StatusBar(props) {
      return h(Guard, { fallback: renderFallback }, h(Bar, props));
    }

    /** The dock cell that carries the whole strip. */
    function Bar(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;

      const statusHook = props.useSessionStatus;
      const identity = React.useCallback((value) => value, []);
      const realWorking = readRunning(typeof statusHook === 'function' ? statusHook(identity) : null, props.sessionId) === true;

      /* One guarded door to the projection table. A host that does not publish a
         key, or a projection that throws while the session is mid-teardown, must
         cost that one figure rather than the whole strip: the hook itself is
         always called, only the lookup is caught. */
      const projectionHook = (key) => {
        try {
          return typeof props.useProjection === 'function' ? props.useProjection(key) : undefined;
        } catch (error) {
          return undefined;
        }
      };

      const stats = useFaceValue(projectionHook, 'sessionStats');
      const usage = useFaceValue(projectionHook, 'tokenUsage');
      const pressure = useFaceValue(projectionHook, 'contextPressure');
      const breakdown = useFaceValue(projectionHook, 'contextBreakdown');
      /* The two faces the strip names instead of counting: which model this
         session runs, and what the agent's own checklist currently says. Both
         are optional - a host without them gets the plain brand chip and no
         boxes, never a blank or a crash. */
      const modelFace = useFaceValue(projectionHook, 'modelSelection');
      const todoFace = useFaceValue(projectionHook, 'todos');

      const [theme, setTheme] = React.useState(() => readStored(STORE_THEME, 'deepseek', THEME_IDS));
      const [lite, setLite] = React.useState(() => readStored(STORE_FX, 'off') === 'on');
      const [pixel, setPixel] = React.useState(() => readStored(STORE_PIXEL, prefersReduced() ? 'on' : 'off') === 'on');
      const [flowMode, setFlowMode] = React.useState(() => readStored(STORE_FLOW, FLOW_BEADS, FLOW_ORDER));
      const [hover, setHover] = React.useState(false);
      const [cardOpen, setCardOpen] = React.useState(false);
      const [pinned, setPinned] = React.useState(false);
      const [phrase, setPhrase] = React.useState(0);
      const [glyph, setGlyph] = React.useState(0);
      const [done, setDone] = React.useState(null);
      const [anchor, setAnchor] = React.useState(() =>
        readStored(STORE_ANCHOR, ANCHOR_ABOVE, [ANCHOR_ABOVE, ANCHOR_CORNER]),
      );
      /* Corner mode needs a card's worth of room to the left of the strip, which
         only exists on a wide window. Measured once per opening rather than per
         render - the strip repaints several times a second. */
      const [cornerOk, setCornerOk] = React.useState(true);
      const [drag, setDrag] = React.useState(null);
      const [dragging, setDragging] = React.useState(false);
      /* Rehearsal. A live turn is the only thing that can normally make the strip
         breathe, so a reader who just wants to look at the motion has to send a
         prompt and pay for it. This flag injects the *working* state instead:
         same verbs, same glyph, same lane, same breathing, no model involved.
         Deliberately not persisted - a reload should never come back pretending
         to work. */
      const [demo, setDemo] = React.useState(false);
      /* The strip's box, as measured when the card opens. Null until the first
         measurement - the card falls back to its in-place rendering for that
         one frame rather than vanishing. Appended last so the state slots above
         keep the order the render test asserts against. */
      const [cardBox, setCardBox] = React.useState(null);
      /* Size steppers, persisted as the step index rather than the pixel value
         so the preset list can grow without stranding a stored width. */
      const [widthStep, setWidthStep] = React.useState(() => readStoredIndex(STORE_WIDTH, WIDTH_DEFAULT, WIDTH_STEPS.length));
      const [heightStep, setHeightStep] = React.useState(() => readStoredIndex(STORE_HEIGHT, HEIGHT_DEFAULT, HEIGHT_STEPS.length));
      const working = realWorking || demo;

      const barRef = React.useRef(null);
      const splashRef = React.useRef(null);
      const cardRef = React.useRef(null);
      const boxRef = React.useRef(null);
      const dragRef = React.useRef(null);
      const closeTimer = React.useRef(0);
      const workStart = React.useRef(0);
      const doneTimer = React.useRef(0);

      /* The settings page writes the same storage keys the strip reads at mount.
         Re-read every one of them when it says so, which is what makes a theme
         or a size change land on the strip that is already on screen instead of
         after a reload. */
      React.useEffect(() => {
        const sync = () => {
          setTheme(readStored(STORE_THEME, 'deepseek', THEME_IDS));
          setLite(readStored(STORE_FX, 'off') === 'on');
          setPixel(readStored(STORE_PIXEL, prefersReduced() ? 'on' : 'off') === 'on');
          setFlowMode(readStored(STORE_FLOW, FLOW_BEADS, FLOW_ORDER));
          setAnchor(readStored(STORE_ANCHOR, ANCHOR_ABOVE, [ANCHOR_ABOVE, ANCHOR_CORNER]));
          setWidthStep(readStoredIndex(STORE_WIDTH, WIDTH_DEFAULT, WIDTH_STEPS.length));
          setHeightStep(readStoredIndex(STORE_HEIGHT, HEIGHT_DEFAULT, HEIGHT_STEPS.length));
        };
        window.addEventListener(SETTINGS_EVENT, sync);
        return () => window.removeEventListener(SETTINGS_EVENT, sync);
      }, []);

      React.useEffect(() => {
        const phraseTimer = window.setInterval(
          () => setPhrase((n) => n + 1),
          working ? PHRASE_MS.work : PHRASE_MS.idle,
        );
        /* Pixel mode morphs the glyph like a sprite: fewer frames, and each
           tick costs a React render of the whole strip. */
        const glyphMs = pixel
          ? working
            ? GLYPH_MS_PIXEL.work
            : GLYPH_MS_PIXEL.idle
          : working
            ? GLYPH_MS.work
            : GLYPH_MS.idle;
        const glyphTimer = window.setInterval(
          () => setGlyph((n) => (n + 1) % GLYPHS.length),
          glyphMs,
        );
        return () => {
          window.clearInterval(phraseTimer);
          window.clearInterval(glyphTimer);
        };
      }, [working, pixel]);

      /* The turn-end word, borrowed from Claude Code's past-tense line: mark when
         work starts, spend the mark when it stops, hold the result for a beat,
         then fall back to idle. Busy edges are the only signal used — the same
         session-status stream that drives the breath. */
      React.useEffect(() => {
        if (working) {
          workStart.current = Date.now();
          window.clearTimeout(doneTimer.current);
          setDone(null);
          return;
        }
        if (workStart.current === 0) return;
        const spent = Date.now() - workStart.current;
        workStart.current = 0;
        if (spent < DONE_MIN_MS) return;
        setDone({ word: PAST_VERBS[Math.floor(Math.random() * PAST_VERBS.length)], ms: spent });
        window.clearTimeout(doneTimer.current);
        doneTimer.current = window.setTimeout(() => setDone(null), DONE_MS);
      }, [working]);

      /* A real turn outranks the rehearsal: the moment one starts, the demo drops
         and the clock restarts, so the word at the end describes the turn the
         model actually ran rather than the practice run in front of it. */
      React.useEffect(() => {
        if (!demo || !realWorking) return;
        setDemo(false);
        workStart.current = Date.now();
      }, [demo, realWorking]);

      /* Corner mode is only honest while there is somewhere for the card to go:
         it grows leftwards, so it needs its own width plus a margin between the
         window edge and the strip's left edge. The same measurement seats the
         floating layer over the strip's box - one read of the strip serves
         both, and it is taken on open and on any move rather than per render,
         because the strip repaints several times a second. */
      const measureCard = React.useCallback(() => {
        const bar = barRef.current;
        if (bar === null) return;
        const rect = bar.getBoundingClientRect();
        setCornerOk(rect.left >= CARD_W + 16);
        const next = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        const last = boxRef.current;
        /* The scroll listener fires in bursts; re-seating the layer on an
           identical rectangle would just re-render the strip for nothing. */
        if (
          last !== null &&
          Math.abs(last.left - next.left) < 0.5 &&
          Math.abs(last.top - next.top) < 0.5 &&
          Math.abs(last.width - next.width) < 0.5 &&
          Math.abs(last.height - next.height) < 0.5
        ) {
          return;
        }
        boxRef.current = next;
        setCardBox(next);
      }, []);

      React.useEffect(() => {
        if (!cardOpen) return () => {};
        measureCard();
        const follow = () => measureCard();
        window.addEventListener('resize', follow);
        window.addEventListener('scroll', follow, true);
        /* The dock moves without the window resizing: the compose box grows as
           it is typed into and pushes the strip down. A size observer on the
           strip's own container catches that, and costs nothing until it
           happens. Deliberately not a per-frame poll - a pinned card can sit
           open for minutes and this runs in software-rendered sessions too. */
        let observer = null;
        const shell = barRef.current === null ? null : barRef.current.parentElement;
        if (shell !== null && typeof ResizeObserver === 'function') {
          observer = new ResizeObserver(follow);
          observer.observe(shell);
          if (shell.parentElement !== null) observer.observe(shell.parentElement);
        }
        return () => {
          window.removeEventListener('resize', follow);
          window.removeEventListener('scroll', follow, true);
          if (observer !== null) observer.disconnect();
        };
      }, [cardOpen, measureCard]);

      /* Dragging lives on the header. The window is listened to instead of the
         card so a fast pointer that outruns the repaint does not drop the
         gesture, and the card is pinned for its duration so its own mouse-leave
         cannot close it mid-drag. Offsets are clamped against the measured,
         untransformed box, so they never creep. */
      React.useEffect(() => {
        if (!dragging) return () => {};
        const move = (event) => {
          const base = dragRef.current;
          if (base === null) return;
          const loX = 6 - base.left0;
          const hiX = window.innerWidth - 6 - base.left0 - base.w;
          const loY = 6 - base.top0;
          const hiY = window.innerHeight - 6 - base.top0 - base.h;
          const clamp = (value, lo, hi) => Math.max(Math.min(lo, hi), Math.min(Math.max(lo, hi), value));
          setDrag({
            dx: clamp(base.dx0 + event.clientX - base.sx, loX, hiX),
            dy: clamp(base.dy0 + event.clientY - base.sy, loY, hiY),
          });
        };
        const stop = () => {
          dragRef.current = null;
          setDragging(false);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
        return () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', stop);
          window.removeEventListener('pointercancel', stop);
        };
      }, [dragging]);

      React.useEffect(
        () => () => {
          window.clearTimeout(closeTimer.current);
          window.clearTimeout(doneTimer.current);
        },
        [],
      );

      /* Each of these persists and then says so, so an open settings page (or a
         second strip) follows the change instead of waiting for a reload. The
         next value is computed out here rather than inside the updater: an
         updater may run twice, and announcing from inside it would double-fire. */
      const chooseTheme = (id) => {
        setTheme(id);
        writeStored(STORE_THEME, id);
        announceSettings();
      };
      const toggleFx = () => {
        const next = !lite;
        setLite(next);
        writeStored(STORE_FX, next ? 'on' : 'off');
        announceSettings();
      };
      const togglePixel = () => {
        const next = !pixel;
        setPixel(next);
        writeStored(STORE_PIXEL, next ? 'on' : 'off');
        announceSettings();
      };
      const toggleFlowMode = () => {
        const next = FLOW_ORDER[(FLOW_ORDER.indexOf(flowMode) + 1) % FLOW_ORDER.length];
        setFlowMode(next);
        writeStored(STORE_FLOW, next);
        announceSettings();
      };

      const openCard = () => {
        window.clearTimeout(closeTimer.current);
        /* Seat the floating layer before the card is allowed to render: a
           measurement taken after the paint would put the card on screen
           in-place for one frame, then teleport it out to the layer. */
        measureCard();
        setCardOpen(true);
      };
      const closeCardSoon = () => {
        if (pinned) return;
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setCardOpen(false), 140);
      };
      /* The X: a pinned card ignores mouse-leave, so closing has to unpin too. */
      const closeCardNow = () => {
        window.clearTimeout(closeTimer.current);
        setPinned(false);
        setCardOpen(false);
      };

      /** Wave at a percentage of the strip. Detached from the pointer so the
          demo can fire it from a button that lives inside the card. */
      const pulseAt = (percent) => {
        if (lite) return;
        const bar = barRef.current;
        const splash = splashRef.current;
        if (bar === null || splash === null) return;
        const rect = bar.getBoundingClientRect();
        if (!rect.width) return;
        const at = Math.max(2, Math.min(98, percent));
        splash.style.setProperty('--sb-sx', at + '%');
        splash.style.setProperty('--sb-x', (at / 100) * rect.width + 'px');
        splash.style.setProperty('--sb-w', rect.width + 'px');
        splash.classList.remove('go');
        void splash.offsetWidth;
        splash.classList.add('go');
      };

      /** Wave: keep the node, flip the class, force a reflow, flip it back on. */
      const fireSplash = (event) => {
        if (lite) return;
        const bar = barRef.current;
        if (bar === null) return;
        const target = event.target;
        if (target && typeof target.closest === 'function' && target.closest('.sb-card')) return;
        const rect = bar.getBoundingClientRect();
        if (!rect.width) return;
        pulseAt(((event.clientX - rect.left) / rect.width) * 100);
      };

      /* Both edges of the demo wave the strip: turning it on shows the entry
         effect, turning it off shows the wave plus the turn-end word. */
      const toggleDemo = () => {
        setDemo((previous) => !previous);
        window.setTimeout(() => pulseAt(58), 0);
      };

      const toggleAnchor = () => {
        const next = anchor === ANCHOR_CORNER ? ANCHOR_ABOVE : ANCHOR_CORNER;
        setAnchor(next);
        writeStored(STORE_ANCHOR, next);
        announceSettings();
      };

      /* Grab the header: record the pointer, the offset it started from, and the
         box as it would sit with no offset at all, which is what the clamps are
         expressed against. */
      const startDrag = (event) => {
        if (event.button !== 0 || event.pointerType === 'touch') return;
        const card = cardRef.current;
        if (card === null) return;
        event.preventDefault();
        const rect = card.getBoundingClientRect();
        const dx0 = drag === null ? 0 : drag.dx;
        const dy0 = drag === null ? 0 : drag.dy;
        dragRef.current = {
          sx: event.clientX,
          sy: event.clientY,
          dx0: dx0,
          dy0: dy0,
          left0: rect.left - dx0,
          top0: rect.top - dy0,
          w: rect.width,
          h: rect.height,
        };
        setPinned(true);
        setDragging(true);
      };
      const resetDrag = () => setDrag(null);

      /* ---- real figures, from the same projections the shipped cells read ---- */
      const turns = num(stats && stats.turns);
      const steps = num(stats && stats.steps);
      const decodeTokens = num(stats && stats.decodeTokens);
      const decodeMs = num(stats && stats.decodeMs);
      const wallMs = num(stats && stats.llmMs) + num(stats && stats.toolMs);
      const rate = decodeMs > 0 ? (decodeTokens / decodeMs) * 1000 : 0;

      const uncachedIn = num(usage && usage.uncachedInputTokens);
      const outTokens = num(usage && usage.outputTokens);
      const cacheRead = num(usage && usage.cacheReadTokens);
      const cacheWrite = num(usage && usage.cacheWriteTokens);
      const billed = uncachedIn + outTokens + cacheRead + cacheWrite;
      const promptSide = uncachedIn + cacheRead + cacheWrite;
      const cachePercent = promptSide > 0 ? Math.round((cacheRead / promptSide) * 100) : null;

      const occupied =
        pressure && typeof pressure.projectedTokens === 'number'
          ? pressure.projectedTokens
          : pressure && typeof pressure.pressureTokens === 'number'
            ? pressure.pressureTokens
            : null;
      const windowSize = pressure && typeof pressure.contextWindow === 'number' ? pressure.contextWindow : null;
      const contextPercent = occupied !== null && windowSize !== null && windowSize > 0 ? Math.min(100, Math.round((occupied / windowSize) * 100)) : null;

      const surfaceTokens = breakdown ? num(breakdown.systemTokens) + num(breakdown.toolsTokens) + num(breakdown.messageTokens) : null;

      /* Working rotates Claude Code's spinner verbs; idle uses the strip's own
         sleeping phrases. A finished turn overrides both for a few seconds. */
      const statusText =
        done !== null
          ? done.word + ' for ' + turnDuration(done.ms)
          : working
            ? WORK_VERBS[phrase % WORK_VERBS.length]
            : IDLE_PHRASES[phrase % IDLE_PHRASES.length];

      /* Load-bearing: 3.2 / (1 + tps/55) clamped; idle barely drifts.
         Pixel mode keeps the lane above a floor so 4 stepped beads still read
         as flow instead of a blur. The demo has no real rate, so it borrows the
         idle-throughput fallback and the lane runs at a believable pace. */
      const tps = working ? (rate > 0 ? rate : 55) : 0;
      const smoothFlow = working ? Math.max(0.5, Math.min(3.2, 3.2 / (1 + tps / 55))) : 10;
      const flowSeconds = pixel ? Math.max(0.9, smoothFlow) : smoothFlow;
      /* The wave reads best a shade slower than the beads: one wavelength taking
         the same time as a bead takes to cross makes the water look hurried. The
         floor matters at very high rates - below about a second per wavelength
         the crests strobe instead of rolling. */
      const waveSeconds = working ? Math.max(1, Math.min(2.6, flowSeconds * 1.15)) : WAVE_IDLE_SECONDS;
      /* The whale crosses once per cycle, and one crossing is one dive. Slower
         than the water on purpose: a whale moving at the wave's rate reads as a
         bug in the animation rather than as a swimmer. */
      const whaleSeconds = working ? Math.max(3.2, Math.min(5.5, flowSeconds * 2.2)) : 12;
      /* Traffic answers the same question the beads do - how fast are tokens
         landing - with cars instead of particles. Faster model, faster road. */
      const trafficSeconds = working ? Math.max(1.6, Math.min(3.4, flowSeconds * 1.2)) : 9;

      /* One label for every place the state is spoken: never claim a turn is
         running when it is only a rehearsal. */
      const stateLabel = demo ? t('state.demo') : working ? t('state.working') : t('state.idle');
      const flowCopy = flowText(flowMode);
      const flowTitle =
        t(working ? flowCopy.busy : flowCopy.idle) +
        (working && rate > 0 ? ' \u00B7 ' + Math.round(rate) + ' tok/s' : '');

      /* ---- who is running, and on what ------------------------------------ */
      const selection = readSelection(modelFace);
      const modelTitle = selection
        ? (selection.provider === '' ? selection.model : selection.provider + '/' + selection.model) +
          (selection.effort === '' ? '' : ' \u00B7 ' + selection.effort)
        : '';

      /* ---- the agent's own checklist, mirrored as boxes -------------------- */
      const todoSteps = readSteps(todoFace);
      const stepsDone = todoSteps.filter((item) => item.status === 'completed').length;
      const stepsTitle =
        todoSteps.length === 0
          ? ''
          : stepsDone + '/' + todoSteps.length + ' \u00B7 ' + todoSteps.map((item) => item.content || '?').join(' \u00B7 ');
      const stepBoxes =
        todoSteps.length === 0
          ? null
          : h(
              'span',
              { className: 'sb-steps', title: stepsTitle, 'aria-label': stepsTitle },
              todoSteps.slice(0, STEPS_MAX).map((item, index) =>
                h('i', {
                  /* Keyed by state as well as position: a box that just turned
                     done is a new node, which is what lets it pop once. */
                  key: index + ':' + item.status,
                  className: 'sb-step ' + stepTone(item.status),
                }),
              ),
              todoSteps.length > STEPS_MAX ? h('b', { className: 'sb-step-more' }, '+' + (todoSteps.length - STEPS_MAX)) : null,
            );

      /* ---- size steppers --------------------------------------------------- */
      const widthValue = WIDTH_STEPS[widthStep];
      const heightValue = HEIGHT_STEPS[heightStep];
      const widthLabel = widthValue === 'full' ? t('size.full') : String(widthValue);
      const stepWidth = (delta) => {
        const next = Math.max(0, Math.min(WIDTH_STEPS.length - 1, widthStep + delta));
        setWidthStep(next);
        writeStored(STORE_WIDTH, String(next));
        announceSettings();
      };
      const stepHeight = (delta) => {
        const next = Math.max(0, Math.min(HEIGHT_STEPS.length - 1, heightStep + delta));
        setHeightStep(next);
        writeStored(STORE_HEIGHT, String(next));
        announceSettings();
      };
      const sizeRow = h(
        'div',
        { className: 'sb-size' },
        h('span', { className: 'sb-tool-k' }, t('size.width')),
        h(
          'button',
          { type: 'button', className: 'sb-mini', title: t('size.narrower'), 'aria-label': t('size.narrower'), onClick: (event) => { event.stopPropagation(); stepWidth(-1); } },
          '\u2212',
        ),
        h('span', { className: 'sb-tool-v' }, widthLabel),
        h(
          'button',
          { type: 'button', className: 'sb-mini', title: t('size.wider'), 'aria-label': t('size.wider'), onClick: (event) => { event.stopPropagation(); stepWidth(1); } },
          '+',
        ),
        h('span', { className: 'sb-tool-k' }, t('size.height')),
        h(
          'button',
          { type: 'button', className: 'sb-mini', title: t('size.shorter'), 'aria-label': t('size.shorter'), onClick: (event) => { event.stopPropagation(); stepHeight(-1); } },
          '\u2212',
        ),
        h('span', { className: 'sb-tool-v' }, String(heightValue)),
        h(
          'button',
          { type: 'button', className: 'sb-mini', title: t('size.taller'), 'aria-label': t('size.taller'), onClick: (event) => { event.stopPropagation(); stepHeight(1); } },
          '+',
        ),
      );

      /* The strip's own size, expressed through the two custom properties the
         vendored stylesheet already reads. Nothing here needs new CSS geometry:
         the card, the lane and the tail all resolve against this box. */
      const barStyle = {
        '--sb-shell-max': widthValue === 'full' ? 'none' : widthValue + 'px',
        '--sb-pad-y': heightValue + 'px',
      };

      /* The chip's label: the model that is running, with a family mark, or the
         old brand text when no model projection is available. */
      const brand = selection
        ? h(
            'span',
            { className: 'dsh-sb-brand', title: modelTitle },
            providerMark(modelFamily(selection)),
            h('span', { className: 'sb-modelname' }, selection.model),
            selection.effort === '' ? null : h('span', { className: 'sb-effort' }, selection.effort),
          )
        : h('span', { className: 'dsh-sb-brand' }, 'DeepSeek Harness');

      /* The lane itself. Four skins, one cell: the strip must not reshuffle
         when the reader cycles them, so every skin is the same 128x17 box.

         The two water skins share one water field; `whale` adds the swimmer
         between the back swell and the front one - so the water passes in front
         of the whale and the dive is hidden by the same fill that draws the
         waves, with no second mask anywhere. */
      const waveLayer = (tone) => h('g', { className: 'sb-wave-amp' }, h('g', { className: 'sb-wave-scroll ' + tone }, h('path', { d: WAVE_PATH })));

      const waterField = (thisWhale) =>
        h(
          'svg',
          { viewBox: '0 0 256 20', preserveAspectRatio: 'none' },
          waveLayer('sb-wave-back'),
          thisWhale,
          waveLayer('sb-wave-front'),
        );

      /* Side view, head right, ~36 x 16 user units: about 18 x 14 CSS px in the
         lane. Big enough to read as a whale, small enough to stay a silhouette. */
      const whale =
        flowMode === FLOW_WHALE
          ? h(
              'g',
              { className: 'sb-whale-swim' },
              h(
                'g',
                { className: 'sb-whale-dive' },
                h(
                  'g',
                  { className: 'sb-whale-body', transform: 'translate(4 1)' },
                  h('path', { className: 'sb-whale-tail', d: 'M11 8.2 L1.2 2.8 C3.4 5.6 3.4 10.8 1.2 13.6 Z' }),
                  h('path', { d: 'M10 8.2 C12.5 4.2 20 2.4 27 3.4 C32.2 4.1 35 6 35.6 8.2 C35 10.3 32.2 12.1 27 12.8 C20 13.8 12.5 12.2 10 8.2 Z' }),
                  h('path', { d: 'M21 11.6 C22.6 13.4 24.8 14.2 26.4 13.6 C24.6 15.2 21.8 14.2 21 11.6 Z' }),
                  h('circle', { className: 'sb-whale-eye', cx: 31, cy: 7, r: 1.1 }),
                  /* The spout only exists during the breach, timed off the same
                     cycle as the dive, so the two cannot drift apart. */
                  h('circle', { className: 'sb-whale-spout', cx: 28.4, cy: 2.6, r: 0.9 }),
                  h('circle', { className: 'sb-whale-spout', cx: 30.2, cy: 1.5, r: 0.7 }),
                  h('circle', { className: 'sb-whale-spout', cx: 26.6, cy: 1.2, r: 0.6 }),
                ),
              ),
            )
          : null;

      /* ---- traffic ---------------------------------------------------------
         The road is the same 128x17 cell seen from above: two lanes, a dashed
         divider, and three cars. Upper lane runs right, lower lane runs left,
         which is what makes it read as a road rather than as particles again.
         Cars carry their lane offset as an SVG transform attribute and their
         motion as a CSS transform on a child group: a CSS transform would
         replace an attribute transform on the same element.

         Each car gets its own duration and a negative delay, so they never
         travel in convoy and the loop never reads as one. */
      const carBody = 'M0 6 C0 3.6 2 2.6 5 2.6 L8 .6 L16 .6 L19 2.6 L23 3.2 C25 3.6 25 5.2 25 6 L25 7 L0 7 Z';
      const car = (laneY, runClass, oncoming) =>
        h(
          'g',
          { className: 'sb-car', transform: 'translate(0 ' + laneY + ')' },
          h(
            'g',
            { className: 'sb-car-run ' + runClass },
            h(
              'g',
              /* The oncoming car faces the other way: mirrored around its own
                 centre, so its headlight is its leading edge. */
              { className: 'sb-car-face', transform: oncoming ? 'translate(25 0) scale(-1 1)' : undefined },
              h('path', { d: carBody }),
              h('circle', { className: 'sb-car-wheel', cx: 6, cy: 7.4, r: 1.8 }),
              h('circle', { className: 'sb-car-wheel', cx: 18, cy: 7.4, r: 1.8 }),
              h('circle', { className: 'sb-car-light', cx: 23, cy: 4.6, r: 1 }),
            ),
          ),
        );
      const trafficField =
        flowMode === FLOW_TRAFFIC
          ? h(
              'svg',
              { viewBox: '0 0 256 20', preserveAspectRatio: 'none' },
              h(
                'g',
                { className: 'sb-road' },
                ROAD_DASHES.map((x) => h('rect', { key: x, x: x, y: 9.4, width: 14, height: 1.2, rx: 0.6 })),
              ),
              car(1, 'sb-run-tight'),
              car(1, 'sb-run-wide'),
              car(10, 'sb-run-back', true),
            )
          : null;

      const lane =
        flowMode === FLOW_ECG
          ? h(
              'span',
              {
                className: 'sb-ecg dsh-sb-flow' + (working ? '' : ' idle'),
                style: { '--sb-flow-dur': flowSeconds.toFixed(2) + 's' },
                title: flowTitle,
                'aria-hidden': true,
              },
              h(
                'svg',
                { viewBox: '0 0 128 17', preserveAspectRatio: 'none' },
                h('polyline', { className: 'sb-ecg-base', points: ECG_PATH }),
                h('polyline', { className: 'sb-ecg-trace', points: ECG_PATH, pathLength: 100 }),
              ),
            )
          : flowMode === FLOW_WAVE
            ? h(
                'span',
                {
                  className: 'sb-wave dsh-sb-flow' + (working ? '' : ' idle'),
                  style: { '--sb-wave-dur': waveSeconds.toFixed(2) + 's' },
                  title: flowTitle,
                  'aria-hidden': true,
                },
                waterField(null),
              )
            : flowMode === FLOW_WHALE
              ? h(
                  'span',
                  {
                    className: 'sb-whale dsh-sb-flow' + (working ? '' : ' idle'),
                    style: { '--sb-whale-dur': whaleSeconds.toFixed(2) + 's' },
                    title: flowTitle,
                    'aria-hidden': true,
                  },
                  waterField(whale),
                )
              : flowMode === FLOW_TRAFFIC
                ? h(
                    'span',
                    {
                      className: 'sb-traffic dsh-sb-flow' + (working ? '' : ' idle'),
                      style: { '--sb-traffic-dur': trafficSeconds.toFixed(2) + 's' },
                      title: flowTitle,
                      'aria-hidden': true,
                    },
                    trafficField,
                  )
                : h(
                  'span',
                  {
                    className: 'sb-flow dsh-sb-flow' + (working ? '' : ' idle'),
                    style: { '--sb-flow-dur': flowSeconds.toFixed(2) + 's' },
                    title: flowTitle,
                    'aria-hidden': true,
                  },
                  h('i', null),
                  h('i', null),
                  h('i', null),
                  h('i', null),
                  pixel ? null : h('i', null),
                  pixel ? null : h('i', null),
                  pixel ? null : h('i', null),
                  pixel ? null : h('i', null),
                  h('span', { className: 'sb-flow-gear' }, '\u2699'),
                );


      const cacheBlocks = cachePercent === null ? 0 : Math.max(0, Math.min(5, Math.round(cachePercent / 20)));
      const blockMeter = h(
        'span',
        { className: 'sb-blocks', 'aria-hidden': true },
        h('span', { className: 'on' }, '\u25B0'.repeat(cacheBlocks)),
        h('span', { className: 'off' }, '\u25B1'.repeat(5 - cacheBlocks)),
      );

      const metric = (key, className, title, children) =>
        h('span', { key: key, className: 'dsh-sb-metric ' + className, title: title }, children);

      /* The token split, in the strip's own language: two directions with their
         own colour, an arrow that carries the same glow the lane does, and - the
         only live part - the outgoing arrow pulses while a turn is decoding,
         because that is the half that is actually moving. Incoming prompt tokens
         are already fixed by the time they are sent. */
      const io = h(
        'span',
        { key: 'split', className: 'dsh-sb-metric sb-io', title: t('metric.split') },
        h(
          'span',
          { className: 'sb-in', title: t('metric.in') },
          h('b', { className: 'sb-in-arrow', 'aria-hidden': true }, '\u2191'),
          h('span', { className: 'sb-io-v' }, compact(uncachedIn)),
        ),
        h('span', { className: 'sb-io-sep', 'aria-hidden': true }, '/'),
        h(
          'span',
          { className: 'sb-out', title: t('metric.out') },
          h('b', { className: 'sb-out-arrow', 'aria-hidden': true }, '\u2193'),
          h('span', { className: 'sb-io-v' }, compact(outTokens)),
        ),
      );

      const rightGroup = h(
        'div',
        { className: 'sb-group end' },
        cachePercent === null
          ? metric('cache', 'dsh-sb-nodata', t('metric.cache.pending'), '\u26A1 \u2014')
          : metric('cache', cacheTone(cachePercent), t('metric.cache') + ' ' + cachePercent + '%', ['\u26A1 ', String(cachePercent), '%', ' ', blockMeter]),
        h('span', { className: 'sb-sep' }, '\u00B7'),
        io,
        h('span', { className: 'sb-sep' }, '\u00B7'),
        metric('wall', 'dsh-sb-dim', t('metric.wall'), '\u23F1 ' + duration(wallMs)),
      );

      const rootProps = {
        'data-sb': '',
        'data-sb-theme': theme,
        'data-sb-state': working ? 'work' : 'idle',
        'data-sb-hover': hover ? '' : undefined,
        'data-sb-lite': lite ? '' : undefined,
        'data-sb-pixel': pixel ? '' : undefined,
        ref: barRef,
        style: barStyle,
        role: 'group',
        'aria-label': t('bar.label') + ': ' + stateLabel,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => {
          setHover(false);
          closeCardSoon();
        },
        onClick: fireSplash,
      };

      const chip = h(
        'button',
        {
          type: 'button',
          className: 'dsh-sb-chip',
          title: modelTitle === '' ? t('card.hint') : modelTitle + ' \u00B7 ' + t('card.hint'),
          'aria-expanded': cardOpen ? 'true' : 'false',
          onMouseEnter: openCard,
          onMouseLeave: closeCardSoon,
          onFocus: openCard,
          onBlur: closeCardSoon,
          onClick: (event) => {
            event.stopPropagation();
            setPinned((previous) => !previous);
            openCard();
          },
        },
        h('span', { className: 'sb-flower' + (working ? '' : ' idle'), 'aria-hidden': true }, GLYPHS[glyph]),
        brand,
      );

      const row = (label, value) =>
        h('div', { className: 'sb-row' }, h('span', { className: 'sb-k' }, label), h('span', { className: 'sb-v' }, value));

      const card = cardOpen
        ? h(
            'div',
            {
              className:
                'sb-card' +
                (pinned ? ' pinned' : '') +
                (anchor === ANCHOR_CORNER && cornerOk ? ' corner' : '') +
                (dragging ? ' dragging' : ''),
              ref: cardRef,
              style: drag === null ? undefined : { transform: 'translate(' + drag.dx + 'px,' + drag.dy + 'px)' },
              onClick: (event) => event.stopPropagation(),
              onMouseEnter: openCard,
              onMouseLeave: closeCardSoon,
            },
            h(
              'div',
              {
                className: 'dsh-sb-card-head',
                title: t('card.drag'),
                onPointerDown: startDrag,
                onDoubleClick: resetDrag,
              },
              t('card.title'),
            ),
            row(t('card.state'), stateLabel),
            row(t('card.turns'), String(turns) + ' / ' + String(steps)),
            row(t('card.rate'), rate > 0 ? Math.round(rate) + ' tok/s' : '\u2014'),
            row(t('card.tokens'), billed > 0 ? compact(billed) : '\u2014'),
            row(t('card.cache'), cachePercent === null ? '\u2014' : cachePercent + '%'),
            row(t('card.context'), contextPercent === null ? '\u2014' : contextPercent + '% (' + compact(occupied) + ' / ' + compact(windowSize) + ')'),
            row(t('card.surface'), surfaceTokens === null ? '\u2014' : compact(surfaceTokens)),
            sizeRow,
            h(
              'div',
              { className: 'sb-palette' },
              THEMES.map((entry) =>
                h('button', {
                  key: entry.id,
                  type: 'button',
                  className: 'sb-swatch' + (entry.id === theme ? ' on' : ''),
                  style: { background: entry.dot },
                  title: entry.label,
                  'aria-label': entry.label,
                  onClick: () => chooseTheme(entry.id),
                }),
              ),
            ),
            h(
              'div',
              { className: 'sb-tools' },
              h(
                'button',
                {
                  type: 'button',
                  /* Every tool button reads as the state it is in, not as the
                     action it would perform: the accent latch means "this is
                     on". `fx off` used to be the action label, so a strip with
                     the effects running said "fx off" and read as its own
                     opposite. */
                  className: 'sb-fx sb-pixel' + (pixel ? ' on' : ''),
                  title: pixel ? t('pixel.title.on') : t('pixel.title.off'),
                  'aria-pressed': pixel ? 'true' : 'false',
                  onClick: togglePixel,
                },
                pixel ? t('pixel.on') : t('pixel.off'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sb-fx sb-fxtoggle' + (lite ? '' : ' on'),
                  title: lite ? t('fx.title.off') : t('fx.title.on'),
                  'aria-pressed': lite ? 'false' : 'true',
                  onClick: toggleFx,
                },
                lite ? t('fx.off') : t('fx.on'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sb-fx sb-flowmode',
                  title: t(flowCopy.title),
                  onClick: toggleFlowMode,
                },
                t(flowCopy.label),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sb-fx sb-demo' + (demo ? ' on' : ''),
                  title: demo ? t('demo.title.on') : t('demo.title.off'),
                  'aria-pressed': demo ? 'true' : 'false',
                  onClick: (event) => {
                    event.stopPropagation();
                    toggleDemo();
                  },
                },
                demo ? t('demo.on') : t('demo.off'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sb-fx sb-anchor',
                  title:
                    anchor === ANCHOR_CORNER
                      ? cornerOk
                        ? t('anchor.title.corner')
                        : t('anchor.title.tight')
                      : t('anchor.title.above'),
                  onClick: (event) => {
                    event.stopPropagation();
                    toggleAnchor();
                  },
                },
                anchor === ANCHOR_CORNER ? t('anchor.corner') : t('anchor.above'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sb-fx sb-close',
                  title: t('card.close'),
                  'aria-label': t('card.close'),
                  onClick: (event) => {
                    event.stopPropagation();
                    closeCardNow();
                  },
                },
                '\u00D7',
              ),
            ),
          )
        : null;

      /* Where the card actually lives. Inside the dock it shares a stacking
         context with the composer and loses to it: the compose box paints over
         the card. Portalled to <body> the card gets a context of its own - above
         the dock, below anything modal (the shell's dialogs start at z 1000).
         Falls back to the inline node when there is no react-dom or no
         measurement yet, so the card is never simply missing. */
      const canPortal =
        card !== null &&
        cardBox !== null &&
        ReactDOM !== null &&
        typeof ReactDOM.createPortal === 'function' &&
        typeof document !== 'undefined' &&
        document.body !== null &&
        document.body !== undefined;

      const cardLayer =
        !canPortal || ReactDOM === null
          ? card
          : ReactDOM.createPortal(
              h(
                'div',
                {
                  className: 'dsh-sb-shell dsh-sb-portal',
                  style: {
                    position: 'fixed',
                    left: cardBox.left + 'px',
                    top: cardBox.top + 'px',
                    width: cardBox.width + 'px',
                    height: cardBox.height + 'px',
                    zIndex: 950,
                  },
                },
                h(
                  'div',
                  {
                    className: 'dsh-sb-ghost',
                    'data-sb': '',
                    'data-sb-theme': theme,
                    'data-sb-state': working ? 'work' : 'idle',
                    'data-sb-lite': lite ? '' : undefined,
                    'data-sb-pixel': pixel ? '' : undefined,
                  },
                  card,
                ),
              ),
              document.body,
            );

      return h(
        'div',
        { className: 'dsh-sb-shell' },
        h(
          'div',
          rootProps,
          h('div', { className: 'sb-group' }, chip),
          h(
            'div',
            { className: 'sb-group' },
            h(
              'span',
              {
                className:
                  done !== null ? 'sb-status sb-done' : working ? 'sb-status sb-glow' : 'sb-status idle',
              },
              done !== null || working ? '\u2726 ' : '\u25CC ',
              statusText,
              done !== null
                ? null
                : working
                  ? h('span', { className: 'sb-dots', 'aria-hidden': true }, h('i', null, '.'), h('i', null, '.'), h('i', null, '.'))
                  : h('span', { className: 'sb-zzz', 'aria-hidden': true }, h('i', null, 'Z'), h('i', null, 'z'), h('i', null, 'z'), h('i', null, 'z')),
            ),
            h('span', { className: 'sb-sep' }, '\u00B7'),
            lane,
            stepBoxes === null ? null : h('span', { className: 'sb-sep' }, '\u00B7'),
            stepBoxes,
          ),
          rightGroup,
          h('span', { className: 'sb-splash', ref: splashRef, 'aria-hidden': true }, h('i', null), h('b', null), h('u', null)),
          cardLayer,
        ),
      );
    }

    /* ------------------------------------------------------------------ *
     * Settings page
     *
     * Registered into `settings.plugins.tab`, so the strip is editable from
     * Settings > Plugins and not only from its own hover card. Everything it
     * writes is the same key the strip already reads, plus the change event
     * above, so an open strip follows along instead of waiting for a reload.
     * ------------------------------------------------------------------ */

    /** Every persisted preference, read as one snapshot. */
    function readPrefs() {
      return {
        theme: readStored(STORE_THEME, 'deepseek', THEME_IDS),
        lite: readStored(STORE_FX, 'off') === 'on',
        pixel: readStored(STORE_PIXEL, prefersReduced() ? 'on' : 'off') === 'on',
        flow: readStored(STORE_FLOW, FLOW_BEADS, FLOW_ORDER),
        anchor: readStored(STORE_ANCHOR, ANCHOR_ABOVE, [ANCHOR_ABOVE, ANCHOR_CORNER]),
        widthStep: readStoredIndex(STORE_WIDTH, WIDTH_DEFAULT, WIDTH_STEPS.length),
        heightStep: readStoredIndex(STORE_HEIGHT, HEIGHT_DEFAULT, HEIGHT_STEPS.length),
      };
    }

    function SettingsPanel(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const [prefs, setPrefs] = React.useState(readPrefs);

      React.useEffect(() => {
        const sync = () => setPrefs(readPrefs());
        window.addEventListener(SETTINGS_EVENT, sync);
        return () => window.removeEventListener(SETTINGS_EVENT, sync);
      }, []);

      const commit = () => {
        setPrefs(readPrefs());
        announceSettings();
      };
      const put = (key, value) => {
        writeStored(key, value);
        commit();
      };

      const widthValue = WIDTH_STEPS[prefs.widthStep];
      const heightValue = HEIGHT_STEPS[prefs.heightStep];
      const widthText = widthValue === 'full' ? t('size.full') : String(widthValue);
      const stepOf = (key, current, length, delta) => {
        const next = Math.max(0, Math.min(length - 1, current + delta));
        put(key, String(next));
      };

      const choice = (label, active, onSelect, title) =>
        h(
          'button',
          {
            type: 'button',
            className: 'sb-set-choice',
            'data-on': active ? 'true' : undefined,
            title: title,
            'aria-pressed': active ? 'true' : 'false',
            onClick: onSelect,
          },
          label,
        );

      const row = (label, children) =>
        h('div', { className: 'sb-set-row' }, h('span', { className: 'sb-set-label' }, label), children);

      const stepper = (label, value, onDown, onUp) =>
        row(
          label,
          h(
            'span',
            { className: 'sb-set-stepper' },
            choice('\u2212', false, onDown, t('settings.step.down')),
            h('span', { className: 'sb-set-value' }, value),
            choice('+', false, onUp, t('settings.step.up')),
          ),
        );

      /* A live sample of the strip: same classes, same attributes, no session.
         It is the only honest way to choose a palette - the swatch is a colour,
         the preview is the glow. */
      const preview = h(
        'div',
        { className: 'dsh-sb-shell sb-set-preview', 'aria-hidden': true },
        h(
          'div',
          {
            'data-sb': '',
            'data-sb-theme': prefs.theme,
            'data-sb-state': 'work',
            'data-sb-lite': prefs.lite ? '' : undefined,
            'data-sb-pixel': prefs.pixel ? '' : undefined,
            style: {
              '--sb-shell-max': widthValue === 'full' ? 'none' : widthValue + 'px',
              '--sb-pad-y': heightValue + 'px',
            },
          },
          h(
            'div',
            { className: 'sb-group' },
            h('span', { className: 'sb-flower' }, '\u273B'),
            h('span', { className: 'dsh-sb-brand' }, t('settings.preview.caption')),
          ),
          h(
            'div',
            { className: 'sb-group' },
            h('span', { className: 'sb-status sb-glow' }, t('settings.preview.phrase')),
            h('span', { className: 'sb-sep' }, '\u00B7'),
            h(
              'span',
              { className: 'sb-flow dsh-sb-flow' },
              h('i', null),
              h('i', null),
              h('i', null),
              h('i', null),
              h('i', null),
              h('i', null),
              h('i', null),
              h('i', null),
            ),
          ),
          h(
            'div',
            { className: 'sb-group end' },
            h('span', { className: 'dsh-sb-metric sb-ok' }, '\u26A1 99%'),
            h('span', { className: 'sb-sep' }, '\u00B7'),
            h(
              'span',
              { className: 'dsh-sb-metric sb-io' },
              h('span', { className: 'sb-in' }, h('b', { className: 'sb-in-arrow' }, '\u2191'), h('span', { className: 'sb-io-v' }, '12.0k')),
              h('span', { className: 'sb-io-sep' }, '/'),
              h('span', { className: 'sb-out' }, h('b', { className: 'sb-out-arrow' }, '\u2193'), h('span', { className: 'sb-io-v' }, '3.4k')),
            ),
          ),
        ),
      );

      return h(
        'div',
        { className: 'dsh-sb-settings' },
        h('h3', { className: 'sb-set-title' }, t('settings.title')),
        h('p', { className: 'sb-set-intro' }, t('settings.intro')),
        preview,
        h(
          'div',
          { className: 'sb-set-group' },
          h('span', { className: 'sb-set-group-title' }, t('settings.appearance')),
          row(
            t('settings.theme'),
            h(
              'span',
              { className: 'sb-set-swatches' },
              THEMES.map((entry) =>
                h('button', {
                  key: entry.id,
                  type: 'button',
                  className: 'sb-set-swatch' + (entry.id === prefs.theme ? ' on' : ''),
                  style: { background: entry.dot },
                  title: entry.label,
                  'aria-label': entry.label,
                  'aria-pressed': entry.id === prefs.theme ? 'true' : 'false',
                  onClick: () => put(STORE_THEME, entry.id),
                }),
              ),
            ),
          ),
        ),
        h(
          'div',
          { className: 'sb-set-group' },
          h('span', { className: 'sb-set-group-title' }, t('settings.behaviour')),
          row(
            t('settings.fx'),
            h(
              'span',
              { className: 'sb-set-choices' },
              choice(t('fx.on'), !prefs.lite, () => put(STORE_FX, 'off'), t('fx.title.on')),
              choice(t('fx.off'), prefs.lite, () => put(STORE_FX, 'on'), t('fx.title.off')),
            ),
          ),
          row(
            t('settings.pixel'),
            h(
              'span',
              { className: 'sb-set-choices' },
              choice(t('pixel.off'), !prefs.pixel, () => put(STORE_PIXEL, 'off'), t('pixel.title.off')),
              choice(t('pixel.on'), prefs.pixel, () => put(STORE_PIXEL, 'on'), t('pixel.title.on')),
            ),
          ),
          row(
            t('settings.lane'),
            h(
              'span',
              { className: 'sb-set-choices' },
              FLOW_ORDER.map((mode) =>
                choice(t(flowText(mode).label), prefs.flow === mode, () => put(STORE_FLOW, mode), t(flowText(mode).title)),
              ),
            ),
          ),
          row(
            t('settings.anchor'),
            h(
              'span',
              { className: 'sb-set-choices' },
              choice(t('anchor.above'), prefs.anchor === ANCHOR_ABOVE, () => put(STORE_ANCHOR, ANCHOR_ABOVE), t('anchor.title.above')),
              choice(t('anchor.corner'), prefs.anchor === ANCHOR_CORNER, () => put(STORE_ANCHOR, ANCHOR_CORNER), t('anchor.title.corner')),
            ),
          ),
        ),
        h(
          'div',
          { className: 'sb-set-group' },
          h('span', { className: 'sb-set-group-title' }, t('settings.size')),
          stepper(
            t('settings.width'),
            widthText,
            () => stepOf(STORE_WIDTH, prefs.widthStep, WIDTH_STEPS.length, -1),
            () => stepOf(STORE_WIDTH, prefs.widthStep, WIDTH_STEPS.length, 1),
          ),
          stepper(
            t('settings.height'),
            String(heightValue),
            () => stepOf(STORE_HEIGHT, prefs.heightStep, HEIGHT_STEPS.length, -1),
            () => stepOf(STORE_HEIGHT, prefs.heightStep, HEIGHT_STEPS.length, 1),
          ),
        ),
        h(
          'div',
          { className: 'sb-set-foot' },
          h(
            'button',
            {
              type: 'button',
              className: 'sb-set-choice',
              onClick: () => {
                writeStored(STORE_THEME, 'deepseek');
                writeStored(STORE_FX, 'off');
                writeStored(STORE_PIXEL, prefersReduced() ? 'on' : 'off');
                writeStored(STORE_FLOW, FLOW_BEADS);
                writeStored(STORE_ANCHOR, ANCHOR_ABOVE);
                writeStored(STORE_WIDTH, String(WIDTH_DEFAULT));
                writeStored(STORE_HEIGHT, String(HEIGHT_DEFAULT));
                commit();
              },
            },
            t('settings.reset'),
          ),
          h('span', { className: 'sb-set-hint' }, t('settings.reset.hint')),
        ),
      );
    }

    /** Settings must never take the page down; reuse the strip's own fallback. */
    function StatusBarSettings(props) {
      return h(Guard, { fallback: renderFallback }, h(SettingsPanel, props));
    }

    /** Required services: slot registration and localized strings. */
    const inject = ['slots', 'locale'];

    const NS = 'statusbar';

    const en = {
      'bar.label': 'Status bar',
      'state.working': 'working',
      'state.idle': 'idle',
      'flow.busy': 'particles flowing at the live token rate',
      'flow.idle': 'particles barely drifting',
      'flow.ecg.busy': 'heartbeat trace sweeping at the live token rate',
      'flow.ecg.idle': 'flatline - nothing decoding',
      'flow.wave.busy': 'two water layers scrolling at the live token rate',
      'flow.wave.idle': 'still water, one slow swell',
      'flow.whale.busy': 'a whale crossing the water at the live token rate, diving as it goes',
      'flow.whale.idle': 'a whale idling in flat water',
      'flow.traffic.busy': 'cars on a two-lane road, running at the live token rate',
      'flow.traffic.idle': 'a nearly empty road, traffic crawling',
      'metric.cache': 'prompt tokens served from cache —',
      'metric.cache.pending': 'no cached prompt sample yet',
      'metric.split': 'uncached input · output',
      'metric.in': 'prompt tokens sent to the model, excluding cache hits',
      'metric.out': 'tokens the model has returned this session',
      'metric.wall': 'model plus tool wall time this session',
      'card.title': 'status bar',
      'card.state': 'state',
      'card.turns': 'turns / steps',
      'card.rate': 'decode rate',
      'card.tokens': 'billed tokens',
      'card.cache': 'cache hit',
      'card.context': 'context',
      'card.surface': 'surface',
      'card.hint': 'session figures and palette',
      'fx.off': 'fx off',
      'fx.on': 'fx on',
      'fx.title.on': 'full-surface FX are on (breathing, splash, halos) - click to keep the strip still',
      'fx.title.off': 'FX are off - click to bring the breathing, the splash and the halos back',
      'pixel.off': 'pixel',
      'pixel.on': 'pixel on',
      'pixel.title.off': 'step the motion down to a low frame rate (for RDP / software rendering)',
      'pixel.title.on': 'low-frame motion is on - click for smooth motion',
      'flowmode.beads': 'beads',
      'flowmode.ecg': 'bpm',
      'flowmode.wave': 'water',
      'flowmode.whale': 'whale',
      'flowmode.traffic': 'traffic',
      'flowmode.title.beads': 'flowing token beads - click for a flat heartbeat trace',
      'flowmode.title.ecg': 'heartbeat trace at the live rate - click for two scrolling water layers',
      'flowmode.title.wave': 'two water layers scrolling at the live rate - click for a diving whale',
      'flowmode.title.whale': 'a whale crossing the water, diving once per pass - click for cars on a highway',
      'flowmode.title.traffic': 'two lanes of traffic running at the live token rate - click for flowing beads',
      'demo.off': 'demo',
      'demo.on': 'demo on',
      'demo.title.off': 'play the working animations without sending a prompt',
      'demo.title.on': 'stop the rehearsal - the strip settles and reports the time it ran',
      'state.demo': 'working (demo)',
      'anchor.above': 'above',
      'anchor.corner': 'corner',
      'anchor.title.above': 'card hangs over the strip, left edges aligned - click to sit it on the strip corner',
      'anchor.title.corner': 'card sits on the strip top-left corner - click to hang it above',
      'anchor.title.tight': 'corner needs a card-width of room to the left of the strip - none here, so the card hangs above',
      'card.drag': 'drag to move - double-click to put it back',
      'card.close': 'close',
      'size.width': 'w',
      'size.height': 'h',
      'size.full': 'full',
      'size.narrower': 'narrow the strip by one step',
      'size.wider': 'widen the strip by one step - full lets it run edge to edge',
      'size.shorter': 'flatten the strip by one step',
      'size.taller': 'heighten the strip by one step',
      'settings.title': 'status line',
      'settings.intro': 'Saved in this browser. The strip follows along as you change it, and the preview above is the real thing, not a mock.',
      'settings.appearance': 'appearance',
      'settings.behaviour': 'behaviour',
      'settings.size': 'size',
      'settings.theme': 'theme',
      'settings.fx': 'full-surface FX',
      'settings.pixel': 'low frame rate',
      'settings.lane': 'flow lane',
      'settings.anchor': 'card anchor',
      'settings.width': 'width',
      'settings.height': 'height',
      'settings.step.down': 'one step down',
      'settings.step.up': 'one step up',
      'settings.reset': 'reset to defaults',
      'settings.reset.hint': 'palette, effects, lane, anchor and size',
      'settings.preview.caption': 'status line',
      'settings.preview.phrase': 'this is how it moves',
    };
    const zh = {
      'bar.label': '状态栏',
      'state.working': '工作中',
      'state.idle': '空闲',
      'flow.busy': '粒子按实时速率流动',
      'flow.idle': '粒子缓缓漂移',
      'flow.ecg.busy': '心电曲线按实时速率扫过',
      'flow.ecg.idle': '平线 — 当前没有解码',
      'flow.wave.busy': '两层水波按实时速率流动',
      'flow.wave.idle': '静水，缓缓起伏',
      'flow.whale.busy': '鲸鱼按实时速率穿过水面，途中下潜',
      'flow.whale.idle': '鲸鱼在平静的水面漂着',
      'flow.traffic.busy': '双车道上的车按实时速率行驶',
      'flow.traffic.idle': '空荡荡的路，车流缓慢',
      'metric.cache': '缓存命中的提示词比例 —',
      'metric.cache.pending': '尚无缓存样本',
      'metric.split': '未缓存输入 · 输出',
      'metric.in': '发给模型的未缓存提示词 token',
      'metric.out': '本会话模型已返回的 token',
      'metric.wall': '本会话模型与工具耗时',
      'card.title': '状态栏',
      'card.state': '状态',
      'card.turns': '轮次 / 步数',
      'card.rate': '解码速率',
      'card.tokens': '计费 token',
      'card.cache': '缓存命中',
      'card.context': '上下文',
      'card.surface': '表面积',
      'card.hint': '会话数据与配色',
      'fx.off': '特效关',
      'fx.on': '特效开',
      'fx.title.on': '整条状态条的特效开着（呼吸、波纹、光晕）— 点击关闭',
      'fx.title.off': '特效已关闭 — 点击恢复呼吸、波纹和光晕',
      'pixel.off': '低帧',
      'pixel.on': '低帧 开',
      'pixel.title.off': '把动画降到低帧率（适合远程桌面 / 软件渲染）',
      'pixel.title.on': '低帧模式已开启 — 点击恢复平滑动画',
      'flowmode.beads': '粒子',
      'flowmode.ecg': '心电',
      'flowmode.wave': '水波',
      'flowmode.whale': '鲸鱼',
      'flowmode.traffic': '车流',
      'flowmode.title.beads': '流动的 token 粒子 — 点击切换为平线心电',
      'flowmode.title.ecg': '实时速率的心电曲线 — 点击切换为两层流动的水波',
      'flowmode.title.wave': '两层水波按实时速率流动 — 点击切换为下潜的鲸鱼',
      'flowmode.title.whale': '鲸鱼每次经过都会下潜一次 — 点击切换为高速公路上的车流',
      'flowmode.title.traffic': '双车道车流按实时速率行驶 — 点击切回流动粒子',
      'demo.off': '演示',
      'demo.on': '演示 开',
      'demo.title.off': '不发送消息，直接播放工作中的动画',
      'demo.title.on': '结束演示 — 状态条会停下并报出这次跑了多久',
      'state.demo': '工作中（演示）',
      'anchor.above': '上方',
      'anchor.corner': '角上',
      'anchor.title.above': '卡片挂在状态条上方、左对齐 — 点击改为贴在状态条左角',
      'anchor.title.corner': '卡片贴在状态条左上角 — 点击改回挂在状态条上方',
      'anchor.title.tight': '角上模式需要状态条左侧留出约一张卡片的宽度 — 这里放不下，卡片先挂在上面',
      'card.drag': '拖动可移动 — 双击复位',
      'card.close': '关闭',
      'size.width': '宽',
      'size.height': '高',
      'size.full': '满宽',
      'size.narrower': '把状态条收窄一档',
      'size.wider': '把状态条加宽一档 — 满宽时铺满整行',
      'size.shorter': '把状态条压扁一档',
      'size.taller': '把状态条加高一档',
      'settings.title': '状态条',
      'settings.intro': '设置保存在当前浏览器里。改动会立刻作用到状态条，上面的预览是真实的，不是示意图。',
      'settings.appearance': '外观',
      'settings.behaviour': '行为',
      'settings.size': '尺寸',
      'settings.theme': '配色',
      'settings.fx': '整条特效',
      'settings.pixel': '低帧率',
      'settings.lane': '流动效果',
      'settings.anchor': '卡片位置',
      'settings.width': '宽度',
      'settings.height': '高度',
      'settings.step.down': '降低一档',
      'settings.step.up': '提高一档',
      'settings.reset': '恢复默认',
      'settings.reset.hint': '配色、特效、流动效果、卡片位置和尺寸',
      'settings.preview.caption': '状态条',
      'settings.preview.phrase': '它就是这么动的',
    };

    /**
     * Install the stylesheet and register the strip.
     *
     * This plugin owns a cell of its own (`statusline`, order -1) so the two
     * shipped pills keep rendering underneath it. Nothing is shadowed: the
     * strip sits above the harness's own line instead of replacing it.
     *
     * (The original build shadowed `activity`/`usage` at priority -1 to take
     * those cells over. That is still a supported alternative; it just means
     * the shipped figures disappear, which is not what we want here.)
     */
    function apply(ctx) {
      ctx.effect(() => {
        const tagId = '@local/dsh-statusbar/statusbar.css';
        if (document.querySelector('style[data-plugin-css="' + tagId + '"]') !== null) return () => {};
        const tag = document.createElement('style');
        tag.dataset.plugin = '@local/dsh-statusbar';
        tag.dataset.pluginCss = tagId;
        tag.textContent = CSS + SHELL_CSS;
        document.head.appendChild(tag);
        return () => {
          if (tag.parentNode !== null) tag.parentNode.removeChild(tag);
        };
      }, 'statusbar: stylesheet');

      ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'statusbar: dictionaries');

      ctx.slots.inject('conversation.composer.dock', () =>
        ctx.slots.register(
          { name: 'conversation.composer.dock', id: 'statusline', order: -1, locale: NS, label: 'Status line' },
          StatusBar,
        ),
      );

      /* Settings > Plugins gets a page of its own. `label` is a function so the
         tab name is resolved when the tab is drawn, in the reader's language,
         instead of being frozen at registration. */
      const settingsLabel = () => {
        try {
          return ctx.locale.bind(NS)('settings.title');
        } catch (error) {
          return 'Status line';
        }
      };
      ctx.slots.inject('settings.plugins.tab', () =>
        ctx.slots.register(
          { name: 'settings.plugins.tab', id: 'statusline', order: 20, locale: NS, label: settingsLabel },
          StatusBarSettings,
        ),
      );
    }

    return { inject, apply };
  },
});
