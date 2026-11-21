/* AVVENENTE — ontwerpvoorstel ITty Company */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(pointer: fine)').matches;
  var doc = document.documentElement;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(t) { t = cl(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- mobile: compact chapter cards (≤ ~55svh), photo stays visible ---------- */
  if (innerWidth < 900) {
    $$('.story__flow .ch:not(.ch--hero) .beat:not(.beat--2)').forEach(function (b) {
      var ps = $$(':scope > p.reveal', b), det = $(':scope > details.more', b);
      if (ps.length > 1) {
        if (!det) { det = document.createElement('details'); det.className = 'more reveal'; det.innerHTML = '<summary>Lees meer</summary>'; ps[0].after(det); }
        ps.slice(1).reverse().forEach(function (p) { p.classList.remove('reveal'); det.querySelector('summary').after(p); });
      }
      var rest = []; var n = det || ps[0]; if (!n) return;
      while (n.nextSibling) { rest.push(n.nextSibling); n = n.nextSibling; }
      if (!rest.some(function (x) { return x.nodeType === 1; })) return;
      var nb = document.createElement('div'); nb.className = 'beat beat--x';
      rest.forEach(function (x) { nb.appendChild(x); }); b.after(nb);
    });
  }

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    try {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    } catch (e) { lenis = null; }
  }
  function scrollToEl(el, off) {
    if (lenis) lenis.scrollTo(el, { offset: off || 0 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var el = document.querySelector(id); if (!el) return;
      e.preventDefault(); closeMenu();
      var off = el.classList.contains('ch') ? innerHeight * 0.08 : -110;
      scrollToEl(el, off);
    });
  });

  /* ---------- curtain (page transition) ---------- */
  var cur = $('#curtain'), curName = $('#curtainName');
  var ORDER = ['index.html', 'behandelingen.html', 'over-ons.html', 'contact.html'];
  var NAMES = { 'index.html': 'home', 'behandelingen.html': 'behandelingen', 'over-ons.html': 'over ons', 'contact.html': 'contact' };
  var here = document.body.dataset.page || 'index.html';
  function openCurtain() {
    if (!cur) return;
    cur.classList.remove('go', 'hide-down', 'hide-up', 'done');
    if (reduced) { cur.classList.add('done'); return; }
    cur.classList.add('open');
    var t0 = performance.now(), D = 1000, body = $('.curtain__body', cur);
    (function step(t) {
      var k = cl((t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      body.style.setProperty('--h', (e * 160).toFixed(1) + '%');
      cur.style.setProperty('--co', (1 - cl(k * 2.2)).toFixed(3));
      if (k < 1) requestAnimationFrame(step);
      else { cur.classList.add('done'); cur.classList.remove('open'); body.style.removeProperty('--h'); cur.style.removeProperty('--co'); }
    })(t0);
  }
  function leave(href) {
    var file = href.split('#')[0].split('/').pop() || 'index.html';
    if (!cur || reduced) { location.href = href; return; }
    doc.classList.remove('cdone');
    var back = ORDER.indexOf(file) < ORDER.indexOf(here);
    if (curName) curName.textContent = NAMES[file] || '';
    cur.classList.remove('done', 'open', 'go');
    cur.classList.add(back ? 'hide-up' : 'hide-down');
    void cur.offsetWidth;
    cur.classList.add('go');
    cur.classList.remove('hide-up', 'hide-down');
    setTimeout(function () { location.href = href; }, 680);
  }
  $$('a[href$=".html"], a[href*=".html#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
      var href = a.getAttribute('href'), file = href.split('#')[0];
      if (file === here && href.indexOf('#') > -1) return;
      e.preventDefault(); closeMenu(); leave(href);
    });
  });
  addEventListener('pageshow', function (e) { if (e.persisted) openCurtain(); });

  /* ---------- nav + mobile menu ---------- */
  var nav = $('#nav'), burger = $('.nav__burger'), mm = $('#mmenu');
  function closeMenu() { if (!mm) return; mm.hidden = true; burger.setAttribute('aria-expanded', 'false'); if (lenis) lenis.start(); }
  burger.addEventListener('click', function () {
    var open = mm.hidden; mm.hidden = !open; burger.setAttribute('aria-expanded', String(open));
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- open now (Europe/Amsterdam) ---------- */
  var HOURS = { 1: [540, 1200], 2: [540, 1200], 3: [540, 1200], 4: [540, 1200], 5: [540, 1260] };
  function amsNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var d = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[o.weekday];
      return { d: d, m: (+o.hour % 24) * 60 + (+o.minute) };
    } catch (e) { var n = new Date(); return { d: n.getDay() || 7, m: n.getHours() * 60 + n.getMinutes() }; }
  }
  function fmt(m) { return (m / 60 | 0) + ':' + ('0' + m % 60).slice(-2); }
  function openState() {
    var n = amsNow(), h = HOURS[n.d];
    if (h && n.m < h[0]) return { open: false, txt: 'Opent vandaag om 09:00', now: n };
    if (h && n.m < h[1]) {
      return { open: true, txt: (h[1] - n.m <= 30 ? 'Sluit om ' : 'Nu open · tot ') + fmt(h[1]), now: n };
    }
    if (n.d <= 4 || n.d === 7) return { open: false, txt: n.d === 7 ? 'Gesloten · opent maandag 09:00' : 'Gesloten · opent morgen 09:00', now: n };
    return { open: false, txt: 'Gesloten · opent maandag 09:00', now: n };
  }
  function paintOpen() {
    var s = openState();
    $$('[data-open]').forEach(function (el) { el.classList.toggle('is-open', s.open); var t = $('.t', el); if (t) t.textContent = s.txt; });
    var week = $('#week');
    if (week) {
      $$('li', week).forEach(function (li) {
        var d = +li.dataset.day, today = d === s.now.d;
        li.classList.toggle('today', today);
        var lab = li.firstElementChild, tag = $('.tday', li);
        if (today && !tag) { tag = document.createElement('span'); tag.className = 'tday'; tag.textContent = 'vandaag'; lab.appendChild(tag); }
        if (!today && tag) tag.remove();
        var sc = $('.scale', li), now = $('.now', li);
        if (today) {
          if (!now) { now = document.createElement('span'); now.className = 'now'; now.innerHTML = '<svg viewBox="0 0 20 30" width="12" height="18"><path d="M10 1C13 7 18 11 18 19a8 8 0 0 1-16 0C2 13 7 9 10 1z" fill="#FFA552"/></svg>'; sc.appendChild(now); }
          var x = cl((s.now.m - 420) / 900) * 100; now.style.left = x + '%';
          now.classList.toggle('off', !s.open);
          if (!s.open) now.querySelector('path').setAttribute('fill', '#6b5c7c');
        } else if (now) now.remove();
      });
      var ws = $('#weekstate'); if (ws) ws.textContent = s.open ? 'De kaars brandt: ' + s.txt.toLowerCase() + '.' : (HOURS[s.now.d] ? s.txt + '.' : 'Vandaag gesloten — de kaars is uit. ' + s.txt.replace('Gesloten · ', '') + '.');
    }
    var ph = $('.phero--contact'); if (ph) ph.classList.toggle('closed', !s.open);
  }
  paintOpen(); setInterval(paintOpen, 30000);

  /* ---------- split words + reveals ---------- */
  var rev = $$('.reveal');
  $$('.split').forEach(function (h) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = t; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'svg') walk(n);
      });
    })(h);
    rev.push(h);
  });
  rev = rev.concat($$('.plist.paint'), $$('.grp__media'), $$('#rlist'));
  function reveals() {
    var h = innerHeight;
    rev = rev.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.9 && r.bottom > -h) { el.classList.add('in'); return false; }
      return true;
    });
  }

  /* ---------- load sequence ---------- */
  function start() {
    doc.classList.add('loaded'); document.body.classList.add('loaded');
    openCurtain(); reveals(); tick();
  }
  if (document.readyState === 'complete') setTimeout(start, 30); else addEventListener('load', start);
  setTimeout(function () { if (!doc.classList.contains('loaded')) start(); }, 2500);

  /* ---------- pointer ---------- */
  var mx = 0, my = 0, sx = 0, sy = 0;
  addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  $$('.gcard').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); });
  });

  /* ---------- hero tabs (running highlight) ---------- */
  var bar = $('#tabbar'), tabs = $$('.tabs a'), ti = 0;
  function setTab(i) { ti = i; if (bar) bar.style.transform = 'translateX(' + i * 100 + '%)'; tabs.forEach(function (t, n) { t.classList.toggle('on', n === i); }); }
  if (bar) { setTab(0); if (!reduced) setInterval(function () { setTab((ti + 1) % tabs.length); }, 2600); tabs.forEach(function (t, n) { t.addEventListener('mouseenter', function () { setTab(n); }); }); }

  /* ---------- show more ---------- */
  $$('[data-more]').forEach(function (b) {
    var list = b.closest('.ch__in, .grp__txt').querySelector('.plist--more');
    b.addEventListener('click', function () { var o = list.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); b.textContent = o ? 'Toon minder' : 'Toon alles'; });
  });

  /* ---------- interactive 1: kies je finish ---------- */
  var finishKleur = false;
  $$('[data-finish]').forEach(function (box) {
    var st = { color: 'nude', type: 'new', art: false, off: false };
    var NAME = { nude: 'Melkwit nude', roze: 'Zacht roze', french: 'French', kleur: 'Kleur (gellak)', 'new': 'Nieuwe set', fill: 'Bijwerken', ext: 'Met iets verlenging', strong: 'Versteviging eigen nagels' };
    var priceEl = $('[data-price]', box), timeEl = $('[data-time]', box), wasEl = $('[data-was]', box), sumEl = $('[data-sum]', box), hint = $('[data-hint]', box), prev = $('[data-prev]', box);
    function dur(m) { var h = m / 60 | 0, r = m % 60; return h ? h + 'u' + (r ? ('0' + r).slice(-2) : '') : r + ' min'; }
    function base() {
      var nr = st.color === 'nude' || st.color === 'roze';
      if (st.type === 'new') return [90, 50];
      if (st.type === 'fill') return nr ? [75, 40] : [90, 45];
      if (st.type === 'ext') return [105, 55];
      return [105, 45];
    }
    var shown = 50;
    function render() {
      var b = base(), extraM = (st.art ? 15 : 0) + (st.off ? 15 : 0), extraE = (st.art ? 10 : 0) + (st.off ? 10 : 0);
      var total = b[1] + extraE, tm = b[0] + extraM;
      timeEl.textContent = dur(tm);
      wasEl.hidden = st.type !== 'strong';
      var from = shown, t0 = performance.now();
      (function roll(t) {
        var k = reduced ? 1 : cl((t - t0) / 500), v = Math.round(lerp(from, total, ease(k)));
        priceEl.textContent = '€' + v; if (k < 1) requestAnimationFrame(roll); else shown = total;
      })(t0);
      var s = NAME[st.color] + ', ' + NAME[st.type] + ': €' + total + ', ongeveer ' + dur(tm);
      if (extraM) s += ' (' + dur(b[0]) + ' + ' + extraM + ' min = ' + dur(tm) + ', €' + b[1] + ' + €' + extraE + ')';
      sumEl.textContent = s;
      var extBtn = $('[data-g=type] [data-v=ext]', box), nr = st.color === 'nude' || st.color === 'roze';
      extBtn.disabled = !nr; hint.textContent = nr ? '' : 'Met iets verlenging: alleen bij roze/nude';
      $$('[data-g] .pill', box).forEach(function (p) {
        var g = p.parentNode.dataset.g, v = p.dataset.v;
        if (g === 'opt') p.setAttribute('aria-pressed', String(!!st[v])); else p.setAttribute('aria-checked', String(st[g] === v));
        if (g !== 'opt') p.tabIndex = st[g] === v ? 0 : -1;
      });
      if (prev) { prev.classList.toggle('kleur', st.color === 'kleur'); prev.classList.remove('flash'); void prev.offsetWidth; prev.classList.add('flash'); }
      if (!prev) finishKleur = st.color === 'kleur';
    }
    $$('[data-g] .pill', box).forEach(function (p) {
      p.addEventListener('click', function () {
        var g = p.parentNode.dataset.g, v = p.dataset.v;
        if (g === 'opt') st[v] = !st[v];
        else { st[g] = v; if (g === 'color' && v !== 'nude' && v !== 'roze' && st.type === 'ext') st.type = 'fill'; }
        render();
      });
      p.addEventListener('keydown', function (e) {
        var g = p.parentNode.dataset.g; if (g === 'opt') return;
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].indexOf(e.key) < 0) return;
        e.preventDefault();
        var ps = $$('.pill:not(:disabled)', p.parentNode), i = ps.indexOf(p) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
        var nx = ps[(i + ps.length) % ps.length]; nx.focus(); nx.click();
      });
    });
    render();
  });

  /* ---------- interactive 2: lash style ---------- */
  var LTXT = {
    classic: 'Eén extension per eigen wimper. Een strakke, natuurlijke lijn die je ogen iets meer definitie geeft. Fijn als je wilt dat het mooi is, maar niet opvalt dat er iets gedaan is.',
    volume: 'Meerdere superdunne extensions als waaiertje op één wimper. Voller, zachter en donzig, zonder zwaar te ogen. Voor wie van een uitgesproken, maar zachte look houdt.',
    lift: 'Geen extensions: je eigen wimpers worden vanaf de basis opgekruld. Ze ogen langer en je blik wordt opener. Voor wie het natuurlijk wil houden en geen onderhoud aan extensions wil.'
  };
  $$('[data-lash]').forEach(function (box) {
    var g = $('.ls', box), txt = $('[data-txt]', box), N = 30, F = 5, SVGNS = 'http://www.w3.org/2000/svg', paths = [], tips = [];
    for (var i = 0; i < N; i++) for (var f = 0; f < F; f++) { var p = document.createElementNS(SVGNS, 'path'); p.setAttribute('class', 'l'); g.appendChild(p); paths.push(p); }
    for (i = 0; i < N; i += 3) { var c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('class', 'tip'); c.setAttribute('r', '1.3'); g.appendChild(c); tips.push(c); }
    function q(t) { var a = 1 - t; return { x: a * a * 18 + 2 * a * t * 160 + t * t * 302, y: a * a * 34 + 2 * a * t * 112 + t * t * 34, dx: 2 * a * 142 + 2 * t * 142, dy: 2 * a * 78 - 2 * t * 78 }; }
    function build(style) {
      var k = 0, tk = 0;
      for (var i = 0; i < N; i++) {
        var t = .06 + .88 * i / (N - 1), b = q(t), len = Math.hypot(b.dx, b.dy), nx = -b.dy / len, ny = b.dx / len;
        var edge = Math.sin(Math.PI * t), L = style === 'lift' ? 14 + 10 * edge : style === 'volume' ? 18 + 16 * edge : 16 + 14 * edge;
        var base = Math.atan2(ny, nx) + (t - .5) * .5;
        for (var f = 0; f < F; f++) {
          var spread = style === 'volume' ? (f - 2) * .2 : 0, a = base + spread;
          var ex = b.x + Math.cos(a) * L, ey = b.y + Math.sin(a) * L;
          var curl = style === 'lift' ? -L * .9 : style === 'volume' ? -L * .35 : -L * .25;
          var px = -Math.sin(a), py = Math.cos(a), side = t < .5 ? 1 : -1;
          var cx = b.x + Math.cos(a) * L * .55 + px * curl * .3 * side, cy = b.y + Math.sin(a) * L * .55 + py * curl * .3 * side;
          if (style === 'lift') { ex = b.x + Math.cos(a) * L * .7 + (t - .5) * 6; ey = b.y + L * .2; cy = b.y + L * .9; cx = b.x + Math.cos(a) * L * .4; }
          var pth = paths[k++];
          pth.setAttribute('d', 'M' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1));
          pth.style.opacity = (style === 'volume' || f === 2) ? (style === 'volume' ? .7 : 1) : 0;
          if (f === 2 && i % 3 === 0) { tips[tk].setAttribute('cx', ex.toFixed(1)); tips[tk].setAttribute('cy', ey.toFixed(1)); tk++; }
        }
      }
    }
    var pills = $$('.pill', box);
    function set(v) {
      build(v); txt.textContent = LTXT[v];
      pills.forEach(function (p) { var on = p.dataset.v === v; p.setAttribute('aria-checked', String(on)); p.tabIndex = on ? 0 : -1; });
    }
    pills.forEach(function (p, n) {
      p.addEventListener('click', function () { set(p.dataset.v); });
      p.addEventListener('keydown', function (e) {
        if (['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return; e.preventDefault();
        var nx = pills[(n + (e.key === 'ArrowRight' ? 1 : -1) + pills.length) % pills.length]; nx.focus(); set(nx.dataset.v);
      });
    });
    set('classic');
  });

  /* ---------- particles (embers / steam / sparks) ---------- */
  var fxList = [];
  function FX(cv) {
    var ctx = cv.getContext('2d'), kind = cv.dataset.fx, P = [], S = [], W = 0, H = 0, vis = false;
    var dpr = Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2);
    cv._steam = 0;
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function ember(init) { return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: .5 + Math.random() * 1.9, vy: -(.18 + Math.random() * .5), vx: -.12 + Math.random() * .24, ph: Math.random() * 6.28, warm: Math.random() < .7 }; }
    function spark() { return { x: W * (.2 + Math.random() * .6), y: -10, vy: .8 + Math.random() * 1.6, vx: -.4 + Math.random() * .8, life: 1, r: .8 + Math.random() * 1.4 }; }
    function puff(init) { return { x: W * (.45 + Math.random() * .5), y: init ? H * Math.random() : H * (.75 + Math.random() * .3), r: 40 + Math.random() * 90, vy: -(.25 + Math.random() * .4), a: 0, life: 0, ph: Math.random() * 6.28 }; }
    size();
    var n = Math.round(W * H / (kind === 'sparks' ? 9000 : 15000));
    for (var i = 0; i < n; i++) P.push(ember(true));
    var puffs = []; for (i = 0; i < 14; i++) puffs.push(puff(true));
    addEventListener('resize', size);
    new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(cv);
    var t = 0;
    fxList.push(function () {
      if (!vis || reduced || document.hidden) return; t += .016;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      if (cv._steam > .01) {
        puffs.forEach(function (p, i) {
          p.y += p.vy; p.x += Math.sin(t * .5 + p.ph) * .3; p.life += .004;
          if (p.y < -p.r || p.life > 1) puffs[i] = puff(false);
          var a = Math.sin(Math.PI * cl(p.life)) * .12 * cv._steam;
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, 'rgba(245,238,228,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(245,238,228,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        });
      }
      P.forEach(function (p, i) {
        p.y += p.vy; p.x += p.vx + Math.sin(t * .8 + p.ph) * .18;
        if (p.y < -10) P[i] = ember(false);
        var al = .2 + .25 * Math.sin(t * 2.2 + p.ph);
        ctx.fillStyle = (p.warm ? 'rgba(255,165,82,' : 'rgba(255,224,190,') + al.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.4, 0, 6.28); ctx.globalAlpha = .25; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      });
      if (kind === 'sparks') {
        if (Math.random() < .08 && S.length < 40) S.push(spark());
        S = S.filter(function (s) {
          s.y += s.vy; s.x += s.vx; s.vy *= .995; s.life -= .006;
          ctx.strokeStyle = 'rgba(255,190,120,' + (s.life * .8).toFixed(2) + ')'; ctx.lineWidth = s.r;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6); ctx.stroke();
          return s.life > 0 && s.y < H + 20;
        });
      }
      ctx.globalCompositeOperation = 'source-over';
    });
    return cv;
  }
  $$('canvas.fx').forEach(FX);

  /* ---------- HOME STORY ---------- */
  var storyFrame = function () {};
  var stage = $('#stage');
  if (stage) (function () {
    var IW = 1344, IH = 752;
    var layers = $$('.bg', stage), chs = $$('.story__flow .ch'), bgs = $('#bgs');
    var flameEl = $('#flamelight'), bigword = $('#bigword'), vb = $('#vb'), rail = $('#rail'), railn = $('#railn'), dots = $$('.rail__dots button');
    var veil = $('#veil'), sfb = $('#sfb'), streak = $('#streak'), win = $('#winglow'), halos = $('#halos'), sfx = $('#storyfx'), hero = chs[0];
    /* focal points (fraction of frame): px = object-position x; f = flame-light point; o = zoom origin */
    var FR = [
      { px: .67, f: [.67, .30], o: [.67, .47] },
      { px: .74, f: [.71, .14], o: [.86, .80] },
      { px: .86, f: [.87, .55], o: [.87, .55] },
      { px: .72, f: [.985, .38], o: [.66, .66] },
      { px: .72, f: [.985, .38], o: [.66, .66] },
      { px: .64, f: [.62, .78], o: [.62, .6] },
      { px: .76, f: [.83, .82], o: [.72, .62] },
      { px: .68, f: [.70, .61], o: [.70, .61] },
      { px: .80, f: [.81, .64], o: [.81, .52] }
    ];
    var WORDS = ['', 'rust', 'biab', 'nude', 'kleur', 'lashes', 'pedicure', 'aandacht', 'kaatsheuvel'];
    var CANDLES = [[.58, .215], [.69, .215], [.78, .215], [.815, .215], [.675, .62], [.715, .6]];
    var WIN = [.71, .31, .905, .71];
    var halosEls = CANDLES.map(function (c, i) { var d = document.createElement('div'); d.className = 'glow'; d.style.animationDelay = (-i * .7) + 's'; d.style.animationDuration = (2.4 + i * .37) + 's'; halos.appendChild(d); return d; });
    var W = 0, H = 0;
    function measure() { W = stage.clientWidth; H = stage.clientHeight; layers.forEach(function (l, i) { l.style.setProperty('--px', FR[i].px * 100 + '%'); }); }
    function geo(i) { var s = Math.max(W / IW, H / IH), iw = IW * s, ih = IH * s; return { s: s, ox: (W - iw) * FR[i].px, oy: (H - ih) * .5, iw: iw, ih: ih }; }
    function pt(i, fx, fy, S, O) { var g = geo(i), x = g.ox + fx * g.iw, y = g.oy + fy * g.ih; if (S && O) { x = O[0] + S * (x - O[0]); y = O[1] + S * (y - O[1]); } return [x, y]; }
    measure(); addEventListener('resize', function () { measure(); tick(); });
    var active = -1, fl = null, kf = 0, wordTimer;
    function setMask(el, v) { el.style.webkitMaskImage = v; el.style.maskImage = v; }
    function frameFn() {
      var vh = innerHeight, T = [], tops = [];
      chs.forEach(function (c, k) { var r = c.getBoundingClientRect(); tops[k] = r; T[k] = k === 0 ? 1 : cl((vh - r.top) / (vh * .75)); });
      var act = 0; for (var k = 1; k < T.length; k++) if (T[k] > .5) act = k;
      /* hero dissolve */
      var ho = cl((tops[0].bottom - vh * .3) / (vh * .55));
      stage.style.setProperty('--ho', ho.toFixed(3)); hero.style.setProperty('--ho', ho.toFixed(3));
      /* layers */
      var flTarget = null, mob = W < 900, ZH = mob ? .22 : 1.6, veilV = 0;
      layers.forEach(function (L, i) {
        var t = T[i], e = ease(t), r = tops[i];
        var kb = cl((vh - r.top) / (r.height + vh)), S = 1.08 - .08 * kb, O = pt(i, FR[i].o[0], FR[i].o[1]);
        var op = i === 0 ? 1 : (t > 0 ? 1 : 0), mask = 'none', clip = 'none';
        var next = T[i + 1] || 0;
        if (i === 0) { S = 1.04 - .04 * (1 - ho) + ZH * ease(T[1]); }
        if (i === 1) { S = S + (mob ? .12 : .5) * (1 - e); }
        if (i === 7) { S = 1 + (mob ? .22 : 1.3) * (1 - ease(cl((t - .5) * 2))) - .05 * kb; }
        var VEIL = i === 2 || i === 3 || i === 5 || i === 6 || i === 7;
        if (VEIL && t > 0 && t < 1) { veilV = Math.max(veilV, ease(cl(1 - Math.abs(t - .5) / .36))); if (i !== 7) S *= 1 + .1 * (1 - ease(cl((t - .5) * 2))); }
        if (t > 0 && t < 1 && i > 0) {
          var pv = Math.max(0, i - 1), R;
          if (VEIL) { op = t >= .5 ? 1 : 0; }
          else if (i === 1) {
            var src = pt(0, FR[0].f[0], FR[0].f[1], 1.04 + ZH * ease(T[1]), pt(0, FR[0].o[0], FR[0].o[1]));
            R = e * Math.hypot(W, H) * 1.05;
            mask = 'radial-gradient(circle at ' + src[0].toFixed(0) + 'px ' + src[1].toFixed(0) + 'px, #000 ' + Math.max(0, R - 140).toFixed(0) + 'px, transparent ' + R.toFixed(0) + 'px)';
          } else if (i === 4) {
            var a = e * 130 - 15; mask = 'linear-gradient(225deg, #000 ' + a.toFixed(1) + '%, transparent ' + (a + 16).toFixed(1) + '%)';
          } else if (i === 5) {
            var a5 = e * 130 - 15; mask = 'linear-gradient(35deg, #000 ' + a5.toFixed(1) + '%, transparent ' + (a5 + 10).toFixed(1) + '%)';
          } else if (i === 6) {
            var a6 = e * 125 - 12; mask = 'linear-gradient(0deg, #000 ' + a6.toFixed(1) + '%, transparent ' + (a6 + 9).toFixed(1) + '%)';
          } else if (i === 8) {
            var g = geo(8), x0 = g.ox + WIN[0] * g.iw, y0 = g.oy + WIN[1] * g.ih, x1 = g.ox + WIN[2] * g.iw, y1 = g.oy + WIN[3] * g.ih;
            clip = 'inset(' + (y0 * (1 - e)).toFixed(0) + 'px ' + ((W - x1) * (1 - e)).toFixed(0) + 'px ' + ((H - y1) * (1 - e)).toFixed(0) + 'px ' + (x0 * (1 - e)).toFixed(0) + 'px round ' + (14 * (1 - e)).toFixed(0) + 'px)';
          } else { op = e; }
        }
        if (i === 4 && act === 3 && kf > .001) { op = kf; mask = 'none'; }
        if (next >= 1) op = 0; /* fully covered: hide */
        L.style.opacity = op;
        L.style.transformOrigin = O[0].toFixed(0) + 'px ' + O[1].toFixed(0) + 'px';
        L.style.transform = 'scale(' + S.toFixed(4) + ')';
        setMask(L, mask); L.style.clipPath = clip;
        if (i === act) flTarget = pt(i, FR[i].f[0], FR[i].f[1], S, O);
        if (i === 7) {
          halosEls.forEach(function (h, n) { var p = pt(7, CANDLES[n][0], CANDLES[n][1], S, O); h.style.left = p[0] + 'px'; h.style.top = p[1] + 'px'; h.style.setProperty('--s', (n > 3 ? 16 : 10) * S + 'vmin'); });
          halos.style.opacity = (act === 7 ? 1 : 0) * op;
        }
      });
      if (act === 0) flTarget = pt(0, FR[0].f[0], FR[0].f[1], 1.04 - .04 * (1 - ho) + ZH * ease(T[1]), pt(0, FR[0].o[0], FR[0].o[1]));
      veil.style.opacity = veilV.toFixed(3);
      if (flTarget) { veil.style.setProperty('--vx', flTarget[0].toFixed(0) + 'px'); veil.style.setProperty('--vy', flTarget[1].toFixed(0) + 'px'); }
      /* window glow on frame 8 */
      var g8 = geo(8);
      win.style.left = g8.ox + WIN[0] * g8.iw + 'px'; win.style.top = g8.oy + WIN[1] * g8.ih + 'px'; win.style.width = (WIN[2] - WIN[0]) * g8.iw + 'px'; win.style.height = (WIN[3] - WIN[1]) * g8.ih + 'px';
      win.style.opacity = T[8] >= 1 ? 1 : 0;
      /* streak for lashes */
      var t5 = T[5];
      if (t5 > 0 && t5 < 1) { var e5 = ease(t5), d = Math.hypot(W, H); streak.style.opacity = Math.sin(Math.PI * t5).toFixed(3); streak.style.transform = 'translate(' + ((e5 - .5) * d * .62).toFixed(0) + 'px,' + (-(e5 - .5) * d * .44).toFixed(0) + 'px) rotate(-55deg)'; }
      else streak.style.opacity = 0;
      if (sfx) sfx._steam = act === 6 ? 1 : 0;
      /* fade at the end */
      var last = tops[tops.length - 1];
      stage.style.setProperty('--fo', cl((vh * 1.55 - last.bottom) / (vh * .4)).toFixed(3));
      if (act !== active) {
        active = act;
        clearTimeout(wordTimer); bigword.style.opacity = 0;
        wordTimer = setTimeout(function () { bigword.textContent = WORDS[act]; bigword.style.opacity = 1; }, reduced ? 0 : 350);
        vb.classList.toggle('on', act >= 3 && act <= 6); sfb.classList.toggle('on', act === 8);
        rail.classList.toggle('on', act > 0);
        railn.innerHTML = ('0' + Math.max(1, act)).slice(-2) + ' <small>/ 08</small>';
        dots.forEach(function (d, n) { d.classList.toggle('on', n + 1 === act); });
      }
      fl = fl || flTarget.slice(); stage._fl = flTarget;
    }
    dots.forEach(function (d) { d.addEventListener('click', function () { scrollToEl(chs[+d.dataset.go], innerHeight * 0.08); }); });
    storyFrame = frameFn;
    /* continuous: flame-light glide + flicker, pointer parallax, kleur crossfade */
    fxList.push(function () {
      if (!stage._fl) return;
      var tk = finishKleur && active === 3 ? 1 : 0;
      if (kf !== tk) { kf += (tk - kf) * (reduced ? 1 : .08); if (Math.abs(tk - kf) < .005) kf = tk; frameFn(); }
      fl[0] += (stage._fl[0] - fl[0]) * .08; fl[1] += (stage._fl[1] - fl[1]) * .08;
      flameEl.style.transform = 'translate3d(' + (fl[0] + sx * 12).toFixed(1) + 'px,' + (fl[1] + sy * 12).toFixed(1) + 'px,0)';
      if (!reduced) { bgs.style.transform = 'translate3d(' + (sx * -16).toFixed(1) + 'px,' + (sy * -12).toFixed(1) + 'px,0)'; bigword.style.transform = 'translate3d(' + (sx * 10).toFixed(1) + 'px,' + (sy * 8).toFixed(1) + 'px,0)'; }
    });
  })();

  /* ---------- marquee (speeds up with scroll) ---------- */
  var mq = $('#mq'), mqx = 0, lastY = scrollY, vel = 0;
  /* ---------- themes light up ---------- */
  var tl = $$('#tlist li');
  /* ---------- manifest words ---------- */
  var mw = [];
  $$('.manifest p').forEach(function (p) {
    var words = p.textContent.split(/\s+/); p.textContent = '';
    words.forEach(function (w, i) { var s = document.createElement('span'); s.className = 'mw'; s.textContent = w; p.appendChild(s); if (i < words.length - 1) p.appendChild(document.createTextNode(' ')); mw.push(s); });
  });
  /* ---------- wick line (behandelingen) ---------- */
  var wstops = $$('#wstops a'), wflame = $('.wick__flame'), wburn = $('#wburn'), wgroups = wstops.map(function (a) { return $(a.getAttribute('href')); });
  /* ---------- parallax ---------- */
  var badge = $('.badge'), pars = $$('[data-par]'), mpar = $$('[data-mpar]'), finFlame = $('#finale .finale__flame');

  function tick() {
    var vh = innerHeight;
    nav.classList.toggle('solid', scrollY > 30);
    if (badge) badge.classList.toggle('away', innerWidth < 900 && scrollY > innerHeight * .4);
    reveals(); storyFrame();
    pars.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
      var d = (r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.par);
      el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
    });
    tl.forEach(function (li) { var r = li.getBoundingClientRect(); li.classList.toggle('lit', r.top + r.height / 2 < vh * .72); });
    if (mw.length) {
      var lim = vh * .62;
      mw.forEach(function (s) { var r = s.getBoundingClientRect(); s.classList.toggle('lit', r.top < lim); });
    }
    if (wstops.length) {
      var idx = 0, frac = 0;
      wgroups.forEach(function (g, i) { if (g && g.getBoundingClientRect().top < vh * .45) idx = i; });
      var g = wgroups[idx], nxt = wgroups[idx + 1];
      if (g && nxt) { var a = g.getBoundingClientRect().top, b = nxt.getBoundingClientRect().top; frac = cl((vh * .45 - a) / (b - a)); }
      wstops.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
      var p0 = wstops[idx], p1 = wstops[Math.min(idx + 1, wstops.length - 1)], par = p0.parentNode.getBoundingClientRect();
      var c0 = p0.getBoundingClientRect(), c1 = p1.getBoundingClientRect();
      var x = lerp(c0.left + c0.width / 2, c1.left + c1.width / 2, frac) - par.left;
      wflame.style.transform = 'translateX(' + x.toFixed(1) + 'px)'; wburn.style.width = x.toFixed(1) + 'px';
    }
  }
  var lastTick = 0;
  (function loop(ts) {
    requestAnimationFrame(loop);
    sx += (mx - sx) * .06; sy += (my - sy) * .06;
    if (!reduced) {
      mpar.forEach(function (im) { var r = im.getBoundingClientRect(); if (r.bottom < 0) return; im.style.translate = (sx * -22).toFixed(1) + 'px ' + (sy * -14 + Math.min(scrollY, innerHeight) * .18).toFixed(1) + 'px'; });
      if (mq) {
        var y = scrollY; vel = vel * .9 + Math.abs(y - lastY) * .1; lastY = y;
        mqx -= .5 + vel * .25; var half = mq.scrollWidth / 2; if (-mqx > half) mqx += half;
        mq.style.transform = 'translate3d(' + mqx.toFixed(1) + 'px,0,0)';
      }
      if (finFlame) finFlame.style.transform = 'skewX(' + (sx * -12).toFixed(2) + 'deg)';
    }
    fxList.forEach(function (f) { f(); });
  })(0);
  if (lenis) lenis.on('scroll', tick);
  addEventListener('scroll', tick, { passive: true });
  tick(); setTimeout(tick, 300);
})();
