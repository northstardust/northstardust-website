/*# North Stardust — `main.js`

JavaScript is deliberately limited to behaviour:

- Desktop/Laptop profile classification.
- Six-state tracking.
- Header navigation.
- Header logo → Step 01 / page top.
- Mobile navigation.
- Website Texts synchronisation.
- Existing contact form validation/submission.
- No CSS layout recreation.
- No wheel/touch scrolling interception.
- No seventh state.
- No background animation.

*/
(() => {
  "use strict";

  const CONFIG = {
    breakpoints: {
      mobile: 768,
      layout: 1200,
      laptopHeight: 1250
    },
    contentUrl: "assets/Website_Texts.md"
  };

  const root = document.documentElement;

  const dom = {
    header: document.querySelector("[data-site-header]"),
    menuToggle: document.querySelector("[data-menu-toggle]"),
    mobileNavigation: document.querySelector("#mobile-navigation"),
    anchors: [...document.querySelectorAll(".state-anchor")],
    stage: document.querySelector(".landing-stage"),
    stageCanvas: document.querySelector(".stage-canvas"),
    contentNodes: [...document.querySelectorAll("[data-content]")],
    contactForm: document.querySelector("#contact-form")
  };

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ----------------------------------------------------------
     Viewport profile
     ---------------------------------------------------------- */

  function getViewportProfile() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width < CONFIG.breakpoints.mobile) return "mobile";
    if (width < CONFIG.breakpoints.layout) return "tablet";

    return height < CONFIG.breakpoints.laptopHeight
      ? "laptop"
      : "desktop";
  }

  function updateViewportProfile() {
    root.dataset.profile = getViewportProfile();
  }

  /* ----------------------------------------------------------
     Six-state tracking
     ---------------------------------------------------------- */

  function clampStep(step) {
    return Math.max(1, Math.min(6, step));
  }

  /*
    The anchors are hidden below 1200px, where the stage becomes a normal
    stacked document and no state tracking should happen at all.
  */
  function isStateTrackActive() {
    return (
      dom.anchors.length > 0 &&
      dom.anchors[0].getClientRects().length > 0
    );
  }

  function getAnchorForStep(step) {
    return dom.anchors.find(
      item => Number(item.dataset.step) === step
    );
  }

  function getAnchorTop(anchor) {
    return anchor.getBoundingClientRect().top + window.scrollY;
  }

  /*
    Measured against the anchors rather than against window.innerHeight.
    The anchors are sized in svh, which does not match innerHeight on mobile
    browsers with a collapsing URL bar, and the track does not start at
    scroll position zero.
  */
  function getStepFromScroll() {
    if (!isStateTrackActive()) return 1;

    const scrollY = window.scrollY;

    let closestStep = 1;
    let closestDistance = Infinity;

    for (const anchor of dom.anchors) {
      const step = Number(anchor.dataset.step);

      if (!step) continue;

      const distance = Math.abs(getAnchorTop(anchor) - scrollY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestStep = step;
      }
    }

    return clampStep(closestStep);
  }

  function setLandingStep(step) {
    const next = String(clampStep(step));

    if (root.dataset.landingStep === next) return;

    root.dataset.landingStep = next;
    updateStageScale();
  }

  /*
    Smallest scale the canvas is allowed to take.

    Chosen from the composition, not picked round: the body size is 20px, and
    0.8 renders it at 16px, which is the smallest size this text should be
    read at. Below that the state stops shrinking and becomes scrollable
    instead, so the type never falls under that floor.
  */
  const MIN_STAGE_SCALE = 0.8;

  /*
    Whether the active state still fits the stage at the scale it was given.

    Split out from updateStageScale because the state can grow after the scale
    was set - the message box does exactly that - and the answer has to be
    revisited without the canvas being resized under the reader.
  */
  function updateStageFit() {
    const stage = dom.stage;
    const canvas = dom.stageCanvas;

    if (!stage || !canvas) return;

    if (!isStateTrackActive()) {
      stage.dataset.stageFits = "true";
      return;
    }

    const scale =
      parseFloat(
        canvas.style.getPropertyValue("--stage-scale")
      ) || 1;

    /*
      The stage takes over the scrolling for a state that is still too tall
      rather than cutting the bottom off, and becomes focusable so it can be
      scrolled from the keyboard as well as the wheel.
    */
    const fits =
      canvas.scrollHeight * scale <= stage.clientHeight + 1;

    stage.dataset.stageFits = fits ? "true" : "false";

    if (fits) {
      stage.removeAttribute("tabindex");
      stage.removeAttribute("role");
      stage.removeAttribute("aria-label");
    } else {
      stage.setAttribute("tabindex", "0");
      stage.setAttribute("role", "group");
      stage.setAttribute("aria-label", "Scrollable section");
    }
  }

  /*
    Fits the authored state to the stage.

    The canvas keeps its authored layout at every size - scrollHeight is a
    layout value, so the transform already applied does not affect the
    measurement. min-height:100% means a state shorter than the stage measures
    exactly the stage height and scales at 1.

    Called on step change, resize and font load - never while the reader is
    typing, so the composition does not shift under a growing message box.
  */
  function updateStageScale() {
    const stage = dom.stage;
    const canvas = dom.stageCanvas;

    if (!stage || !canvas) return;

    if (!isStateTrackActive()) {
      canvas.style.removeProperty("--stage-scale");
      canvas.style.marginBottom = "";
      updateStageFit();
      return;
    }

    const available = stage.clientHeight;
    const needed = canvas.scrollHeight;

    if (!available || !needed) return;

    const exact = available / needed;
    const scale = Math.min(1, Math.max(MIN_STAGE_SCALE, exact));

    canvas.style.setProperty(
      "--stage-scale",
      String(Math.round(scale * 10000) / 10000)
    );

    /*
      A transform is painted, not laid out: the canvas still occupies its full
      authored height, so a scrolling stage would scroll past the shrunken
      composition into empty space. Pulling the difference back off the bottom
      makes the scrollable extent match what is actually drawn.
    */
    canvas.style.marginBottom =
      scale < 1 ? `${-Math.round(needed * (1 - scale))}px` : "";

    updateStageFit();
  }

  let scrollFrame = 0;

  /*
    Keeps the fragment honest once the reader is back at the top.

    Tapping a nav link writes its fragment into the URL, and nothing took it
    out again. That is invisible until the page reloads - and on a phone it
    reloads easily, because a long upward drag at the top of the document is
    pull-to-refresh. The reload then read a fragment naming a section the
    reader had already scrolled away from and sent them back to it, which is
    the opposite of what dragging upwards asks for.

    So the fragment is dropped when the top is actually reached. Deep links
    still work, and a fragment still survives for as long as the reader is
    somewhere below the top; it only stops outliving the journey.
  */
  function clearFragmentAtTop() {
    if (!window.location.hash) return;
    if (window.scrollY > 2) return;

    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  }

  function scheduleStepUpdate() {
    if (scrollFrame) return;

    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      setLandingStep(getStepFromScroll());
      clearFragmentAtTop();
    });
  }

  /* ----------------------------------------------------------
     Header navigation
     ---------------------------------------------------------- */

  const NAVIGATION_STEPS = {
    hero: 1,
    studio: 3,
    founder: 5,
    contact: 6
  };

  /*
    Returns false when there is nothing to scroll to, so the caller can leave
    the browser's own anchor navigation alone.
  */
  function scrollToTarget(target, behavior) {
    const step = NAVIGATION_STEPS[target];

    if (!step) return false;

    const mode =
      behavior ||
      (prefersReducedMotion() ? "auto" : "smooth");

    /*
      Tablet and Mobile are one continuous page, and the Hero is the first
      thing on it. Landing on the Hero's own top edge leaves the page a header
      short of the beginning, so the logo goes to the actual top instead - the
      only place from which the whole composition reads.
    */
    if (!isStateTrackActive() && target === "hero") {
      window.scrollTo({ top: 0, behavior: mode });
      setLandingStep(step);
      return true;
    }

    const destination = isStateTrackActive()
      ? getAnchorForStep(step)
      : document.getElementById(target);

    if (!destination) return false;

    destination.scrollIntoView({
      behavior: mode,
      block: "start"
    });

    setLandingStep(step);

    return true;
  }

  function bindHeaderNavigation() {
    document.querySelectorAll("[data-nav-target]").forEach(link => {
      link.addEventListener("click", event => {
        const target = link.dataset.navTarget;

        if (!NAVIGATION_STEPS[target]) return;

        /*
          Only take over the navigation once we know we can perform it.
          Otherwise the plain #hash link stays in charge.
        */
        if (!scrollToTarget(target)) return;

        event.preventDefault();

        history.replaceState(null, "", `#${target}`);

        closeMobileNavigation();
      });
    });

    /*
      Publishing intentionally has no interception.
      It remains a normal document navigation to publishing.html.
    */
  }

  /* ----------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------- */

  function isMobileNavigationOpen() {
    return Boolean(
      dom.mobileNavigation &&
      !dom.mobileNavigation.hidden
    );
  }

  function closeMobileNavigation() {
    if (!dom.menuToggle || !dom.mobileNavigation) return;

    dom.mobileNavigation.hidden = true;
    dom.menuToggle.setAttribute("aria-expanded", "false");
    dom.menuToggle.setAttribute("aria-label", "Open navigation");
  }

  function toggleMobileNavigation() {
    if (!dom.menuToggle || !dom.mobileNavigation) return;

    const isOpen =
      dom.menuToggle.getAttribute("aria-expanded") === "true";

    dom.mobileNavigation.hidden = isOpen;

    dom.menuToggle.setAttribute(
      "aria-expanded",
      String(!isOpen)
    );

    dom.menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation" : "Close navigation"
    );
  }

  function bindMobileNavigation() {
    if (!dom.menuToggle || !dom.mobileNavigation) return;

    dom.menuToggle.addEventListener(
      "click",
      toggleMobileNavigation
    );

    dom.mobileNavigation
      .querySelectorAll("a")
      .forEach(link => {
        link.addEventListener(
          "click",
          closeMobileNavigation
        );
      });

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape" || !isMobileNavigationOpen()) return;

      closeMobileNavigation();
      dom.menuToggle.focus();
    });

    document.addEventListener("pointerdown", event => {
      if (!isMobileNavigationOpen()) return;

      if (
        dom.mobileNavigation.contains(event.target) ||
        dom.menuToggle.contains(event.target)
      ) {
        return;
      }

      closeMobileNavigation();
    });
  }

  /* ----------------------------------------------------------
     Website Texts.md synchronisation
     ---------------------------------------------------------- */

  function normaliseKey(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function parseWebsiteText(markdown) {
    const lines = markdown
      .replace(/\r\n/g, "\n")
      .split("\n");

    const fields = {};
    const stack = [];

    let currentKey = null;
    let buffer = [];

    function commit() {
      if (!currentKey) return;

      const value = buffer.join("\n").trim();

      if (value) {
        fields[currentKey] = value;
      }

      buffer = [];
    }

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      const heading = line.match(
        /^(#{1,6})\s+(.+?)\s*$/
      );

      if (heading) {
        commit();

        const level = heading[1].length;

        stack.length = level - 1;
        stack[level - 1] = heading[2].trim();

        currentKey = stack
          .filter(Boolean)
          .map(normaliseKey)
          .join(".");

        continue;
      }

      const listItem = line.match(
        /^\s*(\d+)\.\s+(.+?)\s*$/
      );

      if (listItem && currentKey) {
        fields[
          `${currentKey}.${listItem[1]}`
        ] = listItem[2].trim();

        continue;
      }

      if (line.trim() === "---") {
        commit();
        continue;
      }

      if (currentKey) {
        buffer.push(line);
      }
    }

    commit();

    return fields;
  }

  /*
    Maps the stable key used in the HTML to the key the Markdown actually
    produces. Website_Texts.md uses top-level headings for most sections
    (# Compass, # Studio Works, # Founder ...) and a level-1 heading resets
    the key path, so only the Hero ends up under a "home." prefix.

    Keys with no Markdown source (the tool title, the Contact body copy)
    are intentionally absent and keep the fallback copy in the HTML.
  */
  const CONTENT_ALIASES = {
    "home.hero.label": ["home.hero.hero_label"],
    "home.hero.message": ["home.hero.hero_message"],
    "home.hero.description": ["home.hero.studio_description"],

    "home.compass.title": ["compass.section_label"],
    "home.compass.message": ["compass.message"],
    "home.compass.description": ["compass.description"],

    "home.studio.pillars.unique_ideas.message": [
      "studio.studio_pillars.unique_ideas"
    ],
    "home.studio.pillars.useful_tools.message": [
      "studio.studio_pillars.useful_tools"
    ],
    "home.studio.pillars.original_worlds.message": [
      "studio.studio_pillars.original_worlds"
    ],

    "home.studio.works.ideas.1": ["studio_works.ideas.1"],
    "home.studio.works.ideas.2": ["studio_works.ideas.2"],
    "home.studio.works.ideas.3": ["studio_works.ideas.3"],
    "home.studio.works.ideas.4": ["studio_works.ideas.4"],
    "home.studio.works.tool.message": ["studio_works.tool"],
    "home.studio.works.ip.message": ["studio_works.ip"],

    "home.horizon.title": ["horizon.section_label"],
    "home.horizon.message": ["horizon.message"],
    "home.horizon.description": ["horizon.description"],

    "home.about.text01": ["founder.text_01"],
    "home.about.text02": ["founder.text_02"],
    "home.about.text03": ["founder.text_03"],
    "home.about.mobile": ["founder.mobile_text"],

    "home.contact.title": ["contact.title"],

    "publishing.message": ["publishing.message"],
    "footer.copyright": ["footer.copyright"]
  };

  function resolveContentValue(fields, key) {
    if (fields[key] != null) {
      return fields[key];
    }

    for (const alias of CONTENT_ALIASES[key] || []) {
      if (fields[alias] != null) {
        return fields[alias];
      }
    }

    return null;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /*
    The only markup this function may introduce is the line break, so the
    fetched source text is escaped first.
  */
  function formatHeroMessage(value) {
    const parts = value
      .split(/\s*·\s*/g)
      .map(item => item.trim())
      .filter(Boolean)
      .map(escapeHtml);

    if (parts.length < 3) {
      return escapeHtml(value);
    }

    return `${parts[0]} · ${parts[1]}<br>· ${parts.slice(2).join(" · ")} ·`;
  }

  function applyWebsiteText(fields) {
    dom.contentNodes.forEach(element => {
      const key = element.dataset.content;

      if (!key) return;

      const rawValue = resolveContentValue(
        fields,
        key
      );

      if (rawValue == null) return;

      if (
        element.dataset.contentFormat ===
        "hero-lines"
      ) {
        element.innerHTML =
          formatHeroMessage(rawValue);
        return;
      }

      const index = Number(
        element.dataset.contentIndex || 0
      );

      if (index) {
        const paragraphs = rawValue
          .split(/\n\s*\n+/)
          .map(item => item.trim())
          .filter(Boolean);

        element.textContent =
          paragraphs[index - 1] ?? rawValue;

        return;
      }

      element.textContent = rawValue;
    });
  }

  async function syncWebsiteText() {
    try {
      const response = await fetch(
        CONFIG.contentUrl,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          `Website Texts.md returned ${response.status}`
        );
      }

      const markdown = await response.text();

      applyWebsiteText(
        parseWebsiteText(markdown)
      );
    } catch {
      /*
        HTML contains fallback copy.
        The page remains functional if the Markdown source
        cannot be fetched.
      */
    }
  }

  /* ----------------------------------------------------------
     Contact form
     ---------------------------------------------------------- */

  const MESSAGE_LIMIT = 500;

  function bindContactForm() {
    const form = dom.contactForm;

    if (!form) return;

    const messageCount =
      form.querySelector("[data-message-count]");

    /* The text as it stood before the current keystroke; clampMessage diffs
       against it to find what was just inserted. */
    let messageValue = "";

    /*
      The markup carries maxlength so the limit still holds with JavaScript
      off. With it on, clampMessage does the job in a way maxlength cannot -
      it has to see the 501st character in order to replace the 500th - so the
      attribute is dropped here.
    */
    const messageControl =
      form.querySelector("#message");

    if (messageControl) {
      messageControl.removeAttribute("maxlength");
    }

    /*
      How far the active state reaches past the bottom of the stage, measured
      in the canvas's own authored pixels. The stage height is divided by the
      scale so both sides of the subtraction are in the same units as the box
      height this feeds. Zero or less means the state still has room.

      Read after the new box height is set, so the flex shrink that closes the
      space either side of the separator has already been applied - what is
      left over is what the state genuinely cannot absorb.
    */
    function stageOverflow() {
      const stage = dom.stage;
      const canvas = dom.stageCanvas;

      if (!stage || !canvas) return 0;

      const scale =
        parseFloat(
          canvas.style.getPropertyValue("--stage-scale")
        ) || 1;

      return Math.ceil(
        canvas.scrollHeight - stage.clientHeight / scale
      );
    }

    /*
      The box carries no scrollbar and no resize handle, so it has to grow
      itself: reset to the CSS height, then take whatever the content needs.

      Growth stops at whichever limit is reached first. The stylesheet's 300px
      cap is one. The other is the state itself: the space above the Footer is
      spent first, then the space either side of the separator closes towards
      its 24px floor, and once there is nothing left to give the box stops
      there rather than pushing the Footer past the bottom of the stage. So the
      Footer never moves and the stage never has to scroll.

      Where the state has room to spare - Laptop 06 carries only Contact and
      the Footer - nothing is clamped and the 300px cap is the only limit.
    */
    function resizeMessage(control) {
      const styles = getComputedStyle(control);

      /*
        box-sizing is border-box here while scrollHeight excludes the border,
        so the border has to be added back or the last line is clipped.
      */
      const border =
        parseFloat(styles.borderTopWidth) +
        parseFloat(styles.borderBottomWidth);

      /* Both ends of the range live in the stylesheet; honour them here too. */
      const maxHeight = parseFloat(styles.maxHeight);
      const minHeight = parseFloat(styles.minHeight) || 0;

      /*
        Collapsing to auto to measure also throws away where the box was
        scrolled to. Now that the box is a real scroll container that is
        visible as a jump, so the position is put back afterwards.
      */
      const scrollTop = control.scrollTop;

      control.style.height = "auto";

      const grown = control.scrollHeight + border;

      const next = Math.max(
        minHeight,
        Number.isFinite(maxHeight) ? Math.min(grown, maxHeight) : grown
      );

      control.style.height = `${next}px`;
      control.scrollTop = scrollTop;

      /* Tablet and Mobile are one scrolling page; there is nothing to fit. */
      if (!isStateTrackActive()) return;

      const over = stageOverflow();

      if (over > 0) {
        control.style.height = `${Math.max(minHeight, next - over)}px`;
        control.scrollTop = scrollTop;
      }

      /*
        The canvas is never rescaled here - that would resize the whole
        composition mid-sentence - but the clamp above can bottom out at the
        box's own 120px floor on a stage too short to hold the state at all.
        That case still has to fall back to a scrolling stage rather than lose
        the bottom of the Footer.
      */
      updateStageFit();
    }

    /*
      Keeps the message inside MESSAGE_LIMIT, and reports whether it had to
      step in.

      At the limit the field overwrites rather than refuses: the character
      being typed takes the place of the one already at the end, so a 501st
      character never appears. maxlength would drop the keystroke instead,
      which leaves the reader pressing keys at a field that ignores them.

      What was just typed is found by diffing against the previous value.
      The excess comes off the untouched tail first, and only then off the
      characters immediately before the insertion - which, for the ordinary
      case of typing at the end of the message, is exactly the last character.
      A paste is trimmed to fit instead: eating into text the reader has
      already written to make room for it would lose more than it gains.
    */
    function clampMessage(control) {
      const value = control.value;
      const excess = value.length - MESSAGE_LIMIT;

      if (excess <= 0) {
        messageValue = value;
        return false;
      }

      const previous = messageValue;
      const shortest =
        Math.min(previous.length, value.length);

      let head = 0;

      while (
        head < shortest &&
        previous[head] === value[head]
      ) head += 1;

      let tail = 0;

      while (
        tail < shortest - head &&
        previous[previous.length - 1 - tail] ===
          value[value.length - 1 - tail]
      ) tail += 1;

      const insertEnd = value.length - tail;
      const inserted = insertEnd - head;

      let next;
      let caret;

      if (inserted > 1) {
        /* A paste. Trim what arrived, keep what was already written. */
        next =
          value.slice(0, insertEnd - excess) +
          value.slice(insertEnd);
        caret = insertEnd - excess;
      } else {
        const fromTail = Math.min(excess, tail);
        const fromHead = excess - fromTail;

        next =
          value.slice(0, head - fromHead) +
          value.slice(head, value.length - fromTail);
        caret = insertEnd - fromHead;
      }

      control.value = next;
      control.setSelectionRange(caret, caret);
      messageValue = next;

      return true;
    }

    /*
      The countdown. It shares its slot with the status line and only one of
      the two is ever shown, so this writes the text and leaves showing it to
      setStatus.
    */
    function updateMessageCount(control) {
      if (!messageCount) return;

      const left =
        Math.max(0, MESSAGE_LIMIT - control.value.length);

      messageCount.textContent =
        `${left} character${left === 1 ? "" : "s"} left`;

      if (left === 0) {
        messageCount.dataset.state = "full";
      } else if (left <= 50) {
        messageCount.dataset.state = "low";
      } else {
        delete messageCount.dataset.state;
      }
    }

    const status =
      form.querySelector(".contact-form__status");

    const submit =
      form.querySelector(".contact-form__submit");

    /*
      Keeps the bottom of the form in sight while the reader is typing.

      Both layouts below measure against the visual viewport rather than the
      layout viewport. A soft keyboard shortens what is left to look at without
      changing what the page is laid out in, so an element can be perfectly on
      screen by the page's own reckoning and still sit behind the keyboard.

      Mobile nudges the page only as far as it must: Submit is brought clear of
      the keyboard and nothing more, because there is too little room to spend
      on anything else.

      Tablet anchors instead. Tapping into the box pulls the Footer up to the
      bottom of the view, and it is held there while the box grows - so the
      composition appears to grow upwards against a fixed foot, and at the
      300px cap the whole Contact block, its countdown, Submit and the Footer
      are all in view together.

      Desktop and Laptop are left out entirely: the form lives in the sticky
      stage, where scrolling the page changes which state is on screen rather
      than moving the form, and no keyboard is taking up room there anyway.
    */
    const KEYBOARD_MARGIN = 16;

    const stageFooter =
      document.querySelector(".stage-footer");

    /*
      Brings the message slot into view, but only if it is not already there.

      A complaint the reader can see needs no scrolling, and moving the page
      under them to "present" it costs them their place for nothing. So this
      does nothing at all when the slot is on screen, and when it is not, it
      moves by the smallest amount that brings it back - never centring it.

      Desktop and Laptop are left out: the form is in the sticky stage there,
      where scrolling the page changes which state is shown rather than moving
      the form, and the slot cannot be out of view in the first place.
    */
    function revealNote() {
      const viewport = window.visualViewport;
      const note = form.querySelector(".contact-form__note");

      if (!viewport || !note || isStateTrackActive()) return;

      const box = note.getBoundingClientRect();
      const top = viewport.offsetTop;
      const bottom = viewport.offsetTop + viewport.height;

      if (box.bottom > bottom) {
        window.scrollBy(0, box.bottom + KEYBOARD_MARGIN - bottom);
        return;
      }

      if (box.top < top) {
        window.scrollBy(0, box.top - KEYBOARD_MARGIN - top);
      }
    }

    function keepFormInView() {
      const viewport = window.visualViewport;

      if (
        !viewport ||
        !messageControl ||
        document.activeElement !== messageControl
      ) {
        return;
      }

      const profile = getViewportProfile();
      const visibleBottom = viewport.offsetTop + viewport.height;

      if (profile === "mobile") {
        if (!submit) return;

        const covered =
          submit.getBoundingClientRect().bottom +
          KEYBOARD_MARGIN -
          visibleBottom;

        if (covered > 1) {
          window.scrollBy(0, covered);
        }

        return;
      }

      if (profile !== "tablet" || !stageFooter) return;

      const offset =
        stageFooter.getBoundingClientRect().bottom - visibleBottom;

      if (Math.abs(offset) > 1) {
        window.scrollBy(0, offset);
      }
    }

    if (messageControl) {
      /*
        The browser does its own scroll-to-caret on focus, and on Mobile the
        keyboard has not opened yet either. Waiting a frame lets both settle so
        this measures the position the reader actually ends up at.
      */
      messageControl.addEventListener("focus", () => {
        /*
          Going back to the message box hands the slot back to the countdown.
          The reader has turned their attention to writing, and the room left
          is what matters there - the complaint has had its say and will be
          made again on the next attempt if it still stands.

          A send status is left alone: it reports what happened rather than
          what is wrong, and is not the reader's to dismiss by looking away.
        */
        if (status && status.dataset.state === "error") {
          setStatus("");
        }

        requestAnimationFrame(keepFormInView);
      });
    }

    if (window.visualViewport) {
      /* The keyboard arriving or leaving shows up here, not as a page resize. */
      window.visualViewport.addEventListener(
        "resize",
        keepFormInView
      );
    }

    const fields = {};

    form.querySelectorAll(".field")
      .forEach(wrapper => {
        const name =
          wrapper.dataset.field;

        const control =
          wrapper.querySelector(
            "input, textarea"
          );

        if (!name || !control) return;

        fields[name] = {
          wrapper,
          control
        };

        control.addEventListener(
          "input",
          () => {
            /* Editing a field withdraws what it was accused of. */
            setFieldState(name, false);

            /*
              The message is clamped before anything measures it, so the
              countdown, the filled state and the box all see the text that
              will actually stay rather than the keystroke that ran past 500.
            */
            if (name === "message") {
              clampMessage(control);
              updateMessageCount(control);
            }

            wrapper.classList.toggle(
              "is-filled",
              Boolean(control.value.trim())
            );

            /*
              An error standing in the slot is re-asked as the form changes
              under it, so it can never outlive what it was complaining about.
              Only an error, though - a send status is left to stand.
            */
            if (status && status.dataset.state === "error") {
              setStatus(formError(), "error");
            }

            if (name === "message") {
              resizeMessage(control);
              keepFormInView();
            }
          }
        );
      });

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /*
      What a name may be made of: letters from any script, the marks that
      accent them, and the punctuation that has always belonged to names -
      spaces, hyphens, and the apostrophe in both its straight and typographic
      spellings. Anne-Marie, O'Connor and O’Connor all pass; anything carrying
      @, #, $, %, &, *, +, / or \ does not, and neither do digits.

      \p{M} earns its place. An accented letter can arrive either as a single
      code point or as a plain letter followed by a combining mark, and the
      second spelling is no less a name than the first - a keyboard, an IME or
      a paste from another application decides which one turns up.
    */
    const namePattern =
      /^[\p{L}\p{M} '\u2019-]+$/u;

    const FORM_ERRORS = {
      required: "Please enter the required information.",
      name: "Please enter a valid name.",
      email: "Please enter a valid email address."
    };

    /*
      What one field has to complain about, or "" when it has nothing.

      The 500-character limit is not checked. clampMessage() enforces it on the
      way in, so the field cannot arrive over the limit, and the countdown
      reports the room left long before it runs out.
    */
    function fieldError(name) {
      const control =
        fields[name]?.control;

      if (!control) return "";

      const value =
        control.value.trim();

      if (!value) return FORM_ERRORS.required;

      if (name === "firstName" || name === "lastName") {
        return namePattern.test(value) ? "" : FORM_ERRORS.name;
      }

      if (name === "email") {
        return emailPattern.test(value) ? "" : FORM_ERRORS.email;
      }

      return "";
    }

    /* Drives the red outline. The wording is settled for the form, below. */
    function fieldIsValid(name) {
      return !fieldError(name);
    }

    /*
      The form's single complaint, or "" when it has none.

      One message for the whole form, not one per field, because there is only
      one place to put it. A missing field outranks everything else: if
      anything is blank the reader is asked to fill it all in first, and the
      rest is raised on the next attempt, once it is all that is left.

      Beyond that the fields are asked in the order they are read, so the
      complaint always belongs to the topmost field still wrong.
    */
    function formError() {
      const names = Object.keys(fields);

      if (names.some(name => !fields[name].control.value.trim())) {
        return FORM_ERRORS.required;
      }

      return names.reduce(
        (found, name) => found || fieldError(name),
        ""
      );
    }

    /* Marks a field as failed or not. No text - that lives in the one slot. */
    function setFieldState(name, failed) {
      const item = fields[name];

      if (!item) return;

      item.wrapper.classList.toggle("is-error", failed);

      item.control.setAttribute(
        "aria-invalid",
        String(failed)
      );
    }

    /*
      Points a field at the shared slot, or stops pointing at it.

      aria-invalid alone says a field is wrong without saying why: the reason
      is sitting in a slot at the far end of the form with nothing tying the
      two together. This is the tie. It is added and removed rather than left
      standing, so a field is only ever described by a message that is about
      it - a stale pointer would have the reader hear the wrong complaint.

      The id is spliced into whatever aria-describedby the field already
      carries. The message box points at its countdown, and that must survive.
    */
    const NOTE_ID = "form-note";

    function setFieldDescription(name, describes) {
      const control = fields[name]?.control;

      if (!control) return;

      const ids = (
        control.getAttribute("aria-describedby") || ""
      )
        .split(/\s+/)
        .filter(id => id && id !== NOTE_ID);

      if (describes) ids.push(NOTE_ID);

      if (ids.length) {
        control.setAttribute(
          "aria-describedby",
          ids.join(" ")
        );
      } else {
        control.removeAttribute("aria-describedby");
      }
    }

    /*
      Writes the one slot under the message box.

      Passing no text hands the slot back to the countdown, which is what the
      reader sees whenever the form has nothing to say. Only one of the two is
      ever seen, so on Desktop the row keeps its height and nothing below it
      moves.

      The status itself is never hidden - it is a live region, and one that is
      hidden until the moment its text arrives is a region several screen
      readers will not announce at all. Emptying it is what takes it out of the
      row; the countdown is what gets hidden.

      Every field that the message is about is pointed at it here, and every
      field it is not about stops pointing. Asking each field what it would
      complain about and matching that against the text settles it without a
      second rule to keep in step: whoever would have said this is described
      by it.

      In a narrow slot a message can still wrap where the countdown did not, so
      the box is re-measured afterwards - on Desktop 06 the Contact block has a
      fixed height to live within, and an extra line has to come from somewhere.
    */
    function setStatus(text, state = "") {
      if (!status) return;

      const showing = Boolean(text);
      const isError = showing && state === "error";

      status.textContent = text;

      if (showing && state) {
        status.dataset.state = state;
      } else {
        delete status.dataset.state;
      }

      Object.keys(fields).forEach(name => {
        setFieldDescription(
          name,
          isError && fieldError(name) === text
        );
      });

      if (messageCount) {
        messageCount.hidden = showing;
      }

      if (fields.message) {
        resizeMessage(fields.message.control);
      }
    }

    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const names =
          Object.keys(fields);

        const invalid =
          names.filter(name => !fieldIsValid(name));

        names.forEach(name => {
          setFieldState(name, invalid.includes(name));
        });

        const message = formError();

        if (message) {
          setStatus(message, "error");

          /*
            The outline says which field, the slot says what is wrong with it.
            Focus goes to the first one so the reader is already there - but
            not to the message box, whose focus hands the slot back to the
            countdown and would wipe the message just written.

            preventScroll, because the browser's own answer to a focus is to
            haul the field into the middle of the screen. Whether the page
            should move at all is decided below, on what the reader can already
            see - not on where the caret happens to have gone.
          */
          const target =
            invalid.find(name => name !== "message") ?? invalid[0];

          if (target && target !== "message") {
            fields[target].control.focus({ preventScroll: true });
          }

          revealNote();

          return;
        }

        const honeypot =
          form.querySelector("#company");

        if (honeypot?.value) {
          return;
        }

        const valueOf = name =>
          fields[name]
            ? fields[name].control.value.trim()
            : "";

        const payload = {
          firstName: valueOf("firstName"),
          lastName: valueOf("lastName"),
          email: valueOf("email"),
          message: valueOf("message"),
          company: honeypot?.value || ""
        };

        if (submit) {
          submit.disabled = true;
        }

        setStatus("Sending…");

        try {
          const response =
            await fetch("/api/contact", {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body:
                JSON.stringify(payload)
            });

          const data =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok || !data.ok) {
            throw new Error(
              data.error ||
              "Unable to send the message."
            );
          }

          form.reset();

          /* form.reset() fires no input events; catch every field up by hand. */
          names.forEach(name => {
            setFieldState(name, false);

            fields[name]
              .wrapper
              .classList.remove("is-filled");
          });

          if (fields.message) {
            /* form.reset() emptied it without firing input; catch up by hand. */
            clampMessage(fields.message.control);
            updateMessageCount(fields.message.control);
            resizeMessage(fields.message.control);
          }

          setStatus(
            "Thank you — your message has been sent.",
            "success"
          );
        } catch (error) {
          setStatus(
            error.message ||
            "Something went wrong. Please try again.",
            "error"
          );
        } finally {
          if (submit) {
            submit.disabled = false;
          }
        }
      }
    );

    /*
      A browser can restore a textarea's value on a soft reload without firing
      input, so the countdown and the box are brought into line once here.
    */
    if (messageControl) {
      clampMessage(messageControl);
      updateMessageCount(messageControl);
      resizeMessage(messageControl);
    }
  }

  /* ----------------------------------------------------------
     Privacy page header background
     ---------------------------------------------------------- */

  /*
    Keeps the Header's copy of the page background in register with the real
    one, so the band the Header draws over the scrolling text is the background
    rather than a colour approximating it.

    Only the offset is written here. Everything else - the star tile, the fade,
    the glow, the drift - is the same markup and the same stylesheet on both
    copies, so matching them is a matter of telling the copy where the original
    currently is, and nothing else.

    Privacy page only. No other page has anything scrolling under the Header.
  */
  /*
    The band measurement, once bindHeaderBackdrop has made one. Every section's
    scroll-margin-top is derived from it, so anything working out where a link
    lands needs the current value rather than whichever one happened to be in
    place. Null on pages with no band.
  */
  let syncHeaderBand = null;

  function bindHeaderBackdrop() {
    const holder =
      document.querySelector(".site-header__bg");

    const source =
      document.querySelector("body > .page-bg");

    if (!holder || !source) return;

    let frame = 0;

    function sync() {
      frame = 0;

      /*
        Home hides the band above 1199px, where the states are composed inside
        the stage. Measuring for something that is not being drawn is work the
        snapping Home page does not need on every frame.
      */
      if (!holder.offsetParent && getComputedStyle(holder).position !== "fixed") {
        return;
      }

      const box = source.getBoundingClientRect();

      /*
        The Header sits at the top of the viewport, so the source's viewport
        offset is also its offset within the Header's coordinates. It goes
        negative as the page scrolls, which is what pulls the copy up.
      */
      holder.style.setProperty(
        "--bg-top",
        `${Math.round(box.top)}px`
      );

      holder.style.setProperty(
        "--bg-height",
        `${Math.round(box.height)}px`
      );

      /*
        How far down the band has to stay fully opaque: to the bottom of the
        lowest thing the Header draws, plus 2px, so no part of the lockup or
        the nav is sitting on a background that has started to thin. Below that
        point the mask fades out to nothing at the band's own bottom edge.

        Measured rather than written as a percentage because the answer is
        different on every layout - the lockup is two lines wide of 1200px and
        one line below it, the nav is there or replaced by the toggle - and a
        percentage that suited one of them would cut through another.
      */
      const header = holder.parentElement;
      const headerTop = header.getBoundingClientRect().top;

      let lowest = 0;

      /*
        The things that actually paint, not the boxes holding them. The logo's
        link is a flex item stretched to the Header's full height, so measuring
        it would put the solid stop at the very bottom and leave no fade at all.
        Its image is the lockup as drawn. The mobile nav is excluded because it
        is a dropdown rather than part of the Header's own line.
      */
      header
        .querySelectorAll(
          ".site-header__logo img," +
          ".site-header__nav a," +
          ".menu-toggle span"
        )
        .forEach(node => {
          if (node.closest(".mobile-nav")) return;

          const rect = node.getBoundingClientRect();

          if (!rect.height) return;

          lowest = Math.max(lowest, rect.bottom - headerTop);
        });

      /*
        Written on the root, not the band, so the layout can use it too. The
        band reads it by inheritance; the section scroll offsets below 1200px
        read it to know where the covered region ends.
      */
      document.documentElement.style.setProperty(
        "--band-solid",
        `${Math.ceil(lowest) + 2}px`
      );
    }

    function schedule() {
      if (frame) return;
      frame = requestAnimationFrame(sync);
    }

    syncHeaderBand = sync;

    sync();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    /*
      Web fonts landing changes the length of the document, which moves the
      background's bottom edge and with it the glow.
    */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(sync);
    }

    /*
      The document also changes height for reasons that are not a resize - a
      late image, a font landing - and the glow is anchored to its bottom edge.
      Watching the source directly covers every one of them.
    */
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(schedule).observe(source);
    }
  }


  /* ----------------------------------------------------------
     Analytics consent
     ---------------------------------------------------------- */

  /*
    Google Analytics and Microsoft Clarity are not in the markup. They are
    fetched here, and only once the visitor has said yes.

    Under PECR and the ePrivacy rules, analytics and session recording are not
    strictly necessary, so they need consent *before* they run - a notice after
    the fact is not consent. That is the whole reason this module exists: the
    tags cannot sit in the page, because a tag in the page has already fired by
    the time anyone is asked.

    The decision is kept in localStorage rather than a cookie, because a cookie
    would be sent on every request for no reason. Storing the decision itself
    is strictly necessary - it is what stops the visitor being asked twice - so
    it needs no consent of its own.
  */
  const CONSENT_KEY = "ns-analytics-consent";
  const GA_ID = "G-KX169TMJTF";
  const CLARITY_ID = "y0ykuly2si";

  let analyticsLoaded = false;

  function readConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (error) {
      /* Private mode, or storage turned off. Treat it as undecided. */
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch (error) {
      /* Nothing to do. The visitor is asked again next time. */
    }
  }


  /*
    Removes what Google Analytics and Clarity left behind, as far as a page can
    reach.

    Withdrawing consent has to mean something. A gate that stops new loads but
    leaves yesterday's identifiers sitting in the browser has not withdrawn
    anything - the same visitor is still labelled, and the next site to accept
    picks up where this one left off.

    What is reachable: first-party cookies on this host, and the storage keys
    the two tools write. What is not: anything held on clarity.ms or by Google
    under their own domains. A page cannot delete another origin's cookies, so
    this is the honest limit rather than a claim to have erased everything.
  */
  const ANALYTICS_KEY_RE = /^(_ga|_gid|_gat|_clck|_clsk|clarity|CLID)/i;

  function analyticsCookieDomains() {
    const host = window.location.hostname;

    /*
      GA sets its cookies on the registrable domain with a leading dot, Clarity
      on the host. A cookie is only removable by naming the same domain it was
      set on, so every candidate is tried.
    */
    const domains = ["", host, `.${host}`];
    const parts = host.split(".");

    for (let i = 1; i < parts.length - 1; i += 1) {
      const parent = parts.slice(i).join(".");

      domains.push(parent, `.${parent}`);
    }

    return domains;
  }

  function clearAnalyticsTraces() {
    const expiry = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const domains = analyticsCookieDomains();

    document.cookie.split(";").forEach(entry => {
      const name = entry.split("=")[0].trim();

      if (!name || !ANALYTICS_KEY_RE.test(name)) return;

      domains.forEach(domain => {
        ["/", window.location.pathname].forEach(path => {
          document.cookie =
            `${name}=; ${expiry}; path=${path}` +
            (domain ? `; domain=${domain}` : "");
        });
      });
    });

    [window.localStorage, window.sessionStorage].forEach(store => {
      try {
        Object.keys(store)
          .filter(key =>
            key !== CONSENT_KEY && ANALYTICS_KEY_RE.test(key)
          )
          .forEach(key => store.removeItem(key));
      } catch (error) {
        /* Storage unavailable. Nothing was written either. */
      }
    });
  }
  function loadAnalytics() {
    if (analyticsLoaded) return;

    analyticsLoaded = true;

    /* Microsoft Clarity, as their own snippet loads it. */
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);

    /* Google Analytics 4. */
    const tag = document.createElement("script");

    tag.async = true;
    tag.src =
      "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;

    document.head.appendChild(tag);

    window.dataLayer = window.dataLayer || [];

    function gtag() {
      window.dataLayer.push(arguments);
    }

    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_ID);
  }

  /*
    The banner.

    Built here rather than written into each page so there is one definition of
    it, and so a page that never asks never carries the markup.

    Accept and Decline are the same size, the same weight and the same colour.
    Consent is only consent when refusing is as easy as agreeing, so the two
    are deliberately not styled as a primary and a secondary action.
  */
  function buildConsentBanner(onDecide) {
    const bar = document.createElement("aside");

    bar.className = "consent";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-labelledby", "consent-title");
    bar.setAttribute("aria-describedby", "consent-text");
    /* Focusable as a container so it can take focus without a button doing it. */
    bar.tabIndex = -1;

    const inner = document.createElement("div");
    inner.className = "consent__inner";

    const copy = document.createElement("div");
    copy.className = "consent__copy";

    const title = document.createElement("p");
    title.className = "consent__title";
    title.id = "consent-title";
    title.textContent = "Analytics";

    const text = document.createElement("p");
    text.className = "consent__text";
    text.id = "consent-text";
    text.append(
      "We use Google Analytics and Microsoft Clarity to understand how this " +
      "site is used. Clarity also records session replays. Neither runs " +
      "without your consent. See our "
    );

    const link = document.createElement("a");
    link.href = "privacy.html";
    link.textContent = "Privacy Policy";

    text.append(link, ".");

    copy.append(title, text);

    const actions = document.createElement("div");
    actions.className = "consent__actions";

    const decline = document.createElement("button");
    decline.type = "button";
    decline.className = "btn consent__btn";
    decline.textContent = "DECLINE";

    const accept = document.createElement("button");
    accept.type = "button";
    accept.className = "btn consent__btn";
    accept.textContent = "ACCEPT";

    decline.addEventListener("click", () => onDecide("denied"));
    accept.addEventListener("click", () => onDecide("granted"));

    actions.append(decline, accept);
    inner.append(copy, actions);
    bar.append(inner);

    return { bar };
  }

  function bindAnalyticsConsent() {
    let banner = null;

    /*
      Only Home measures anything - it carries data-analytics. The other pages
      still run this module, because the Privacy page has to be able to reopen
      the question and every page has to respect a decision already made, but
      they never load a tag and are never asked out of the blue.
    */
    const measures =
      document.body.hasAttribute("data-analytics");

    function close() {
      if (!banner) return;

      banner.bar.remove();
      banner = null;
    }

    function decide(value) {
      writeConsent(value);
      close();

      if (value === "granted") {
        if (measures) loadAnalytics();
        return;
      }

      /*
        Declining, or withdrawing a yes given earlier. Either way what was left
        behind goes with it - the tags already running cannot be unloaded from
        this page, but their identifiers do not survive into the next one.
      */
      clearAnalyticsTraces();
    }

    function ask() {
      if (banner) return;

      banner = buildConsentBanner(decide);
      document.body.appendChild(banner.bar);

      /*
        Focus lands on the banner itself, not on either button.

        Focusing Accept would have put the site's gold focus ring around it the
        moment the banner appeared, which makes one of two supposedly equal
        choices the loud one - the exact nudge that stops consent counting as
        freely given. The dialog takes the focus instead, so a keyboard visitor
        still arrives at the question with neither answer pre-selected.
      */
      banner.bar.focus();
    }

    /*
      A choice has to be as easy to withdraw as it was to give, so the Privacy
      page carries a control that reopens this. It is wired here rather than
      there because the banner belongs to this module.
    */
    document
      .querySelectorAll("[data-consent-reopen]")
      .forEach(control => {
        control.addEventListener("click", ask);
      });

    const decided = readConsent();

    if (decided === "granted") {
      if (measures) loadAnalytics();
      return;
    }

    if (decided === "denied") return;

    /* Undecided. Only ask on a page that would actually load something. */
    if (measures) ask();
  }

  /* ----------------------------------------------------------
     Initialisation
     ---------------------------------------------------------- */

  /*
    Resolves the current location to a state. The browser performs its own
    fragment scroll during load, which lands on an absolutely positioned
    section inside the sticky stage rather than on a snap target, so this is
    applied again once loading has finished.
  */
  function applyLocation() {
    const target = window.location.hash.slice(1);

    if (!NAVIGATION_STEPS[target]) {
      window.scrollTo(0, 0);
      setLandingStep(1);
      return;
    }

    /*
      The fragment is dropped before scrolling so the browser's own
      scroll-to-fragment cannot pull the page onto the section element (which
      is absolutely positioned inside the sticky stage) and leave it resting
      between two snap targets. It is put back afterwards, via replaceState,
      which never scrolls, so the URL stays shareable.
    */
    const url = window.location.pathname + window.location.search;

    history.replaceState(null, "", url);
    scrollToTarget(target, "auto");
    history.replaceState(null, "", `${url}#${target}`);
  }

  function initialise() {
    /*
      The state is derived from the scroll position, so a restored scroll
      offset from a previous visit would fight the state machine.
    */
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    updateViewportProfile();
    setLandingStep(getStepFromScroll());
    updateStageScale();

    bindHeaderNavigation();
    bindMobileNavigation();
    bindContactForm();
    bindHeaderBackdrop();
    bindAnalyticsConsent();

    window.addEventListener(
      "scroll",
      scheduleStepUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      () => {
        updateViewportProfile();
        updateStageScale();
        scheduleStepUpdate();
      },
      { passive: true }
    );

    window.addEventListener(
      "orientationchange",
      () => {
        updateViewportProfile();
        updateStageScale();
        scheduleStepUpdate();
      },
      { passive: true }
    );

    /* Kept: the copy it writes changes the height of the document, and the
       fragment landing below has to wait for that. */
    const textReady = syncWebsiteText();

    /*
      The first fit runs against fallback metrics. Re-fit once the web fonts
      are in, since they change how tall the authored state actually is.
    */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateStageScale);
    }

    /*
      And again once the Markdown copy is in. It replaces the fallback copy the
      HTML ships with, and the two are not the same length, so the authored
      canvas changes height underneath a fit that was worked out before it. The
      fonts are not a proxy for this: cached faces resolve first and leave the
      fit standing on the copy that is about to be thrown away.
    */
    textReady.then(updateStageScale);

    /*
      A hash arriving from another page (publishing.html links to
      index.html#studio and friends) has to be resolved to a state. Otherwise
      the browser lands on an absolutely positioned section inside the sticky
      stage and the step is whatever the scroll position happens to imply.
    */
    applyLocation();

    /*
      Re-apply after load so the browser's own fragment scroll cannot leave
      the page resting between two snap targets.
    */
    if (window.location.hash && document.readyState !== "complete") {
      window.addEventListener("load", applyLocation, { once: true });
    }

    /*
      And once more once the page has stopped changing height underneath it.

      Arriving from another page - Publishing and the Privacy Policy both link
      to index.html#founder and friends - resolves the fragment straight away,
      but two things still change the document's height afterwards: the web
      fonts replacing the fallback faces, and the Markdown copy replacing the
      fallback copy in the HTML. Either one moves the section, and the result
      was a landing about 30px away from the one the same link gives from
      inside this page. Waiting on the fonts alone only held when they happened
      to be slower than the fetch, which they are not on a repeat visit.

      Only re-applied if the reader has not taken hold of the page: moving it
      under someone who has already started reading would be worse than the
      30px. The test is for input, not for a changed scroll position, because
      the browser anchors scrolling to content while the page reflows and
      comparing offsets would read its own correction as the reader moving.
    */
    if (window.location.hash) {
      const MOVES = ["wheel", "touchstart", "keydown", "pointerdown"];

      let readerMoved = false;

      const noteMove = () => { readerMoved = true; };

      MOVES.forEach(type =>
        window.addEventListener(type, noteMove, { passive: true })
      );

      const settled = [textReady];

      if (document.fonts && document.fonts.ready) {
        settled.push(document.fonts.ready);
      }

      /*
        The band is measured from the Header's lockup, so the landing cannot be
        worked out before that image has a height. It is a small same-origin
        SVG and is normally in long before the fonts, but "normally" is what
        this whole block exists to stop relying on.
      */
      const lockup =
        document.querySelector(".site-header__logo img");

      if (lockup && !lockup.complete) {
        settled.push(
          new Promise(resolve => {
            lockup.addEventListener("load", resolve, { once: true });
            lockup.addEventListener("error", resolve, { once: true });
          })
        );
      }

      Promise.all(settled).then(() => {
        MOVES.forEach(type =>
          window.removeEventListener(type, noteMove)
        );

        if (readerMoved) return;

        /*
          Measured here rather than trusted from earlier: the landing is
          derived from --band-solid, so it is taken fresh at the moment it is
          used. Without this the correct value is still arrived at, but only
          because an earlier callback happened to run first, which is not
          something to depend on.
        */
        if (syncHeaderBand) syncHeaderBand();

        /*
          The authored canvas is measured against the copy it now holds, so the
          fit has to be redone before the landing is worked out from it.
        */
        updateStageScale();

        applyLocation();
      });
    }

  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialise,
      { once: true }
    );
  } else {
    initialise();
  }
})();
