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
