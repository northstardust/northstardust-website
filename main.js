/* North Stardust — behaviour layer.
   Every feature here is progressive enhancement: the site is fully usable,
   readable and (for the contact form) submittable with this file absent.
   Sections:
     1. Reveal-on-scroll
     2. Page transitions (slide in/out) + "always show the top" on navigate
     3. Content sync from assets/Website Texts.md
     4. Founder role width match (letter-spacing solved to fit the name)
     5. Stardust cursor trail
     6. Contact form validation + /api/contact submission
   All motion respects prefers-reduced-motion. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Reveal-on-scroll ---------- */
  (function reveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      for (var i = 0; i < targets.length; i++) targets[i].classList.add('is-in');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) { observer.observe(el); });
  })();

  /* ---------- 2. Page transitions ----------
     Only <main> animates — the starfield background, header and footer
     live outside it and are never touched, so they read as one
     persistent frame across navigations instead of flashing away and
     back with every click. */
  (function pageTransitions() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    window.addEventListener('pageshow', function () { window.scrollTo(0, 0); });

    var content = document.getElementById('main');
    if (!content) return;

    if (reducedMotion) {
      content.classList.remove('page-enter');
      return;
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { content.classList.remove('page-enter'); });
    });

    var TRANSITION_MS = 320;

    document.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = event.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      var url;
      try { url = new URL(link.href, window.location.href); }
      catch (e) { return; }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return; // in-page anchor
      var isHtmlPage = /\.html$|\/$/.test(url.pathname) || url.pathname === window.location.pathname;
      if (!isHtmlPage) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      content.classList.add('page-exit');
      window.setTimeout(function () { window.location.href = link.href; }, TRANSITION_MS);
    });
  })();

  /* ---------- 3. Content sync from assets/Website Texts.md ----------
     The static HTML already carries the current copy (first paint, SEO,
     no-JS all work without this). When the fetch succeeds — i.e. the page
     is served over http(s), not opened as a local file — the same
     containers are refreshed from the source file, so editing
     Website Texts.md is enough to update the live copy without touching
     any HTML. Fails silently; the static copy is the fallback, not a
     duplicate that can drift unnoticed, since editors are told to treat
     the .md file as the source of truth. */
  (function syncContent() {
    var containers = document.querySelectorAll('[data-content]');
    if (!containers.length) return;

    fetch('assets/Website Texts.md', { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.text() : null; })
      .then(function (text) {
        if (!text) return;
        var sections = parseSections(text);

        applyParagraphs('the-studio', sections['the studio']);
        applyParagraphs('the-compass', sections['the compass']);
        applyParagraphs('the-horizon', sections['the horizon']);
        applyParagraphs('lets-connect', sections["let's connect"] || sections['lets connect']);
        applyParagraphs('founder-bio', sections['founder & creative director']);
      })
      .catch(function () { /* offline, opened from disk, or fetch blocked — keep static copy */ });

    function parseSections(text) {
      var lines = text.split(/\r?\n/);
      var sections = {};
      var current = null;
      var para = [];

      function flushPara() {
        if (current && para.length) {
          sections[current].push(para.join(' ').trim());
        }
        para = [];
      }

      lines.forEach(function (line) {
        var heading = /^##\s+(.+?)\s*$/.exec(line);
        if (heading) {
          flushPara();
          current = heading[1].toLowerCase().replace(/\.+$/, '').trim();
          if (!sections[current]) sections[current] = [];
          return;
        }
        if (/^-{3,}\s*$/.test(line)) {
          // A "---" divider always separates sections in Website Texts.md —
          // what follows is either a new "## Heading" (which sets `current`
          // itself) or a bare page-title line ("The Contact Page") that
          // belongs to no section. Reset here so that page-title line isn't
          // swept into the paragraphs of whatever heading preceded it.
          flushPara();
          current = null;
          return;
        }
        if (line.trim() === '') { flushPara(); return; }
        para.push(line.trim());
      });
      flushPara();
      return sections;
    }

    function applyParagraphs(key, paragraphs) {
      if (!paragraphs || !paragraphs.length) return;
      var el = document.querySelector('[data-content="' + key + '"]');
      if (!el) return;
      var existing = el.querySelectorAll(':scope > p:not(.founder__role)');
      if (!existing.length) return;
      var frag = document.createDocumentFragment();
      paragraphs.forEach(function (text) {
        var p = document.createElement('p');
        p.textContent = text;
        frag.appendChild(p);
      });
      existing.forEach(function (p) { p.remove(); });
      el.appendChild(frag);
    }
  })();

  /* ---------- 4. Founder role width match ----------
     Website.txt: the role line's letter-spacing should "fit exactly the
     size of length of the name" above it. Letter-spacing is measured and
     solved for at runtime (fonts must be loaded first) rather than fixed
     in CSS, since the target width changes with viewport/font size. Falls
     back to the CSS default (--ls-wider, 18%) if measurement is ever
     unusable — e.g. before fonts load, or a width that would compress or
     overlap letters.

     Both elements are block-level (h2, p) inside a flex column, so their
     own getBoundingClientRect().width is the width of that column, not
     of the text inside it — measuring that way always "matched" trivially
     without the visible text actually lining up. Range.getBoundingClientRect()
     on the text node gives the true rendered glyph-run width instead. */
  (function matchFounderRoleWidth() {
    var name = document.querySelector('.founder__card h2');
    var role = document.querySelector('.founder__role');
    if (!name || !role) return;

    function textWidth(el) {
      var range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().width;
    }

    function apply() {
      role.style.letterSpacing = '0px';
      var naturalWidth = textWidth(role);
      var targetWidth = textWidth(name);
      var charCount = role.textContent.length;
      if (!charCount || !naturalWidth || !targetWidth) { role.style.letterSpacing = ''; return; }

      var spacing = (targetWidth - naturalWidth) / charCount;
      var minSpacing = parseFloat(getComputedStyle(role).fontSize) * 0.02;
      if (!isFinite(spacing) || spacing < minSpacing) {
        role.style.letterSpacing = '';
        return;
      }
      role.style.letterSpacing = spacing + 'px';

      // One correction pass: the linear estimate is very close but rounding
      // and sub-pixel kerning can leave a fraction of a pixel of error:
      // nudge once more against the now-actual rendered width.
      var resultWidth = textWidth(role);
      var residual = targetWidth - resultWidth;
      if (Math.abs(residual) > 0.5) {
        spacing += residual / charCount;
        if (isFinite(spacing) && spacing >= minSpacing) {
          role.style.letterSpacing = spacing + 'px';
        }
      }
    }

    function run() { requestAnimationFrame(apply); }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(run, 150);
    });
  })();

  /* ---------- 5. Stardust cursor trail ----------
     Fine-pointer devices only (real touch surfaces have no hover cursor to
     trail), and never under reduced motion. Capped particle count and a
     spawn throttle keep it cheap: opacity + transform only, no layout. */
  (function stardustTrail() {
    if (reducedMotion) return;
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;

    var canvas = document.querySelector('.stardust-trail');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var particles = [];
    var MAX_PARTICLES = 60;
    var lastSpawn = 0;
    var SPAWN_EVERY_MS = 45;

    window.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      var now = performance.now();
      if (now - lastSpawn < SPAWN_EVERY_MS) return;
      lastSpawn = now;
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x: event.clientX,
        y: event.clientY,
        r: 1 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15 + 0.05,
        life: 1,
      });
    });

    var rafId;
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.life -= 0.018;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;
        ctx.beginPath();
        ctx.globalAlpha = Math.max(p.life, 0) * 0.75;
        ctx.fillStyle = '#F2D68A';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(rafId); }
      else { rafId = requestAnimationFrame(tick); }
    });
  })();

  /* ---------- 6. Contact form ---------- */
  (function contactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var status = form.querySelector('.contact-form__status');
    var submitBtn = form.querySelector('.contact-form__submit');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var fields = {};
    form.querySelectorAll('.field').forEach(function (wrap) {
      var name = wrap.getAttribute('data-field');
      if (!name) return;
      var control = wrap.querySelector('input, textarea');
      fields[name] = { wrap: wrap, control: control };

      control.addEventListener('focus', function () {
        if (control.placeholder) {
          control.dataset.placeholder = control.placeholder;
          control.placeholder = '';
        }
      });

      control.addEventListener('blur', function () {
        if (control.dataset.placeholder && !control.placeholder) {
          control.placeholder = control.dataset.placeholder;
        }
        wrap.classList.toggle('is-filled', control.value.trim() !== '');
      });

      control.addEventListener('input', function () {
        if (wrap.classList.contains('is-error') && isValid(name)) {
          wrap.classList.remove('is-error');
          control.setAttribute('aria-invalid', 'false');
        }
      });
    });

    function isValid(name) {
      var value = fields[name].control.value.trim();
      if (!value) return false;
      if (name === 'email') return emailRe.test(value);
      return true;
    }

    function setStatus(text, state) {
      status.textContent = text;
      if (state) status.setAttribute('data-state', state);
      else status.removeAttribute('data-state');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var allValid = true;
      Object.keys(fields).forEach(function (name) {
        var ok = isValid(name);
        fields[name].wrap.classList.toggle('is-error', !ok);
        fields[name].control.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) allValid = false;
      });

      if (!allValid) {
        setStatus('Please check the highlighted fields.', 'error');
        var firstInvalid = Object.keys(fields).find(function (name) { return !isValid(name); });
        if (firstInvalid) fields[firstInvalid].control.focus();
        return;
      }

      var payload = {
        firstName: fields.firstName.control.value.trim(),
        lastName: fields.lastName.control.value.trim(),
        email: fields.email.control.value.trim(),
        message: fields.message.control.value.trim(),
        company: form.querySelector('#company') ? form.querySelector('#company').value : '',
      };

      submitBtn.disabled = true;
      setStatus('Sending…');

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok && data.ok, data: data };
          });
        })
        .then(function (result) {
          submitBtn.disabled = false;
          if (result.ok) {
            setStatus('Thank you — your message has been sent.', 'success');
            form.reset();
            Object.keys(fields).forEach(function (name) {
              fields[name].wrap.classList.remove('is-filled', 'is-error');
            });
          } else if (result.data && result.data.fields) {
            Object.keys(result.data.fields).forEach(function (name) {
              if (fields[name]) fields[name].wrap.classList.add('is-error');
            });
            setStatus(result.data.error || 'Please check the highlighted fields.', 'error');
          } else {
            setStatus(
              (result.data && result.data.error) ||
              'Something went wrong. Please try again, or email northstardust.studio@gmail.com directly.',
              'error'
            );
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          setStatus('Something went wrong. Please try again, or email northstardust.studio@gmail.com directly.', 'error');
        });
    });
  })();
})();
