# North Stardust — Website V1 Specification

**Revision 6 — as built.** Supersedes Revisions 1–5.

## Changes in Revision 6

| # | Change | Reason |
|---|---|---|
| 1 | **Statement band glow contained** in a `__glow` div inside `overflow:hidden`, matching the Direction section | A radial painted on the section background was hard-clipped at the box edge; that clip was the rough transition |
| 2 | **All measures widened** — hero 39ch, Studio/Founder body 72–74ch, Direction 58ch, Contact heading 38ch | Fewer, better-balanced lines and more horizontal spread |
| 3 | Hero, Direction and Contact now read as **3 balanced lines** on desktop (were 4–5) | — |
| 4 | Display/heading audit completed and recorded | See table below |

**Display ladder, computed at 1440px.** Four display steps, one body step,
two interface steps — every rule references a token.

| Token | Size | Weight | Face | Purpose |
|---|---|---|---|---|
| `--fs-d1` | 70.4px | 300 | Cormorant Garamond | statement band — the brand's own words |
| `--fs-d2` | 54.4px | 300 | Spectral | primary section headings (Studio, Contact) |
| `--fs-d3` | 37.6px | 300 | Spectral | secondary headings (Founder, Direction) |
| `--fs-d4` | 32.8px | 300 / 400 | Spectral | lead statements — hero line, Direction text, contact email |
| `--fs-body` | 19.2px | 400 | Spectral | every paragraph |
| `--fs-small` | 13px | 400–600 | Inter | nav, link rows, founder role, attribution |
| `--fs-eyebrow` | 11.52px | 400 / 600 | Inter | section labels, descriptors, legal |

**Line counts on desktop (1280–2560px):** hero 3 · Studio heading 3 ·
Studio paragraphs 2 · Founder paragraphs 3 · Direction 3 · Contact 3.

---


## Changes in Revision 5

| # | Change | Reason |
|---|---|---|
| 1 | **Wide-viewport tier** — `--shell`, `--rail`, `--gutter`, `--section-y` step up at 1500px and 1900px, all bounded | The layout froze at 1140px, so a 2560px monitor showed the laptop layout stranded in the middle. Now it responds to the viewport across the whole desktop range |
| 2 | **All section seams removed** | Tone changes are now `linear-gradient`s resolving over the top ~14vh of each section; the footer shares Contact's tone and is separated by space alone |
| 3 | **Wordmark inlined as an SVG symbol** with `fill:currentColor` | Gives a real cream → gold transition on hover and focus. No CSS filters, no second asset; header and footer share one symbol |
| 4 | **Hero rhythm opened up** | More space between lockup → descriptor → statement → ornament, taken from existing slack plus hero bottom padding rather than by enlarging type |
| 5 | **Studio heading set as three lines** ≥1200px | See note below |
| 6 | **Type scale consolidated** to 4 display steps + 1 body + 2 interface | Six display sizes and three label sizes had accumulated; every rule now references a token |
| 7 | Canonical host confirmed as the apex `northstardust.studio` throughout | Verified across canonical, OG, Twitter, JSON-LD and sitemap |

**On the Studio heading.** The requested split — "and home for original
Intellectual Property." as the third line — needs a 1015px measure at the
approved display size (54.4px). The widest body column the layout allows,
even at 2560px with the new wide tier, is 892px. Delivering it would have
required a ~14% cut to the primary display size, applied globally. Instead
the break points were chosen to give three even lines at full size:
"North Stardust is an independent / creative studio and home for / original
Intellectual Property." — 781 / 667 / 690px, fitting from 1200px upward.

---

**Date:** 9 August 2026 · **Status:** Built, reviewed, written to
`C:\Projects\NorthStardustStudioWebsite`.

---

## Changes in Revision 4

| # | Change | Reason |
|---|---|---|
| 1 | **Published Work hidden**; WORK removed from navigation | The Guide has not shipped. The section is commented in place with restore instructions; CSS and cover images untouched |
| 2 | schema.org **Book node removed** from the JSON-LD graph | Publishing structured data for an unshipped book would be a false claim. Restore snippet is in the README |
| 3 | **Tonal rhythm added** — Founder and Contact step to `--midnight-deep` | Work was the page's only light band; without it the page was one flat dark field. Two ~0.5% luminance steps, not a second bright moment |
| 4 | **Contact trimmed** to email + North Stardust LinkedIn | Website is redundant on the website; GitHub has no visitor-facing content |
| 5 | **Footer rebuilt** as a page-width colophon | See §C.7 |
| 6 | **Spectral replaces Cormorant** as the reading face; Cormorant retained for the statement band only | See §C.5 |
| 7 | Grid `min-width:0`, `overflow-wrap`, `&nbsp;` descriptor terms | Fixes horizontal scrolling under text-only zoom; see §E |
| 8 | Brand link given a 44px target; nav labels restored to 13px at 320px | 2.5.8, and the space freed by dropping a nav item |

---

## Changes in Revision 3

| # | Change | Reason |
|---|---|---|
| 1 | **Brand assets migrated to the supplied SVGs** | `assets-source` provided true vector files; the site now uses them for the hero lockup, header wordmark, mobile mark and footer mark |
| 2 | **Hero lockup is now horizontal** (star + single-line wordmark) | The supplied light lockups are single-line; no light double-line lockup exists in the kit, and composing one would have invented spacing the studio has not set |
| 3 | **Studio copy replaced** with the current-stage wording | Supplied |
| 4 | **Selected Work → Published Work** | Supplied |
| 5 | **Founder links added** — LinkedIn, ArtStation | Kept in the Founder section, visually one step quieter than the studio's own links, each with an `aria-label` naming its owner |
| 6 | **`northstardust.studio` added to Contact** | Supplied. Reversed my Rev. 2 recommendation — a twice-stated preference outweighs the aesthetic objection |
| 7 | **Mobile navigation rebuilt** | All four links now visible from 320px; see §C.6 |
| 8 | Footer seal replaced by the vector star | Vector, quieter, and echoes the hero mark |

---

## Changes in Revision 2

| # | Change | Reason |
|---|---|---|
| 1 | **Organization Framework App removed** | Excluded from V1 by the client |
| 2 | **Fruit Adventures removed** | Excluded from V1 by the client |
| 3 | Selected Work then held **one entry**, not three | Follows from 1 and 2 |
| 4 | Status vocabulary reduced to **`Published`** | Only value currently in use; `In development` retained in the CSS and README for future entries |
| 5 | **Statement band added** between Studio and the work section | Carries the confirmed brand line *"Original worlds, built to last."* |
| 6 | All information gaps in Rev. 1 §D.6 **closed** except two | See §G |
| 7 | Palette, typefaces, assets, links and copy **confirmed and applied** | Supplied by the client |
| 8 | Hosting recommendation held at **Cloudflare Pages** | Unchanged |

Everything in Rev. 1 not listed above still stands.

---

## A. Purpose

North Stardust will not be *discovered* through this website. Every early
visitor arrives already holding a reference — a LinkedIn profile, a GitHub
account, the Navisworks guide, a conversation. The site is therefore a
**destination for referral traffic**, not a discovery channel. Its job is
confirmation, not persuasion.

A visitor should leave, after one unhurried scroll, understanding:

| # | Question | Answered by |
|---|---|---|
| 1 | What is North Stardust? | Hero + Studio |
| 2 | What has it actually published? | *(deferred — see Rev. 4)* |
| 3 | Who founded and directs it? | Founder |
| 4 | Where is it heading? | Direction |
| 5 | How do I reach it? | Contact |

The success measure is **an accurate mental model** — including an accurate
sense of scale. If a visitor leaves believing the studio is larger, older or
further along than it is, V1 has failed.

The site does not need to sell, convert, rank competitively, or explain the
studio in full.

---

## B. Structure — as built

```
Header       Wordmark (star on mobile) · Studio · Founder · Contact
1 Hero       Lockup, descriptor, one-sentence claim
2 Studio     What the studio is and how it is being developed
3 Statement  "Original worlds, built to last."
—            [Published Work — commented out until the Guide ships]
4 Founder    Athanasios Zagkliveris — bio, LinkedIn, ArtStation
5 Direction  Looking Ahead
6 Contact    Email, North Stardust LinkedIn
Footer       Wordmark + descriptor | attribution + copyright
```

Two structural decisions carried over from Rev. 1 and worth restating:

**Founder sits after Work, not before it.** *Founder → Work* reads as a
person with a portfolio. *Work → Founder* reads as a studio with a creative
director. Same content, different studio.

**Direction is a scope statement, not a roadmap.** It names areas of
practice and never things that will exist. The heading is "Looking Ahead"
rather than "Future" or "Roadmap" — those headings require promises to
follow them.

---

## C. Design direction

**One line:** a quiet nocturnal studio page — midnight ground, gold used as
light rather than decoration, editorial serif restraint — that reads as a
publisher's imprint rather than a landing page.

### The decisions that carry it

**1. Dark-dominant.** The brand mark is a gold star on midnight; the palette
is midnight and gold. A light page would have fought the identity. Dark also
puts immediate distance between North Stardust and the SaaS-landing-page and
consultancy conventions the brief rules out, both of which are
overwhelmingly light. Gold then behaves like light rather than like a
highlighter.

**2. One light section, and it is Published Work.** Rather than alternating
bands — which reads as corporate section-striping — the page inverts exactly
once. The guide's cover is a dark navy object; on ivory it reads as a
physical book resting on a page, which is precisely the framing the brief
asks for ("a published work, not a service"). The inversion is the single
loudest moment on the page and it is spent on the studio's only completed
work.

**3. A shared left rail.** Studio, Founder and Contact use the same
two-column grid — a small gold section label on the left, content on the
right — so the body column starts on the same x-axis down the entire page.
Published Work deliberately breaks that rail and spans the full measure. The
break is the emphasis.

**4. The founder portrait lives in the rail, at 240px.** It is markedly
smaller than the guide cover, and the founder text is markedly shorter than
the work description. The proportions are the argument that the studio, not
the person, is the subject.

**5. Typography does the decorating — three families, three jobs.**

| Family | Job | Where |
|---|---|---|
| Cormorant Garamond 300 | brand | the statement band, and nowhere else |
| Spectral 300/400 | the studio's voice | headings, hero line, body, Direction, Contact, Founder |
| Inter 400/500/600 | the interface | nav, labels, metadata, links, legal |

Cormorant is a *display* face: very high stroke contrast, small x-height.
Light-on-dark text optically thins, so its hairlines were being eaten —
worst at the mid display sizes, which is exactly where it was used most.
Four candidates were set at the real sizes on the real background and
compared: Source Serif 4 fixes the fragility but reads institutional and
would flatten the page's character; Newsreader sits in Cormorant's genre and
thins the same way; Literata is sturdy but dense. **Spectral** keeps
Cormorant's sharpness while carrying enough stem weight and x-height to hold
at every size on midnight — a refinement rather than a change of direction.

Cormorant survives in exactly one place, because that setting is the brand's
own words and the wordmark is Cormorant. One use, one reason.

Spectral's x-height is much larger, so the display ladder sits ~12% lower
than the Cormorant one. Those numbers are tuned to this face.

No illustration, no stock photography, no iconography. The only ornament is
a single four-point star at the statement band, and two soft radial glows
behind the hero and Direction.

**6. Mobile navigation: the mark shrinks so the navigation can stay.**
Below 720px the header wordmark is replaced by the star alone — exactly what
an app icon or favicon does — which frees enough width for all four section
links to remain visible on one row down to 320px. The alternative, a
hamburger drawer, would have added JavaScript, a hidden state, focus
management and an ARIA-expanded contract to serve four anchor links on a
single-page site. Nothing is hidden, nothing needs opening, and every target
is 44px.

**7. The footer is a conclusion, not an island.** It was a centred stack —
mark, name, descriptor, attribution, copyright — which concentrated
everything in the middle and left the width unused. It is now a page-width
colophon on the same shell grid as every other section: wordmark and
descriptor left, founder statement and copyright right, bottom-aligned,
under a gold hairline. Below 720px it stacks, still left-aligned. The star
was dropped rather than set beside the wordmark: pairing them would improvise
a lockup whose proportions the studio has not set.

### Held back deliberately

No parallax, no counters, no card grids, no gradient buttons, no hover
lifts, no animation library, no hamburger menu — see §C.6 for how the
mobile navigation is solved without one.

---

## D. Section specification — as built

| # | Section | Content | Visual asset | Words |
|---|---|---|---|---|
| — | Header | Wordmark (star below 720px), 4 anchors always visible | `wordmark-light` · `star` | 5 |
| 1 | Hero | Lockup, descriptor, claim | `lockup-peach` | 30 |
| 2 | Studio | First supplied sentence promoted to the `h2`; two paragraphs | none | 90 |
| 3 | Statement | "Original worlds, built to last." | star ornament | 5 |
| 4 | Published Work | Status, title, topics, description, 5-field metadata list | `guide-cover` | 105 |
| 5 | Founder | Name, role, two paragraphs, two personal links | `founder` portrait | 95 |
| 6 | Direction | "Looking Ahead" + one paragraph | none | 35 |
| 7 | Contact | Supplied sentence as `h2`, email, three links | none | 30 |
| — | Footer | Star, identity, attribution, copyright | `star.svg` | 35 |

**Total body copy ≈ 400 words** — inside the 600–750 target of Rev. 1, and
appropriately shorter now that two projects have been removed.

### Notes on individual sections

**Studio.** The supplied opening sentence — *"North Stardust is an
independent creative studio and home for original Intellectual Property."* —
is set as the section's `h2` rather than buried in a paragraph. It is the
strongest sentence in the brief and it makes the heading carry meaning
instead of just saying "Studio".

**Published Work.** The publication metadata (Edition, Language, Author, Publisher,
First published) is doing real work: it fills a section that holds a single
item with *verifiable substance* rather than padding, and it reinforces the
"published work" framing. The `Published · 2026` label appears before the
title, so status is read before description.

Excluded here, per the brief: Autodesk or Navisworks branding, BIM/AEC
positioning, services language, chapter listings, and any purchase link
(none was supplied — see §G).

**Contact.** The supplied sentence is set as the `h2` and the email address
is set in Cormorant at display size, making it the page's clear terminal
action. `mailto:` rather than a form — a form needs a backend, spam handling
and two more UI states to serve what will be a handful of messages.

`northstardust.studio` now appears in the Contact link row as supplied. I
argued against it in Rev. 2 — listing a site's own address as a way to reach
it is circular — but it is useful to copy when sharing, and a preference
stated twice outweighs the objection.

---

## E. Technical — as built

**Static HTML + CSS.** No framework, no build step, no package manager, no
dependencies to patch. One 20-line script provides a single scroll reveal
and the page is fully functional without it.

```
index.html · styles.css · main.js · robots.txt · sitemap.xml · favicon.ico
assets/fonts/  Cormorant Garamond 300/400, Inter 400/500/600 (latin woff2)
assets/img/    brand marks, portrait, guide cover, favicons, OG image
README.md
```

| Item | Decision |
|---|---|
| Brand assets | The supplied SVGs, used unmodified apart from SVGO whitespace/metadata stripping. Favicons, `logo.png` and the OG image are generated *from* those vectors |
| Fonts | Self-hosted woff2, latin subset, `font-display:swap`, Spectral 300/400 preloaded. Six files, ~148 KB. No font CDN, no third-party request, no consent implications |
| Paths | Relative — `index.html` opens correctly straight from disk *and* from a server root |
| Design tokens | All colour, type and spacing values are custom properties on `:root` |
| Images | WebP with JPEG/PNG fallback via `<picture>`; explicit `width`/`height` on every image; below-fold images lazy-loaded |
| Weight | **~180 KB first paint**, ~250 KB after scrolling the whole page |
| SEO | Title, description, canonical, OG + Twitter tags, one `h1`, semantic landmarks, `lang="en-GB"`, `sitemap.xml`, `robots.txt` |
| Structured data | JSON-LD graph: `Organization` + `Person` (`worksFor`) + `Book` (`author`, `publisher`) + `WebSite`. This is what lets search and AI systems associate the studio, the founder and the publication as one entity |
| Repository | Single GitHub repo, `main` deploys, no branching model |
| Hosting | **Cloudflare Pages** — free, deploy on push, no build command, automatic HTTPS, and free cookieless analytics if wanted later. GitHub Pages is an equally valid fallback |
| Analytics | None installed. Cloudflare Web Analytics can be switched on in minutes; it sets no cookies, so no banner |
| Maintenance | No dependencies. Update work entries as they change; confirm domain auto-renew annually |

### Accessibility

Verified by static review and automated checks in a headless browser:

- Semantic landmarks; one `h1`; heading order H1 → H2 → H3 with no skips.
- Alt text on every meaningful image; decorative elements `aria-hidden`.
| Criterion | Result |
|---|---|
| 1.4.3 Contrast (minimum) | pass — 37 nodes sampled, lowest **5.00:1** |
| 1.4.4 Resize text | pass — no horizontal scrolling at 150% or 200% text-only zoom |
| 1.4.10 Reflow | pass — no horizontal scrolling at 320 CSS px |
| 1.4.12 Text spacing | pass — nothing clips or overflows under the required override |
| 2.4.4 Link purpose | pass — every link's accessible name identifies its owner |
| 2.4.7 Focus visible | pass — gold ring on all nine focusable elements |
| 2.4.11 Focus not obscured | pass — `scroll-padding-top` clears the sticky header; skip link sits above it |
| 2.5.8 Target size | pass — every target ≥ 44px, against a 24px minimum |

Two implementation notes on the zoom cases: grid children carry
`min-width:0` so a non-breaking token cannot size a whole track and force
horizontal scrolling; and the descriptor terms are joined with `&nbsp;`
rather than `white-space:nowrap`, which behaves identically at normal sizes
but can still be broken by `overflow-wrap` when a term cannot fit at all.
- Reveal animation disabled under `prefers-reduced-motion`; content is
  visible with JavaScript disabled entirely.

**One deliberate palette addition.** `--gold-ink` `#8A6420` is a darkened
shade of the brand gold, used only on the ivory Published Work section. The
brand gold `#BF9440` reaches 2.39:1 on ivory and cannot legally or legibly
carry text there; `#8A6420` reaches 4.59:1. On midnight the brand golds are
used unchanged. This follows the accessibility-over-brand rule where no
size- or weight-based fix exists.

**Not yet done:** screen-reader testing, real-device testing, and testing
with actual users of assistive technology.

---

## F. Deliberately excluded from V1

**Content** — blog, articles, case studies, project subpages, character or
world documentation, resources, press kit, FAQ, testimonials, team page,
careers, personal CV or career history.

**Projects** — Organization Framework and Fruit Adventures appear nowhere,
in any form. No section, card, mention, teaser or "coming soon". Verified by
text search of the built page.

**Commercial** — shop, pricing, services, client work, commission flow,
newsletter.

**Technical** — CMS, JS framework, build pipeline, contact form backend,
social embeds, search, multi-language, theme toggle, cookie banner, staging
environment, CI beyond deploy-on-push.

**Structural** — multiple pages, dropdowns, breadcrumbs, tag systems.

---

## G. Outstanding information

Only two items remain open. Neither blocks deployment.

1. **The Navisworks guide** — hidden until it ships. When it does: restore
   the commented section (three steps are written into `index.html`), and
   supply a public link for where it can be bought or read.
2. **Canonical host** — `northstardust.studio` or `www.northstardust.studio`.
   The apex form is currently written into the canonical tag, `og:url`,
   JSON-LD and `sitemap.xml`. If `www` is preferred, those four places
   change. Decide once: changing it later fragments accumulated links.

Everything else from Rev. 1 §D.6 is now confirmed and applied.

---

## H. Future development

The one-page structure was built so that growth is mechanical rather than
structural.

**1. The URL namespace is already implied.** `#studio`, `#work`, `#founder`,
`#contact` map directly to `/studio/`, `/work/`, `/founder/`, `/contact/`.
No anchor is named after its position on the page, so none needs renaming.

**2. The work entry is a schema, not a one-off.** Title · type · status ·
description · year · publisher. A second entry is a duplicated `<article>`
block. When work outgrows one page, each entry becomes an index item linking
to its own page — and the field set is already correct.

**3. The status vocabulary is closed and small.** `Published` and
`In development` are defined in the stylesheet; only the first is currently
used. Adding `Released` or `Archived` later is free. Ad-hoc labels
("Coming soon", "Alpha") would defeat the mechanism that keeps the page
honest about what exists.

**4. Design tokens are portable.** The `:root` block is the studio's visual
language in twenty lines. A future multi-page site — or a rebuild in any
framework — inherits it by copying that block.

**5. Section copy is self-contained.** No sentence refers to the page's
shape ("below", "scroll down"), so any section can become the top of its own
page without an edit.

**The migration, concretely:** `index.html` stays as the home page; each
section's content becomes the top of its new page; each home-page section
shrinks to a summary plus a link; header anchors become real links;
`styles.css` is unchanged. Nothing is rewritten and nothing is rethought.
That is the test of whether V1 was structured correctly.

**Not built in advance:** no CMS, no content abstraction for one item, no
component system, no empty pages, no unused nav entries. Future-proofing
here means choosing names, schemas and URLs carefully — not building
infrastructure against a future that may not arrive.

---

## I. Next step

1. Decide the canonical host (§G.2).
2. Create the GitHub repository in `C:\Projects\NorthStardustStudioWebsite`
   and push the site as-is. `assets-source/` can stay in the repo as the
   master asset folder or be excluded via `.gitignore` — it is not referenced
   by the site.
3. Connect Cloudflare Pages — no build command, output directory `/`.
4. Point `northstardust.studio` at it; confirm HTTPS and the redirect.
5. Test the live URL once on a real phone, and paste it into LinkedIn to
   confirm the Open Graph card renders.

Estimated time from repository to live domain: under an hour.

---

## Success criteria

V1 is finished when a visitor who has never heard of North Stardust can,
after one scroll:

1. State what the studio is, in their own words.
2. Name the work it has published.
3. Name who founded and directs it.
4. Describe its direction without believing anything has been promised.
5. Know how to make contact.

And — equally — **not believe it is larger, older or further along than it
is.**
