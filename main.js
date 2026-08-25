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
      laptopHeight: 900
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
    Fits the authored state to the stage.

    The canvas keeps its authored layout at every size - scrollHeight is a
    layout value, so the transform already applied does not affect the
    measurement. min-height:100% means a state shorter than the stage measures
    exactly the stage height and scales at 1.
  */
  function updateStageScale() {
    const stage = dom.stage;
    const canvas = dom.stageCanvas;

    if (!stage || !canvas) return;

    if (!isStateTrackActive()) {
      canvas.style.removeProperty("--stage-scale");
      stage.dataset.stageFits = "true";
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

    /*
      Still too tall once the floor is reached. The stage takes over the
      scrolling for this state rather than cutting the bottom off, and becomes
      focusable so it can be scrolled from the keyboard as well as the wheel.
    */
    const fits = needed * scale <= available + 1;

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

  function currentStageScale() {
    const value = dom.stageCanvas
      ? parseFloat(
          getComputedStyle(dom.stageCanvas)
            .getPropertyValue("--stage-scale")
        )
      : NaN;

    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  let scrollFrame = 0;

  function scheduleStepUpdate() {
    if (scrollFrame) return;

    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      setLandingStep(getStepFromScroll());
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

    const destination = isStateTrackActive()
      ? getAnchorForStep(step)
      : document.getElementById(target);

    if (!destination) return false;

    destination.scrollIntoView({
      behavior:
        behavior ||
        (prefersReducedMotion() ? "auto" : "smooth"),
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

    const messageError =
      form.querySelector("[data-message-error]");

    /*
      The box carries no scrollbar and no resize handle, so it has to grow
      itself: reset to the CSS height, then take whatever the content needs.
    */
    /*
      How far the active state reaches past the bottom of the stage, in the
      canvas's own authored pixels. The stage's height is divided by the scale
      so both sides of the subtraction are in the same units - the box height
      this feeds is authored pixels too.
    */
    function stageOverflow() {
      const stage = dom.stage;
      const canvas = dom.stageCanvas;

      if (!stage || !canvas) return 0;

      return Math.ceil(
        canvas.scrollHeight -
        stage.clientHeight / currentStageScale()
      );
    }

    function resizeMessage(control) {
      const styles = getComputedStyle(control);

      /*
        box-sizing is border-box here while scrollHeight excludes the border,
        so the border has to be added back or the last line is clipped.
      */
      const border =
        parseFloat(styles.borderTopWidth) +
        parseFloat(styles.borderBottomWidth);

      /* The cap lives in the stylesheet; honour it here too. */
      const maxHeight = parseFloat(styles.maxHeight);
      const minHeight = parseFloat(styles.minHeight) || 0;

      control.style.height = "auto";

      const grown = control.scrollHeight + border;

      let next = Number.isFinite(maxHeight)
        ? Math.min(grown, maxHeight)
        : grown;

      control.style.height = `${next}px`;

      /*
        On Desktop the space either side of the separator is given up first.
        Once that is down to its 24px floor the box has to stop growing rather
        than push the state out of the stage, so that point is the real
        maximum height whether or not the stylesheet's cap was reached.
      */
      if (
        !dom.stage ||
        !isStateTrackActive() ||
        getViewportProfile() !== "desktop"
      ) {
        return;
      }

      const over = stageOverflow();

      if (over > 0) {
        control.style.height =
          `${Math.max(minHeight, next - over)}px`;
      }
    }

    function updateMessageLimit(control) {
      if (!messageError) return false;

      const over =
        control.value.length - MESSAGE_LIMIT;

      if (over > 0) {
        messageError.textContent =
          `Please shorten your message by ${over} character${over === 1 ? "" : "s"} — the limit is ${MESSAGE_LIMIT}.`;
        messageError.hidden = false;
      } else {
        messageError.textContent = "";
        messageError.hidden = true;
      }

      return over > 0;
    }

    const status =
      form.querySelector(".contact-form__status");

    const submit =
      form.querySelector(".contact-form__submit");

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
            wrapper.classList.toggle(
              "is-filled",
              Boolean(control.value.trim())
            );

            if (name === "message") {
              resizeMessage(control);

              const over =
                updateMessageLimit(control);

              wrapper.classList.toggle(
                "is-error",
                over
              );

              control.setAttribute(
                "aria-invalid",
                String(over)
              );

              return;
            }

            wrapper.classList.remove(
              "is-error"
            );

            control.setAttribute(
              "aria-invalid",
              "false"
            );
          }
        );
      });

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function valid(name) {
      const control =
        fields[name]?.control;

      if (!control) return true;

      const value =
        control.value.trim();

      if (!value) return false;

      if (name === "email") {
        return emailPattern.test(value);
      }

      if (name === "message") {
        return value.length <= MESSAGE_LIMIT;
      }

      return true;
    }

    function setStatus(text, state = "") {
      if (!status) return;

      status.textContent = text;

      if (state) {
        status.dataset.state = state;
      } else {
        delete status.dataset.state;
      }
    }

    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const names =
          Object.keys(fields);

        const invalid =
          names.filter(name => !valid(name));

        names.forEach(name => {
          const item = fields[name];
          const ok =
            !invalid.includes(name);

          item.wrapper.classList.toggle(
            "is-error",
            !ok
          );

          item.control.setAttribute(
            "aria-invalid",
            String(!ok)
          );
        });

        if (invalid.length) {
          setStatus(
            "Please check the highlighted fields.",
            "error"
          );

          fields[
            invalid[0]
          ].control.focus();

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

          if (fields.message) {
            resizeMessage(fields.message.control);
            updateMessageLimit(fields.message.control);
          }

          names.forEach(name => {
            fields[name]
              .wrapper
              .classList.remove(
                "is-filled",
                "is-error"
              );

            fields[name]
              .control
              .setAttribute(
                "aria-invalid",
                "false"
              );
          });

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

    syncWebsiteText();

    /*
      The first fit runs against fallback metrics. Re-fit once the web fonts
      are in, since they change how tall the authored state actually is.
    */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateStageScale);
    }

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
