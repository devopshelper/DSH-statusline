window.__ModuleLoader__.load({
  id: '@local/dsh-statusbar',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

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
      '.dsh-sb-shell [data-sb]{display:flex;align-items:center;flex-wrap:nowrap;width:100%;max-width:var(--sb-shell-max,980px);box-sizing:border-box;border:1px solid rgba(var(--sb-glow),.16);border-radius:10px}' +
      '.dsh-sb-shell [data-sb] .sb-group{min-width:0}' +
      '.dsh-sb-shell [data-sb] .sb-status{flex:0 1 auto;min-width:0}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-flow,.dsh-sb-shell [data-sb] .sb-sep,.dsh-sb-shell [data-sb] .dsh-sb-chip,.dsh-sb-shell [data-sb] .dsh-sb-metric{flex:0 0 auto}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-chip{display:inline-flex;align-items:center;gap:6px;padding:1px 6px 1px 3px;margin-left:-3px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;letter-spacing:inherit;cursor:help}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-chip:hover{background:rgba(var(--sb-glow),.10)}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-brand{font-weight:600;opacity:.92;white-space:nowrap}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-metric{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-variant-numeric:tabular-nums}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-dim{opacity:.82}' +
      '.dsh-sb-shell [data-sb] .sb-ok{color:#00e676}' +
      '.dsh-sb-shell [data-sb] .sb-warn{color:#ffc400}' +
      '.dsh-sb-shell [data-sb] .sb-bad{color:#ff5252}' +
      '.dsh-sb-shell [data-sb] .dsh-sb-nodata{opacity:.45}' +
      '.dsh-sb-shell [data-sb] .sb-card .dsh-sb-card-head{font-size:9.5px;letter-spacing:.7px;text-transform:uppercase;color:rgba(150,170,190,.85);margin-bottom:5px}' +
      /* ---- pixel mode: low-frame, low-paint ------------------------------
         For RDP and other software-rendered sessions. The strip keeps moving,
         but it moves like an 8-bit sprite: quantised steps instead of a smooth
         sweep, no glow shadows to re-rasterise, and no full-surface breathing. */
      '.dsh-sb-shell [data-sb][data-sb-pixel]{animation:none!important;box-shadow:inset 0 0 18px rgba(var(--sb-glow),.12)!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flow i{box-shadow:none!important;border-radius:1px;width:5px;height:5px;animation-timing-function:steps(8,end)!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flow i:nth-child(even){background:var(--sb-accent2);border-radius:1px}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flow-gear{text-shadow:none}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flower,' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-dots i,' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-zzz i{animation-timing-function:steps(4,end)!important;text-shadow:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-status{text-shadow:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-splash{display:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel][data-sb-hover]{filter:none!important}' +
      '@media (prefers-reduced-motion:reduce){.dsh-sb-shell [data-sb]{animation:none!important}}';

    const GLYPHS = ['\u273B', '\u273D', '\u2736', '\u2733', '\u2722', '\u00B7'];

    const WORK_PHRASES = [
      'Cogitating like crazy',
      'reticulating splines',
      'consulting the rubber duck',
      'herding semicolons',
      'marinating in context',
      'thinking in vectors',
      'assembling thought particles',
    ];
    const IDLE_PHRASES = [
      'waiting to cogitate',
      'dozing in latent space',
      'in the ether',
      'standing by',
    ];

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
      const working = readRunning(typeof statusHook === 'function' ? statusHook(identity) : null, props.sessionId) === true;

      const stats = useFaceValue(props.useProjection, 'sessionStats');
      const usage = useFaceValue(props.useProjection, 'tokenUsage');
      const pressure = useFaceValue(props.useProjection, 'contextPressure');
      const breakdown = useFaceValue(props.useProjection, 'contextBreakdown');

      const [theme, setTheme] = React.useState(() => readStored(STORE_THEME, 'deepseek', THEME_IDS));
      const [lite, setLite] = React.useState(() => readStored(STORE_FX, 'off') === 'on');
      const [pixel, setPixel] = React.useState(() => readStored(STORE_PIXEL, prefersReduced() ? 'on' : 'off') === 'on');
      const [hover, setHover] = React.useState(false);
      const [cardOpen, setCardOpen] = React.useState(false);
      const [pinned, setPinned] = React.useState(false);
      const [phrase, setPhrase] = React.useState(0);
      const [glyph, setGlyph] = React.useState(0);

      const barRef = React.useRef(null);
      const splashRef = React.useRef(null);
      const closeTimer = React.useRef(0);

      React.useEffect(() => {
        const phraseTimer = window.setInterval(() => setPhrase((n) => n + 1), working ? 3750 : 5000);
        /* Pixel mode morphs the glyph like a sprite: fewer frames, and each
           tick costs a React render of the whole strip. */
        const glyphTimer = window.setInterval(
          () => setGlyph((n) => (n + 1) % GLYPHS.length),
          pixel ? 320 : working ? 130 : 300,
        );
        return () => {
          window.clearInterval(phraseTimer);
          window.clearInterval(glyphTimer);
        };
      }, [working, pixel]);

      React.useEffect(() => () => window.clearTimeout(closeTimer.current), []);

      const chooseTheme = (id) => {
        setTheme(id);
        writeStored(STORE_THEME, id);
      };
      const toggleFx = () => {
        setLite((previous) => {
          const next = !previous;
          writeStored(STORE_FX, next ? 'on' : 'off');
          return next;
        });
      };
      const togglePixel = () => {
        setPixel((previous) => {
          const next = !previous;
          writeStored(STORE_PIXEL, next ? 'on' : 'off');
          return next;
        });
      };

      const openCard = () => {
        window.clearTimeout(closeTimer.current);
        setCardOpen(true);
      };
      const closeCardSoon = () => {
        if (pinned) return;
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setCardOpen(false), 140);
      };

      /** Wave: keep the node, flip the class, force a reflow, flip it back on. */
      const fireSplash = (event) => {
        if (lite) return;
        const bar = barRef.current;
        const splash = splashRef.current;
        if (bar === null || splash === null) return;
        const target = event.target;
        if (target && typeof target.closest === 'function' && target.closest('.sb-card')) return;
        const rect = bar.getBoundingClientRect();
        if (!rect.width) return;
        const percent = Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100));
        splash.style.setProperty('--sb-sx', percent + '%');
        splash.style.setProperty('--sb-x', (percent / 100) * rect.width + 'px');
        splash.style.setProperty('--sb-w', rect.width + 'px');
        splash.classList.remove('go');
        void splash.offsetWidth;
        splash.classList.add('go');
      };

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

      const phrases = working ? WORK_PHRASES : IDLE_PHRASES;
      const phraseText = phrases[phrase % phrases.length];

      /* Load-bearing: 3.2 / (1 + tps/55) clamped; idle barely drifts.
         Pixel mode keeps the lane above a floor so 4 stepped beads still read
         as flow instead of a blur. */
      const tps = working ? (rate > 0 ? rate : 55) : 0;
      const smoothFlow = working ? Math.max(0.5, Math.min(3.2, 3.2 / (1 + tps / 55))) : 10;
      const flowSeconds = pixel ? Math.max(0.9, smoothFlow) : smoothFlow;

      const cacheBlocks = cachePercent === null ? 0 : Math.max(0, Math.min(5, Math.round(cachePercent / 20)));
      const blockMeter = h(
        'span',
        { className: 'sb-blocks', 'aria-hidden': true },
        h('span', { className: 'on' }, '\u25B0'.repeat(cacheBlocks)),
        h('span', { className: 'off' }, '\u25B1'.repeat(5 - cacheBlocks)),
      );

      const metric = (key, className, title, children) =>
        h('span', { key: key, className: 'dsh-sb-metric ' + className, title: title }, children);

      const rightGroup = h(
        'div',
        { className: 'sb-group end' },
        cachePercent === null
          ? metric('cache', 'dsh-sb-nodata', t('metric.cache.pending'), '\u26A1 \u2014')
          : metric('cache', cacheTone(cachePercent), t('metric.cache') + ' ' + cachePercent + '%', ['\u26A1 ', String(cachePercent), '%', ' ', blockMeter]),
        h('span', { className: 'sb-sep' }, '\u00B7'),
        contextPercent === null
          ? metric('ctx', 'dsh-sb-nodata', t('metric.context.pending'), 'ctx \u2014')
          : metric('ctx', contextTone(contextPercent), t('metric.context') + ' ' + compact(occupied) + ' / ' + compact(windowSize), [String(contextPercent), '% ctx']),
        h('span', { className: 'sb-sep dsh-sb-tokens' }, '\u00B7'),
        metric('tokens', 'dsh-sb-tokens dsh-sb-dim', t('metric.tokens'), billed > 0 ? compact(billed) + ' tok' : 'tok \u2014'),
        h('span', { className: 'sb-sep dsh-sb-split' }, '\u00B7'),
        metric('split', 'dsh-sb-split dsh-sb-dim', t('metric.split'), '\u2191' + compact(uncachedIn) + ' \u2193' + compact(outTokens)),
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
        role: 'group',
        'aria-label': t('bar.label') + ': ' + (working ? t('state.working') : t('state.idle')),
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
          title: t('card.hint'),
          'aria-expanded': cardOpen ? 'true' : 'false',
          onMouseEnter: openCard,
          onMouseLeave: closeCardSoon,
          onFocus: openCard,
          onBlur: closeCardSoon,
          onClick: (event) => {
            event.stopPropagation();
            setPinned((previous) => !previous);
            setCardOpen(true);
          },
        },
        h('span', { className: 'sb-flower' + (working ? '' : ' idle'), 'aria-hidden': true }, GLYPHS[glyph]),
        h('span', { className: 'dsh-sb-brand' }, 'DeepSeek Harness'),
      );

      const row = (label, value) =>
        h('div', { className: 'sb-row' }, h('span', { className: 'sb-k' }, label), h('span', { className: 'sb-v' }, value));

      const card = cardOpen
        ? h(
            'div',
            {
              className: 'sb-card' + (pinned ? ' pinned' : ''),
              onClick: (event) => event.stopPropagation(),
              onMouseEnter: openCard,
              onMouseLeave: closeCardSoon,
            },
            h('div', { className: 'dsh-sb-card-head' }, t('card.title')),
            row(t('card.state'), working ? t('state.working') : t('state.idle')),
            row(t('card.turns'), String(turns) + ' / ' + String(steps)),
            row(t('card.rate'), rate > 0 ? Math.round(rate) + ' tok/s' : '\u2014'),
            row(t('card.tokens'), billed > 0 ? compact(billed) : '\u2014'),
            row(t('card.cache'), cachePercent === null ? '\u2014' : cachePercent + '%'),
            row(t('card.context'), contextPercent === null ? '\u2014' : contextPercent + '% (' + compact(occupied) + ' / ' + compact(windowSize) + ')'),
            row(t('card.surface'), surfaceTokens === null ? '\u2014' : compact(surfaceTokens)),
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
                  className: 'sb-fx',
                  title: pixel ? t('pixel.title.on') : t('pixel.title.off'),
                  onClick: togglePixel,
                },
                pixel ? t('pixel.on') : t('pixel.off'),
              ),
              h('button', { type: 'button', className: 'sb-fx', onClick: toggleFx }, lite ? t('fx.on') : t('fx.off')),
            ),
          )
        : null;

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
              { className: working ? 'sb-status sb-glow' : 'sb-status idle' },
              working ? '\u2726 ' : '\u25CC ',
              phraseText,
              working
                ? h('span', { className: 'sb-dots', 'aria-hidden': true }, h('i', null, '.'), h('i', null, '.'), h('i', null, '.'))
                : h('span', { className: 'sb-zzz', 'aria-hidden': true }, h('i', null, 'Z'), h('i', null, 'z'), h('i', null, 'z'), h('i', null, 'z')),
            ),
            h('span', { className: 'sb-sep' }, '\u00B7'),
            h(
              'span',
              {
                className: 'sb-flow dsh-sb-flow' + (working ? '' : ' idle'),
                style: { '--sb-flow-dur': flowSeconds.toFixed(2) + 's' },
                title: working ? t('flow.busy') + (rate > 0 ? ' \u00B7 ' + Math.round(rate) + ' tok/s' : '') : t('flow.idle'),
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
            ),
          ),
          rightGroup,
          h('span', { className: 'sb-splash', ref: splashRef, 'aria-hidden': true }, h('i', null), h('b', null), h('u', null)),
          card,
        ),
      );
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
      'metric.cache': 'prompt tokens served from cache —',
      'metric.cache.pending': 'no cached prompt sample yet',
      'metric.context': 'context occupancy —',
      'metric.context.pending': 'no context sample yet',
      'metric.tokens': 'billed tokens across input, output and cache traffic',
      'metric.split': 'uncached input · output',
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
      'pixel.off': 'pixel',
      'pixel.on': 'pixel on',
      'pixel.title.off': 'step the motion down to a low frame rate (for RDP / software rendering)',
      'pixel.title.on': 'low-frame motion is on - click for smooth motion',
    };
    const zh = {
      'bar.label': '状态栏',
      'state.working': '工作中',
      'state.idle': '空闲',
      'flow.busy': '粒子按实时速率流动',
      'flow.idle': '粒子缓缓漂移',
      'metric.cache': '缓存命中的提示词比例 —',
      'metric.cache.pending': '尚无缓存样本',
      'metric.context': '上下文占用 —',
      'metric.context.pending': '尚无上下文样本',
      'metric.tokens': '输入、输出与缓存合计计费 token',
      'metric.split': '未缓存输入 · 输出',
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
      'fx.off': '关闭特效',
      'fx.on': '开启特效',
      'pixel.off': '低帧',
      'pixel.on': '低帧 开',
      'pixel.title.off': '把动画降到低帧率（适合远程桌面 / 软件渲染）',
      'pixel.title.on': '低帧模式已开启 — 点击恢复平滑动画',
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
    }

    return { inject, apply };
  },
});
