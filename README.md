# North Stardust — Website

A static, multi-page site. No framework, no build step, no dependencies.
Edit the files, commit, push — that's the whole workflow.

Brand/source master files and anything not needed by the live site live in
`Trash Bin/` — kept on disk, git-ignored, and blocked from public serving by
`functions/_middleware.js`.

---

## Pages

```
index.html         Home — a six-state scrolling landing (see "The six-state
                    stage" below)
publishing.html    Publishing — "Coming soon…"
privacy.html       Privacy Policy — one column, Inter only, no stage
404.html           Not found — no header, no footer, no main.js; served by
                    Cloudflare Pages with a 404 status for any unmatched path
```

**URLs have no `.html` on them.** Cloudflare Pages serves `publishing.html`
at `/publishing` and answers `/publishing.html` with a 308 to it — the same
for every page, including `/index.html` → `/`. So the file names above are
not the addresses. Every canonical, `og:url`, sitemap entry and internal link
uses the extensionless form, and **nothing in the site should ever advertise a
`.html` URL**: pointing at one costs a redirect on every visit, and a
canonical that points at a redirecting URL is one Google cannot resolve.

That is not a style preference — it is what broke indexing. Both
`publishing.html` and `privacy.html` declared a canonical of their own
`.html` URL, which redirected straight back to the page, and the sitemap
submitted the same redirecting URLs. Search Console reported redirect errors
and indexed only the home page.

Header and footer markup is duplicated across `index.html`,
`publishing.html` and `privacy.html` — there is no templating layer in a
build-free static site. **If you change the header or footer, change it in all
three.** `404.html` deliberately has neither and is not part of this.

## Files

```
index.html · publishing.html · privacy.html · 404.html
styles.css        design tokens + every rule, in one file
main.js           viewport profile, six-state tracking, header/mobile nav,
                   header band, analytics consent, copy sync, contact form
functions/_middleware.js   Cloudflare Pages Function — blocks public access
                   to non-website paths (Trash Bin/, README.md, references/…)
functions/api/contact.js   Cloudflare Pages Function — POST /api/contact
_headers          security headers, incl. the CSP (see "Changing an inline
                   script" below)
_redirects        /contact.html and /contact → /#contact, 301. Contact is a
                   section of the home page, not a page; these two URLs are
                   kept resolving for old links. Replaced a meta-refresh stub
                   that Google read as a broken three-hop chain.
robots.txt · sitemap.xml · llms.txt · favicon.ico
assets/
  fonts/          Cormorant 400, Spectral 400, Inter 400/500/600 (woff2)
  img/            logo-double-line.svg, logo-single-line.svg,
                   founder-rounded.png, Stars.avif, favicons, og-image.jpg,
                   Hero Image.png, Cover Page Navisworks Guide.png,
                   Original Worlds.png
                  Hero Image, Original Worlds and founder-rounded also ship
                   an .avif, offered through <picture> with the .png as the
                   fallback. Filenames containing spaces must be
                   percent-encoded in srcset, where a space separates a
                   descriptor. The Navisworks cover is PNG only — AVIF saved
                   14% on it, which does not justify a second file.
  Website_Texts.md   editable long-form copy (see "Content" below)
  references/     design references; git-ignored and not served live
```

## Running it locally

`main.js` fetches `assets/Website_Texts.md` at runtime and the contact form
posts to `/api/contact`, so opening `index.html` from disk (`file://`) renders
fine but both silently no-op — expected, not a bug. For a real local check:

```bash
npx http-server -p 8099 -c-1 .
```

## The six-state stage

This is the part worth understanding before editing `index.html` or the
layout half of `styles.css`.

Home is **not** a normal scrolling document. All six sections, the footer and
two separator rules live inside one `.landing-stage`, which is `position:
sticky` and exactly one screen tall. A sibling `.state-track` of six `100svh`
anchors supplies the scroll length and the scroll-snap targets; the stage
itself never moves.

`main.js` finds the anchor nearest the current scroll position and writes
`data-landing-step="1".."6"` onto `<html>`. CSS keys off that attribute to
decide which blocks are `display: block` for that state, and gives the
separator rules a flex `order` that places them between two blocks. Nothing
is positioned by hand — the canvas is a top-aligned flex column and the
spacing is one `--section-gap` value.

Two consequences to keep in mind:

- **The track is pulled up** by the height of everything ahead of it
  (`margin-top: calc(-1 * (header + main-gap + stage-height))`) so that state
  01 sits at scroll position 0. Without it there is a screen of scroll above
  state 01 in which the stage is already stuck and only the background moves.
- **`data-landing-step="1"` is seeded in the markup** on `<html>`, so the
  first state paints before `main.js` runs and still renders if the script
  never runs at all. There is a `:root:not(.js)` fallback at the end of
  `styles.css` that unfolds the stage into a plain stacked document.

### The authored canvas

Inside the stage sits `.stage-canvas`. **Every state is composed there at full
authored size** — the 64px rhythm, the 64/48/24/20px type scale and the 456px
portrait are never altered to make something fit.

Instead `main.js` measures what the state needs (`canvas.scrollHeight`, a
layout value the transform doesn't affect) against what the stage has
(`stage.clientHeight`) and sets `--stage-scale`. The canvas is scaled
uniformly from its top edge, the way presentation software fits a fixed slide
to a display, so the composition keeps its own proportions rather than being
re-flowed. Scaling from the top is what keeps every state starting at the same
48px below the header.

Two details that are easy to break:

- **`MIN_STAGE_SCALE = 0.8`.** Derived from the composition, not chosen round:
  body text is 20px, and 0.8 renders it at 16px — the floor for this text.
  The canvas never scales below it.
- **The negative bottom margin.** A transform is painted, not laid out, so the
  canvas still occupies its authored height. `main.js` pulls the unused
  difference off the bottom, otherwise a scrolling state would scroll past the
  shrunken composition into empty space.

### When a state still doesn't fit

At the 0.8 floor a state can still be taller than the stage. It is never
clipped: the stage gets `data-stage-fits="false"`, which turns on
`overflow-y: auto`, and `main.js` gives it `tabindex="0"` plus a
`role="group"` label so it can be scrolled by keyboard as well as by wheel.
Page-level scroll snapping between states is unaffected.

Roughly, per state: at ≥1400px viewport height everything is at or near
scale 1; below that the states scale down together, and state 06 is the
first to reach the floor and take the scroll fallback.

One visible consequence: uniform scaling shrinks width too, so at 0.8 the
1200px content column renders 960px wide with wider side margins. That is the
cost of preserving the composition exactly rather than re-flowing it.

Because the scale is per state, two states that share a block only look alike
while they scale alike. Desktop 05 and 06 both carry the Founder, so 06 must
be able to fit the stage at the same scale as 05 — if it needs a smaller one,
the Founder's portrait, type and column width all visibly change between two
adjacent states. State 06 has room to absorb the difference in its own
spacing instead; see below.

### Profiles

Four layouts, and the two state-based ones are chosen on width **and**
height together — not on height alone:

| Layout | Condition | Behaviour |
|---|---|---|
| Desktop | ≥1200w, ≥1250h | Six snapped states, the tall compositions |
| Laptop | ≥1200w, <1250h | Six snapped states, a different set of blocks per state |
| Tablet | 768–1199w | One continuous scrolling page |
| Mobile | ≤767w | One continuous scrolling page, its own type scale |

Two reference cases layer extra spacing on the Laptop base, each in its own
media query after it:

| Case | Condition | On top of Laptop |
|---|---|---|
| 1440×1024 | ≥1440w, 900–1249h | Studio rhythm of 48px in State 03 |
| 1440×864 | ≥1440w, <900h | Header gap 24px, section gap 48px, Hero text gap 48px |

The corner not named by those cases — 1200–1439 wide and under 900 tall —
falls through to the plain Laptop set.

Desktop and Laptop deliberately show **different content per state** — e.g.
state 01 is Hero + Compass + Studio pillars on Desktop but Hero + Compass on
Laptop. The Laptop block lists its corrections at the top of its media query.
`main.js` mirrors the threshold in `CONFIG.breakpoints`
(`mobile: 768`, `layout: 1200`, `laptopHeight: 1250`) — **if you move a
breakpoint in one place, move it in the other.**

### Tablet and Mobile

Neither is a state machine. Both are ordinary scrolling documents: the canvas
becomes a plain column on a 24px rhythm, snapping is off, and every section
is present in order. The Step 01–06 language in the design notes describes
**content order**, not viewport states.

Three things there are worth knowing before editing:

- **Section rules are drawn, not bordered.** The flow needs five separators
  and the state machine only ever carried two elements, so each boundary is a
  `::before` on the section below it, inset 24px each side.
- **The Studio is one grid with everything flattened into it.** Both work
  wrappers and the pillars are `display: contents` so each pillar can be
  paired with its own work. Tablet runs two equal columns; Mobile runs three
  tracks — `140px | flexible | 99px` — because its two rows do not share a
  split. Useful Tools takes the first two tracks for its copy; Original
  Worlds takes the first for its artwork.
- **A few elements exist only here** and are inert above 768px: the visible
  Studio title, the second double rule, the single-line lockup and the
  Founder's short statement.

### The header band, and where a link lands

Below 1200px the Header sits over scrolling content, so `.site-header__bg`
carries a copy of the page background masked to fade out at its lower edge.
`bindHeaderBackdrop()` measures the lowest thing the Header actually
*paints* — the logo image, the nav links, the toggle bars, never the wrappers,
because the logo's link is stretched to the full Header height and measuring it
would leave no fade at all — and writes the result to `--band-solid` on the
root.

`--band-solid` is not only the band's own height. Every section reads it:

```css
scroll-margin-top: calc(var(--band-solid, calc(var(--header-height) * 0.75)) + 24px);
```

That is what puts a section's rule exactly where the band stops covering, and
it means **anything that changes the measurement changes where a link lands.**
The CSS fallback is only a guess for the moment before the first measurement.

Two consequences worth keeping in mind when editing:

- **Re-measure after anything that changes the Header's painted height.** The
  measurement is redone on scroll, on resize, when the fonts land, and by a
  `ResizeObserver` on the background. A new Header element that paints
  outside the current selector list will not be measured at all.
- **A fragment arriving from another page is applied twice.** Publishing and
  the Privacy Policy link to `/#studio`, `/#founder` and
  `#contact`. `applyLocation()` resolves the fragment immediately — against
  whatever the band measured at that point — and `initialise()` re-applies it
  once everything the landing depends on has settled: the Markdown copy, the
  web fonts, and the Header lockup image the band is measured from. It then
  calls the band measurement directly, through the `syncHeaderBand` handle
  `bindHeaderBackdrop()` leaves behind, so the value is taken at the moment
  it is used rather than inherited from whichever callback happened to run
  first. That ordering is the whole point: an earlier version waited on the
  fonts alone and was correct only because the fonts usually resolved after
  the band had been measured, which stopped being true once the fonts came
  from cache.

  The re-application is skipped if the reader has already touched the page —
  the test is for real input (`wheel`, `touchstart`, `keydown`,
  `pointerdown`), not for a changed scroll offset, because the browser
  anchors scrolling during reflow and comparing offsets reads its own
  correction as the reader moving.

**To check it after a Header or copy change:** land on `/#founder`
from Publishing, note `window.scrollY`, then click ABOUT from inside the
page and compare. They should be identical, with the section's top sitting at
exactly `scroll-margin-top`.

## Content

Long-form copy lives in `assets/Website_Texts.md`, and every page ships with
that copy already inlined so it renders on first paint, works without
JavaScript, and stays crawlable.

When the page is served over http(s), `main.js` re-fetches the Markdown,
parses it by heading structure into dotted keys, and replaces the text of any
element carrying a matching `data-content` attribute. Edit the `.md` and the
live site picks it up on next load.

The Markdown's own key path and the `data-content` names in the HTML are
**not** the same. Most sections are level-1 headings (`# Compass`,
`# Studio Works`, `# Founder`), and a level-1 heading resets the path, so
only the Hero ends up under a `home.` prefix. `CONTENT_ALIASES` in `main.js`
maps each stable HTML key onto the key the Markdown actually produces. **If
you add or rename a heading in the Markdown, update that table.**

A few keys have no Markdown source on purpose (the Navisworks title, the
Contact body copy) and keep their inlined HTML copy. Keep the HTML fallback
and the Markdown in sync by hand — there is no build step to enforce it.

`.pillar__description` is `white-space: pre-line`, so a line break authored in
the Markdown is honoured — that's what puts "Explore possibilities -" and
"Uncover opportunities." on their own lines.

**The fetch is layout-affecting, so two things wait on it.** Replacing the
copy can change how tall an authored state is, which changes the scale the
stage needs. `initialise()` keeps the promise (`textReady`) and re-runs
`updateStageScale()` when it resolves, unconditionally — the fonts are not a
proxy for this, since cached faces resolve first and would leave the fit
standing on copy that is about to be replaced. On a page carrying a fragment,
the landing is re-applied on the same signal. Neither is optional: without the
re-fit a state can be scaled for copy that is no longer on the page.

## Design tokens

Colours, type scale and spacing are custom properties at the top of
`styles.css` (`:root`). Nothing else hard-codes a brand value.

```
Gold Dark    #BF9440       Midnight     #0F172A
Gold Light   #F2D68A       Light Peach  #F0E5DC
                            Ivory        #F1EDE7
```

Type scale — `--hero-title-size` 64px · `--major-size` 48px ·
`--section-label-size` 24px · `--body-size` 20px · `--link-size` 16px. The
14px metadata size (footer legal line, form status) is set where it is used.
The only responsive override is the ≤767px phone tier; Desktop and Laptop
share one scale.

Rhythm — `--section-gap` 64px between the blocks of a state,
`--main-gap` 48px between the Header and the top of the stage. Separator
rules are blocks in their own right and sit on the same rhythm; the Hero's
own rule and the Studio divider are internal to their sections and don't.

**Background** — `.page-bg` is `position: absolute` over the full document
and scrolls with it. Four layers, bottom to top: solid Midnight; the
`Stars.avif` tile; a Midnight linear gradient, transparent at the top and
opaque by **120svh**; and a `#1E3A8A` radial anchored at the page bottom
(80% opaque at the bottom, 50% at the middle, clear at the top) with the
layer at 60%. The fade distance is stated in `svh`, not as a percentage of
the page — as a percentage it resolved to 120svh on Home but 20svh on
Publishing, which made the two pages look nothing alike.

## The contact form

- Client-side validation plus a honeypot; `POST /api/contact` does the real
  work and its failures surface in the form's own status line.
- The message box has no drag handle and no visible scrollbar, but it **is** a
  scroll container. `overflow-y: auto` does the scrolling; the scrollbar itself
  is taken out of the paint by `scrollbar-width: none`, `-ms-overflow-style`
  and `::-webkit-scrollbar`. Hiding it this way reserves no gutter, so the text
  measures the same width it did under `overflow: hidden` and the growth
  calculation is unaffected. `overscroll-behavior-y: contain` stops the wheel
  handing off to the snapping page when the reader reaches the end.
- `main.js` grows it a line at a time, adding the border back onto
  `scrollHeight` (the box is `border-box`) so the last line isn't clipped. It
  saves and restores `scrollTop` around the collapse-to-`auto` measurement,
  which would otherwise jump the view while typing.
- Growth stops at whichever limit comes first:
  1. **The state.** On Desktop 06 the space above the Footer is spent first,
     then the space either side of the separator closes from 64px towards its
     24px floor. Once there is nothing left to give, the box stops there. The
     Footer never moves and the stage never scrolls.
  2. **The 300px cap** in the stylesheet, where the state has room to spare —
     Laptop 06 carries only Contact and the Footer, so nothing is clamped and
     the box reaches the full 300px.
- Two things make step 1 work, and both are easy to undo by accident:
  `row-gap: 0` and `max-height: 100%` on `.stage-canvas` in state 06. The gap
  has to be zero because the separator carries its own 64px of clear space
  inside its box, and that box is the only flex item allowed to shrink. The
  cap has to be there because the canvas is `height: auto` everywhere else,
  and a flex container that grows with its content never has the free-space
  deficit `flex-shrink` needs — without it the separator stays at 130px, the
  state overflows, and state 06 scales down and renders narrower than 05.
- Typing never rescales the canvas. `updateStageScale()` runs on step change,
  resize and font load only. `resizeMessage()` clamps against the stage and
  then calls `updateStageFit()`, which re-answers `data-stage-fits` without
  touching `--stage-scale`, so the composition cannot shift mid-sentence.
- **500 characters is a hard limit, not a warning.** `clampMessage()` keeps the
  field at or under it, so there is no over-limit error to show — a 501st
  character never reaches the screen. At the limit the field *overwrites*
  rather than refuses: the character being typed takes the place of the one at
  the end. `maxlength` cannot express that (it drops the keystroke instead), so
  the markup carries `maxlength="500"` purely as the no-JS floor and `main.js`
  removes the attribute on boot.
- How the clamp decides what to drop: it diffs the field against the previous
  value to find the run that was just inserted, then takes the excess off the
  untouched tail first and only then off the characters immediately before the
  insertion — which, when typing at the end, is exactly the last character. A
  paste is trimmed to fit instead, so pasting never eats text already written.
- The countdown (`.contact-form__count`) holds the left of the Submit row. It
  is muted from 500 down to 51, gold from 50 to 1, and red at 0. It is wired to
  the field with `aria-describedby` rather than `aria-live`, which would
  announce on every keystroke.

### The one message slot

The form has exactly one place to speak: the left of the Submit row, indented
24px from the message box's left edge. Mobile drops that indent — Submit
already takes most of that row and the slot has no width to spare. Five states,
and never two at once.

| State | Shown | Colour |
| --- | --- | --- |
| Default | `500 characters left` | muted ivory |
| Nothing left | `0 characters left` | red |
| A field is empty | `Please enter the required information.` | red |
| A name has a character names do not | `Please enter a valid name.` | red |
| The address is malformed | `Please enter a valid email address.` | red |

- The countdown and the status are **separate elements** in that slot, because
  only the status should be announced — a live region that also carried the
  countdown would speak on every keystroke.
- **The status is never hidden and never removed.** A live region has to be
  sitting in the accessibility tree, empty, *before* its text arrives; several
  screen readers say nothing at all when a region appears and fills in the same
  moment. So emptying it is what takes it out of the row, and the countdown is
  what gets `hidden`. Empty it costs no height — `p` carries no margin here —
  so the row does not move. Never give it `display: none` or an `:empty` rule:
  either takes it straight back out of the tree and the announcement with it.
- **Every field the message is about points at it**, through
  `aria-describedby="form-note"`, added and removed as the message changes.
  `aria-invalid` alone says a field is wrong without saying why. `setStatus()`
  asks each field what *it* would complain about and matches that against the
  text on screen, so ownership needs no second rule to keep in step: a required
  message is described by every empty field, a name message only by the name
  that failed. The id is spliced into whatever `aria-describedby` a field
  already carries, so the message box keeps its countdown pointer.
- `formError()` decides the wording once for the whole form, not per field,
  because there is only one place to put it. **A missing field outranks
  everything else**: if anything is blank the reader is asked to fill it all in
  first, and the rest is raised once it is all that is left. Beyond that the
  fields are asked in the order they are read, so the complaint always belongs
  to the topmost field still wrong — a bad name before a bad address. Field
  outlines still go red individually — with a single generic message, the
  outline is what says *which* field.
- **Focusing the message box hands the slot back to the countdown.** The reader
  has turned to writing, and the room left is what matters there; the complaint
  is made again on the next attempt if it still stands. A *send* status is left
  alone — it reports what happened rather than what is wrong.
- An error standing in the slot is re-asked on every keystroke, so it can never
  outlive what it was complaining about: fill the missing field and it becomes
  the address complaint, fix that and the countdown returns without a submit.
- `setStatus()` re-measures the message box afterwards. In a narrow slot a
  message can wrap where the countdown did not, and on Desktop 06 the Contact
  block has a fixed height to live within, so the extra line has to come from
  somewhere.
- **What a name may be made of** (`namePattern`): letters from any script, the
  marks that accent them, spaces, hyphens, and the apostrophe in both its
  straight (`'`) and typographic (`’`) spellings. Anne-Marie, O'Connor, O’Connor,
  José, Müller, van der Berg and 't Hooft all pass; `@ # $ % & * + / \` and
  digits do not. It is an allow-list, so anything not named is rejected.
- `\p{M}` earns its place in that pattern. An accented letter can arrive either
  as a single code point or as a plain letter followed by a combining mark —
  which one turns up depends on the keyboard, the IME or the application it was
  pasted from — and the second spelling is no less a name than the first.
- **The endpoint enforces the same two rules.** `NAME_RE` in
  `functions/api/contact.js` mirrors `namePattern`, and `MAX_LEN.message` is
  500 to match `MESSAGE_LIMIT`. The browser's copies are for the person filling
  the form in; these are the rules that actually hold, because anything posting
  straight to `/api/contact` never runs the page's. **Keep each pair in step** —
  a rule relaxed on the server only lets bad data in, and one tightened there
  only rejects a submission the visitor was told was fine, with no way for them
  to see why. The 80/80/254 length ceilings remain the endpoint's own; the
  browser does not enforce those.
- **A visible complaint never moves the page.** Submit focuses the first failed
  field with `preventScroll: true` — the browser's own answer to a focus is to
  haul the field into the middle of the screen — and then `revealNote()`
  decides whether to scroll at all. If the slot is already on screen it does
  nothing; if it is not, it moves by the smallest amount that brings it back,
  never centring it. Desktop and Laptop are left out: the form is in the sticky
  stage there, where scrolling the page would change which state is shown.

### Keeping the form in view

- **`keepFormInView()` keeps the bottom of the form in sight while typing**, and
  it does a different job per layout. Both measure against
  `window.visualViewport`, not the layout viewport — a soft keyboard shortens
  what is left to look at without changing what the page is laid out in, so an
  element can be on screen by the page's reckoning and still sit behind the
  keyboard.
  - **Mobile** nudges as little as it can: Submit is brought `KEYBOARD_MARGIN`
    (16px) clear of the keyboard and nothing more, because there is too little
    room to spend on anything else. It only ever scrolls when something is
    actually covered.
  - **Tablet** anchors instead. Focusing the box pulls the Footer up to the
    bottom of the view and holds it there while the box grows, so the
    composition grows *upwards* against a fixed foot. At the 300px cap the
    heading, the box, the countdown, Submit and the Footer are all in view at
    once.
  - **Desktop and Laptop** are left out entirely. The form lives in the sticky
    stage, where scrolling the page changes which state is on screen rather
    than moving the form, and no keyboard is taking up room there anyway.
- It runs on focus (deferred a frame, so the browser's own scroll-to-caret and
  the keyboard have both settled), on the visual viewport's `resize` — which is
  where the keyboard arriving shows up, not a page resize — and on every
  keystroke as the box grows. One consequence worth knowing: on Tablet, because
  the anchor is re-applied on each keystroke, scrolling away and then resuming
  typing pulls the view back to the Footer.

## Changing an inline script

`_headers` pins the CSP to **sha256 hashes of the inline scripts** in
`index.html` and `publishing.html`. Editing the *contents* of any inline
`<script>` (the `js` class setter, Clarity, GA) invalidates its hash and the
browser silently refuses to run it. Attributes don't affect the hash; the
text between the tags does. After such an edit, regenerate:

```bash
node -e 'const fs=require("fs"),c=require("crypto");const s=new Set();for(const f of ["index.html","publishing.html"]){const h=fs.readFileSync(f,"utf8");const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;let m;while((m=re.exec(h)))s.add("sha256-"+c.createHash("sha256").update(m[1],"utf8").digest("base64"));}console.log([...s].map(x=>`'"'"'${x}'"'"'`).join(" "))'
```

and paste the result into the `script-src` directive.

## Analytics consent

Google Analytics and Microsoft Clarity are **not** in the markup. They are
injected by `loadAnalytics()` in `main.js`, and only after the visitor has
accepted. Under PECR and the ePrivacy rules neither is strictly necessary, so
consent has to come *before* they run — a tag sitting in the page has already
fired by the time anyone is asked, which is the whole reason this module
exists.

- The banner is built in JavaScript (`buildConsentBanner`) and shown only on
  a page carrying `data-analytics` on `<body>`.
- The decision lives in `localStorage` under `ns-analytics-consent`, not a
  cookie, so it is not sent on every request. Storing the decision is itself
  strictly necessary — it is what stops the visitor being asked twice.
- **Decline and withdrawal both clear traces.** `clearAnalyticsTraces()`
  expires anything matching `/^(_ga|_gid|_gat|_clck|_clsk|clarity|CLID)/i`
  across the host, the dotted host and the parent domain, on both paths, and
  removes matching storage keys — everything except the consent key itself.
- The Privacy Policy carries a `[data-consent-reopen]` button so a visitor
  can change their mind.
- Focus moves to the banner, not to ACCEPT. Focusing the accept button would
  be a nudge, and it drew the gold focus ring onto one of two choices that are
  meant to be visually equivalent.

The two script origins are allow-listed in the CSP `script-src` and
`connect-src`. Removing analytics means removing them there too.

## Deploying — Cloudflare Pages

The domain `northstardust.studio` is active in Cloudflare with SSL. The
project targets Cloudflare **Pages** (build command: none, output directory
`/`), so `functions/api/contact.js` maps to `POST /api/contact` automatically
on deploy — no router or extra config.

**Required environment variables** (Pages dashboard → Settings → Environment
variables — never commit these, never reference them from client-side code):

| Variable | Example | Notes |
|---|---|---|
| `RESEND_API_KEY` | *(secret)* | API key from [resend.com](https://resend.com) |
| `CONTACT_FROM_EMAIL` | `contact@northstardust.studio` | must be a Resend-verified sending domain |
| `CONTACT_TO_EMAIL` | `northstardust.studio@gmail.com` | where messages land |

Until those are set, `/api/contact` responds `503` with a message pointing
visitors to the studio's email directly — the form surfaces that honestly
rather than pretending to succeed.

If the project ever moves from Pages to a standalone Worker, the logic in
`functions/api/contact.js` moves into a `fetch()` handler essentially
unchanged — only the export shape (`onRequestPost` → `fetch`) differs.


### Rate limiting `POST /api/contact`

Dashboard configuration, not repo code: **Security → WAF → Rate limiting rules**
on the `northstardust.studio` zone. Nothing in this repository creates it, so it
has to be re-created by hand if the zone is ever rebuilt.

| Field | Value |
|---|---|
| Rule name | `Contact form — 10 per 10 seconds` |
| If incoming requests match | *Edit expression* (custom), see below |
| Rate limiting characteristics | **IP** |
| Period | **10 seconds** |
| Requests | **10** |
| Then take action | **Block** |
| Duration | **10 seconds** |

These are the values actually deployed on the zone. Cloudflare's period
selector also offers 60s, 120s, 300s, 600s and 3600s, so the window can be
widened later without touching anything in this repository.

Expression:

```
(http.request.method eq "POST" and lower(http.request.uri.path) eq "/api/contact")
or
(http.request.method eq "POST" and lower(http.request.uri.path) eq "/api/contact/")
```

**Why `lower()` and both spellings.** Cloudflare Pages routes `/api/contact/`
and `/api/Contact` to the same Function — all three were confirmed returning
422 in production — so a rule written as `http.request.uri.path eq
"/api/contact"` would sit there looking correct while anyone could walk around
it by adding a slash or a capital letter. `lower()` is not plan-restricted. The
regex `matches` operator would be shorter but needs Business or above, so it is
deliberately not used here.

**On the block duration.** The rule blocks for 10 seconds, so an over-eager
caller is refused and then let straight back in. It is a temporary block that
clears itself rather than a fixed-length ban, which is the intended behaviour
here.

**Free plan allows one rate limiting rule.** If a rule already exists on this
zone, this one replaces it rather than joining it.

**What it does not touch.** Only `POST` to the contact endpoint is counted.
Every page, stylesheet, script, font and image is a `GET` and never matches, so
browsing is unaffected however fast someone clicks. `GET /api/contact` does not
match either; it is already answered with `405` by the Function itself. A person
sending one message, or sending a second after correcting something, is nowhere
near ten in ten seconds.

**To verify it after creating it.** Twelve `POST`s with an empty body: the
first ten return `422` (validation fails, no email is sent) and the remainder
return `429`.

```bash
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://northstardust.studio/api/contact \
  -H 'content-type: application/json' \
  -d '{"firstName":"","lastName":"","email":"","message":""}'; done
```

The rule is deployed and this has been run against production: the burst is
cut off with `429` exactly as described. Before the rule existed all twelve
returned `422`, so a run that returns twelve `422`s means the rule is gone,
not that the endpoint is broken.

Two things the test can appear to pass without exercising: a slow connection
can spread twelve requests over more than the window, and `/api/contact/` or
`/api/Contact` reach the same Function, which is why the expression covers
them. Send the burst fast, and against the exact path.

## Accessibility

- Semantic landmarks, one `h1` per page, logical heading order. The Hero
  phrase is the `h1`; Studio has a visually-hidden `h2` with the three pillar
  titles as `h3`s beneath it.
- The skip link targets `#main-content`, which carries `tabindex="-1"` so
  focus really moves. Its focus ring is deliberately suppressed — that
  element is the full width of the page and several screens tall, so the
  shared ring painted its top edge as a stray gold line under the Header.
  Every other focus ring is untouched.
- Header links are intercepted only when the script can perform the scroll
  itself; otherwise the plain `#hash` anchor stays in charge. Below 1200px,
  where the anchor track is hidden, navigation falls back to the section
  element.
- All form fields have a real (visually-hidden) `<label>` — a placeholder is
  not an accessible name. Errors are wired with `aria-invalid` and a live
  status line, not colour alone.
- Starfield drift/twinkle and every transition are disabled under
  `prefers-reduced-motion`; in-page scrolling switches to `auto` there too.
- The founder's LINKEDIN/ARTSTATION links are a plain `<ul>`, not a `<nav>`.
  Two external profile links in a biography aren't a major navigation region,
  and marking them up as landmarks put two identically-named `navigation`
  entries in the accessibility tree. `html-validate` reports zero errors on
  both pages.

## Maintenance

| Task | When |
|---|---|
| Update copy | Edit `assets/Website_Texts.md` **and** the matching HTML fallback |
| Add/rename a Markdown heading | Update `CONTENT_ALIASES` in `main.js` |
| Edit an inline script | Regenerate the CSP hashes in `_headers` |
| Move a breakpoint | Change it in `styles.css` **and** `CONFIG.breakpoints` |
| Change the type scale or rhythm | Re-check `MIN_STAGE_SCALE` — it is derived from the body size |
| Change anything the Header paints | Re-check `--band-solid` and where a cross-page link lands |
| Add a page | Add it to `sitemap.xml`, `llms.txt`, and the footer Privacy link row |
| Link to a page | Use the extensionless URL — never `.html` (see "Pages" above) |
| Add or restyle a form field | Check it autofilled — see "Autofill" in `styles.css` |
| Review the Privacy Policy | Annually, and whenever a processor or a data flow changes |
| Confirm domain auto-renew | Annually |
| Check outbound links resolve | Annually |
| Rotate `RESEND_API_KEY` | Per Resend's own guidance |
