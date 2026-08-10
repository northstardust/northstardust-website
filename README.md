# North Stardust — Website V1

A single-page static site. No framework, no build step, no dependencies.
Edit the files, commit, push — that's the whole workflow.

---

## Files

```
index.html      the entire site
styles.css      one stylesheet (design tokens at the top, in :root)
main.js         ~20 lines: one subtle scroll reveal. The site works without it.
robots.txt
sitemap.xml
favicon.ico
assets/
  fonts/        Cormorant 300, Spectral 300/400, Inter 400/500/600 (woff2)
  img/
    lockup-peach.svg    hero lockup — "Single Line Light Peach"
    wordmark-light.svg  header wordmark — "Wordmark Light Single Line"
    star.svg            mobile header mark + footer mark — "Icon M-256"
    guide-cover.*       publication cover (WebP + JPEG)
    founder.*           founder portrait (WebP + JPEG)
    favicon-32.png · apple-touch-icon.png · logo.png · og-image.jpg
```

All four SVGs are the supplied files from `assets-source`, unmodified apart
from running SVGO (whitespace and metadata removal — no path or colour
changes). The favicons, `logo.png` and the OG image are generated *from*
`star.svg` and `lockup-peach.svg` rather than drawn by hand.

**One note on the source folder:** `NORTH STARDUST Stamp dark.svg` is
actually a PNG file with an `.svg` extension — worth renaming in your asset
library. It is not used here; the footer uses the vector `Icon M-256`.

## Editing

**Text** — all copy lives in `index.html`. Search for the section comment
(`<!-- ── Founder ── -->`) and edit in place.

**Colours, spacing, type sizes** — change the custom properties in `:root`
at the top of `styles.css`. Nothing else hard-codes a brand colour.

**Type scale — four display steps, one body step, two interface steps.**
Defined once in `:root` as `--fs-d1` … `--fs-d4`, `--fs-body`, `--fs-small`,
`--fs-eyebrow`. Nothing else may introduce a size; every rule references a
token. (300 and 400 are *weights*, not steps.)

Five sizes, and only five. Desktop values (from ~1200px up):

| Token | Size | Used by |
|---|---|---|
| `--fs-h1` | **64px** | the statement band |
| `--fs-h2` | **44px** | Studio and Contact headings |
| `--fs-h3` | **28px** | Founder and Looking Ahead headings, hero line, Direction text, contact email |
| `--fs-body` | **20px** | every paragraph |
| `--fs-small` | **14px** | nav, labels, link rows, metadata, legal |

Each clamp scales down below ~1200px so nothing overflows on small screens;
`--fs-d1`…`--fs-d4` remain as aliases onto these five steps.

**Measures.** Every block is set to read as few, balanced lines on desktop:
hero 3, Studio heading 3, Studio and Founder paragraphs 2–3, Direction 3,
Contact 3. Adjust the `ch` values on each block, not the type sizes.

**Wide viewports.** `--shell`, `--rail`, `--gutter` and `--section-y` step up
at 1500px and again at 1900px, all bounded. The layout keeps scaling past a
laptop instead of freezing a 1200px column in the middle of a large monitor;
nothing stretches without a cap.

**Seamless bands.** There are no horizontal borders anywhere between
sections. Where the tone changes (Founder, Direction, Contact) it is a
`linear-gradient` resolving over the top ~14vh of the section, so the step is
felt rather than seen. The footer shares Contact's tone and is separated by
space alone.

**The statement band glow is deliberately not clipped.** Its `__glow` div is
200% of the section height and the section does **not** hide overflow, so the
glow bleeds into the identical midnight above and below — there is no box
edge for a seam to appear at. Clipping it (either by `overflow:hidden` or by
painting the radial on the section background) is what produced the visible
cut line. Horizontal width is capped at `100vw` so it never creates scroll.

**The sticky header is opaque**, with a 2.75rem gradient strip beneath it
(`.masthead::after`) painted in the page background. Text scrolling under the
bar fades out rather than being sliced mid-glyph, and `scroll-padding-top` is
7rem so anchor targets clear both.

**The wordmark** is an inline `<symbol id="ns-wordmark">` at the top of
`<body>`, referenced by `<use>` in the header and footer. Its path is
`fill="currentColor"`, so the header link transitions cream → gold on hover
and focus like any other link — no CSS filters, no duplicate gold asset.

**The Studio heading** carries two `<br class="brk">` hints, suppressed below
1200px. Above that it sets as three lines; below, it wraps naturally. The
originally requested split ("…and home for original Intellectual Property."
as one line) needs a 1015px measure at the approved display size, and the
widest column the layout allows is 892px — so the break points were chosen
to give three even lines at full size rather than shrinking the type.

**Typography — three families, three jobs, no overlap.**

| Family | Job | Where |
|---|---|---|
| Cormorant Garamond 300 | brand only | the statement band, and nowhere else |
| Spectral 300 / 400 | the studio's voice | headings, hero line, body, Direction, Contact, Founder |
| Inter 400/500/600 | the interface | nav, section labels, metadata, link rows, legal |

Spectral replaced Cormorant as the reading face because Cormorant is a
high-contrast *display* type: light-on-dark optically thins its hairlines,
and it was showing badly at mid display sizes. Spectral was drawn for
on-screen reading and holds its stems on midnight at every size here.
Cormorant survives in exactly one place — the statement band — because it
is the wordmark's face, so that setting echoes the logo.

Spectral has a much larger x-height than Cormorant, so the whole display
ladder in `:root` sits about 12% lower than before. If you ever swap the
serif, re-check those numbers; they are tuned to this face.

**To restore the Published Work section** when the Guide ships, follow the
three steps in the comment block in `index.html` (search for
`PUBLISHED WORK — hidden`). Step 3 needs this node added back to the
JSON-LD `@graph`:

```json
{
  "@type": "Book",
  "name": "Practical Guide to Autodesk Navisworks",
  "author": { "@id": "https://northstardust.studio/#founder" },
  "publisher": { "@id": "https://northstardust.studio/#organization" },
  "bookEdition": "First Edition",
  "inLanguage": "en-GB",
  "datePublished": "2026",
  "image": "https://northstardust.studio/assets/img/guide-cover.jpg",
  "about": "BIM coordination, clash detection, and 4D and 5D workflows in Autodesk Navisworks."
}
```

The `.section--light` / `.work` / `.status` / `.meta` styles and the
`guide-cover` images are all still present and untouched.

**Adding a further work entry** — duplicate the `<article class="work">`
block. Keep all six fields (title, type, status, description, year,
publisher) so entries stay consistent as the list grows. The status label
vocabulary is deliberately closed: `Published` and `In development`.

**Links** — the studio's link lives in Contact, the founder's in the Founder
section. They share the `.linkrow` treatment; `.linkrow--founder` renders one
step quieter. Every link carries an explicit `aria-label` naming its owner,
so "LinkedIn" is never ambiguous to a screen reader.

## Running it locally

Double-click `index.html` — asset paths are relative, so it opens straight
from disk. For an exact match to production:

```
python3 -m http.server 8000     # then visit http://localhost:8000
```

## Deploying

Recommended: **Cloudflare Pages**, connected to this repository.

- Build command: *(none)*
- Build output directory: `/`
- Custom domain: `northstardust.studio`

Every push to `main` publishes. GitHub Pages works identically if preferred.

**Before going live**, decide the canonical host — `northstardust.studio`
or `www.northstardust.studio` — and permanently redirect the other. The
chosen form is already written into `index.html` (canonical tag, Open Graph
`og:url`, JSON-LD) and `sitemap.xml` as the apex domain. If you choose
`www`, update those four places.

## Maintenance

There are no dependencies to patch — that is the point of the plain-HTML
approach. The only recurring jobs:

| Task | When |
|---|---|
| Update work entries / statuses | As the work changes |
| Confirm domain auto-renew | Annually |
| Check outbound links resolve | Annually |

## Accessibility notes

Verified by static review and automated checks in a headless browser,
against WCAG 2.2 AA:

| Criterion | Result |
|---|---|
| 1.4.3 Contrast (minimum) | pass — 37 text nodes sampled, lowest ratio **5.00:1** |
| 1.4.4 Resize text | pass — no horizontal scrolling at 150% or 200% text-only zoom |
| 1.4.10 Reflow | pass — no horizontal scrolling at 320 CSS px |
| 1.4.12 Text spacing | pass — with the 1.5×/2×/0.12em/0.16em override applied, nothing clips or overflows |
| 2.4.7 Focus visible | pass — gold ring on all nine focusable elements |
| 2.4.11 Focus not obscured | pass — sticky header cleared via `scroll-padding-top`; skip link sits above it (z-index 100 vs 50) |
| 2.5.8 Target size (minimum) | pass — every interactive target ≥ 44px, well above the 24px minimum |

Also: semantic landmarks, one `h1`, logical heading order, alt text on every
image, all three navigation links reachable from 320px upward with no
overlap, no console or request errors, works with JavaScript disabled and
under `prefers-reduced-motion`.

Two notes on how the zoom cases are held:

- Grid children carry `min-width:0`, so a non-breaking token (like
  "Intellectual&nbsp;Property.") cannot size a whole track and force
  horizontal scrolling when text is enlarged on its own.
- The descriptor terms are held together by `&nbsp;` in the markup rather
  than `white-space:nowrap`. Identical result at every normal size, but
  unlike `nowrap` it can still be broken by `overflow-wrap` when a term is
  too large to fit at all.

Not yet done: screen-reader and real-device testing.

One deliberate palette addition: `--gold-ink` (`#8A6420`) is a darkened
shade of the brand gold, used **only** on the ivory Published Work section.
The brand gold `#BF9440` reaches just 2.39:1 on ivory and cannot carry text
there; `#8A6420` reaches 4.59:1. On midnight, the brand golds are used
unchanged.
