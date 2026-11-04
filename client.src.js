window.__ModuleLoader__.load({
  id: '@local/dsh-statusbar',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The portable, attribute-driven status-bar stylesheet, verbatim. */
    const CSS = __SB_CSS__;

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
      '.dsh-sb-shell [data-sb]{display:flex;align-items:center;flex-wrap:nowrap;width:100%;max-width:var(--sb-shell-max,980px);margin:0 auto;box-sizing:border-box;border:1px solid rgba(var(--sb-glow),.16);border-radius:10px}' +
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
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-flower,' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-dots i,' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-zzz i{animation-timing-function:steps(4,end)!important;text-shadow:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-status{text-shadow:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel] .sb-splash{display:none!important}' +
      '.dsh-sb-shell [data-sb][data-sb-pixel][data-sb-hover]{filter:none!important}' +
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
      '@media (prefers-reduced-motion:reduce){.dsh-sb-shell [data-sb]{animation:none!important}}';

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

    /* Where the card hangs off the strip. `above` is the original: left edges
       aligned, sitting over the strip. `corner` drops the card's bottom-right
       corner onto the strip's top-left corner, so it grows up and to the left
       like a menu pinned to that corner. */
    const ANCHOR_ABOVE = 'above';
    const ANCHOR_CORNER = 'corner';
    const CARD_W = 300;

    /* Flow lanes. `beads` is the original travelling-particle line; `ecg` is a
       flat heartbeat trace with one bright pulse sweeping it. Both read the same
       --sb-flow-dur, so both answer to the live token rate. */
    const FLOW_BEADS = 'beads';
    const FLOW_ECG = 'ecg';

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

      const stats = useFaceValue(props.useProjection, 'sessionStats');
      const usage = useFaceValue(props.useProjection, 'tokenUsage');
      const pressure = useFaceValue(props.useProjection, 'contextPressure');
      const breakdown = useFaceValue(props.useProjection, 'contextBreakdown');

      const [theme, setTheme] = React.useState(() => readStored(STORE_THEME, 'deepseek', THEME_IDS));
      const [lite, setLite] = React.useState(() => readStored(STORE_FX, 'off') === 'on');
      const [pixel, setPixel] = React.useState(() => readStored(STORE_PIXEL, prefersReduced() ? 'on' : 'off') === 'on');
      const [flowMode, setFlowMode] = React.useState(() =>
        readStored(STORE_FLOW, FLOW_BEADS) === FLOW_ECG ? FLOW_ECG : FLOW_BEADS,
      );
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
      const working = realWorking || demo;

      const barRef = React.useRef(null);
      const splashRef = React.useRef(null);
      const cardRef = React.useRef(null);
      const dragRef = React.useRef(null);
      const closeTimer = React.useRef(0);
      const workStart = React.useRef(0);
      const doneTimer = React.useRef(0);

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
         window edge and the strip's left edge. Measured on open, not per render. */
      React.useEffect(() => {
        if (!cardOpen) return;
        const bar = barRef.current;
        const rect = bar === null ? null : bar.getBoundingClientRect();
        setCornerOk(rect !== null && rect.left >= CARD_W + 16);
      }, [cardOpen]);

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
      const toggleFlowMode = () => {
        setFlowMode((previous) => {
          const next = previous === FLOW_ECG ? FLOW_BEADS : FLOW_ECG;
          writeStored(STORE_FLOW, next);
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
        setAnchor((previous) => {
          const next = previous === ANCHOR_CORNER ? ANCHOR_ABOVE : ANCHOR_CORNER;
          writeStored(STORE_ANCHOR, next);
          return next;
        });
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

      /* One label for every place the state is spoken: never claim a turn is
         running when it is only a rehearsal. */
      const stateLabel = demo ? t('state.demo') : working ? t('state.working') : t('state.idle');
      const flowTitle = working
        ? t(flowMode === FLOW_ECG ? 'flow.ecg.busy' : 'flow.busy') + (rate > 0 ? ' \u00B7 ' + Math.round(rate) + ' tok/s' : '')
        : t(flowMode === FLOW_ECG ? 'flow.ecg.idle' : 'flow.idle');


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
              h(
                'button',
                {
                  type: 'button',
                  className: 'sb-fx sb-flowmode',
                  title: flowMode === FLOW_ECG ? t('flowmode.title.ecg') : t('flowmode.title.beads'),
                  onClick: toggleFlowMode,
                },
                flowMode === FLOW_ECG ? t('flowmode.ecg') : t('flowmode.beads'),
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
      'flow.ecg.busy': 'heartbeat trace sweeping at the live token rate',
      'flow.ecg.idle': 'flatline - nothing decoding',
      'metric.cache': 'prompt tokens served from cache —',
      'metric.cache.pending': 'no cached prompt sample yet',
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
      'flowmode.beads': 'beads',
      'flowmode.ecg': 'bpm',
      'flowmode.title.beads': 'flowing token beads - click for a flat heartbeat trace',
      'flowmode.title.ecg': 'heartbeat trace at the live rate - click for flowing beads',
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
    };
    const zh = {
      'bar.label': '状态栏',
      'state.working': '工作中',
      'state.idle': '空闲',
      'flow.busy': '粒子按实时速率流动',
      'flow.idle': '粒子缓缓漂移',
      'flow.ecg.busy': '心电曲线按实时速率扫过',
      'flow.ecg.idle': '平线 — 当前没有解码',
      'metric.cache': '缓存命中的提示词比例 —',
      'metric.cache.pending': '尚无缓存样本',
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
      'flowmode.beads': '粒子',
      'flowmode.ecg': '心电',
      'flowmode.title.beads': '流动的 token 粒子 — 点击切换为平线心电',
      'flowmode.title.ecg': '实时速率的心电曲线 — 点击切回流动粒子',
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
