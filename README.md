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
contact.html       Redirect stub → index.html#contact (kept for old links/
                    bookmarks; noindex, not part of the live site otherwise)
```

Header and footer markup is duplicated across `index.html` and
`publishing.html` — there is no templating layer in a build-free static site.
**If you change the header or footer, change it in both files.**

## Files

```
index.html · publishing.html · contact.html
styles.css        design tokens + every rule, in one file
main.js           viewport profile, six-state tracking, header/mobile nav,
                   copy sync, contact form
functions/_middleware.js   Cloudflare Pages Function — blocks public access
                   to non-website paths (Trash Bin/, README.md, references/…)
functions/api/contact.js   Cloudflare Pages Function — POST /api/contact
_headers          security headers, incl. the CSP (see "Changing an inline
                   script" below)
robots.txt · sitemap.xml · llms.txt · favicon.ico
assets/
  fonts/          Cormorant 400, Spectral 400, Inter 400/500/600 (woff2)
  img/            logo-double-line.svg, logo-single-line.svg,
                   founder-rounded.png, Stars.avif, favicons, og-image.jpg,
                   Hero Image.png, Cover Page Navisworks Guide.png,
                   Original Worlds.png
  Website_Texts.md   editable long-form copy (see "Content" below)
  CHANGES.md      historical design-update spec; blocked from public serving
  references/     Figma exports used as visual reference; not served live
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
- The message box has no scrollbar and no resize handle. `main.js` grows it a
  line at a time up to `max-height: 300px`, adding the border back onto
  `scrollHeight` (the box is `border-box`) so the last line isn't clipped.
- On Desktop state 06 the box can stop growing **before** 300px: the space
  above the Footer is spent first, then the space either side of the
  separator, and once both are at their 24px floor the box gives back
  whatever still overflows the stage. The Footer never moves.
- 500 characters is the limit. Past it a red line appears under the box and
  submission is blocked.

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
| Confirm domain auto-renew | Annually |
| Check outbound links resolve | Annually |
| Rotate `RESEND_API_KEY` | Per Resend's own guidance |
