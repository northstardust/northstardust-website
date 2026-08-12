# North Stardust — Website

A static, multi-page site. No framework, no build step, no dependencies.
Edit the files, commit, push — that's the whole workflow.

Built against the original specification documents and the previous
single-page V1 build's own spec, kept for history in `Trash Bin/` (not part
of the active project).

---

## Pages

```
index.html        Home       — hero + The Studio / The Compass / The Horizon
contact.html       Contact    — Founder section + contact form
publishing.html    Publishing — "Coming soon…"
```

Header and footer markup is duplicated at the top/bottom of each page (no
templating layer exists in a build-free static site — this is the standard
trade-off). If you change the header or footer, change it in all three
files.

## Files

```
index.html · contact.html · publishing.html
styles.css        design tokens + every rule, in one file
main.js           reveal-on-scroll, page transitions, content sync,
                   stardust cursor trail, contact form validation/submit
functions/_middleware.js   Cloudflare Pages Function — blocks public access
                   to non-website paths (Trash Bin/, README.md, etc.)
functions/api/contact.js   Cloudflare Pages Function — POST /api/contact
robots.txt · sitemap.xml · favicon.ico
assets/
  fonts/          Cormorant 400, Spectral 400, Inter 400/500/600 (woff2)
  img/            logo-double-line.svg, logo-single-line.svg, logo.png,
                   founder-rounded.png, Stars.avif, favicons, og-image.jpg
  Website Texts.md   editable long-form copy (see "Content" below)
```

Brand/source master files and anything not needed by the live site live in
`Trash Bin/` — kept on disk, git-ignored, and blocked from public serving by
`functions/_middleware.js`.

## Running it locally

Because `main.js` fetches `assets/Website Texts.md` at runtime (see
"Content" below) and the contact form posts to `/api/contact`, opening
`index.html` straight from disk (`file://`) will render and work, but the
copy-sync and the form submission both silently no-op — that's expected,
not a bug. For a working local check of everything:

```bash
npx serve .            # or: python3 -m http.server 8000
```

## Deploying — Cloudflare Pages

The domain `northstardust.studio` is already active in Cloudflare with SSL.
There is no `wrangler.toml` or Workers-specific config in this repo, and the
project has always targeted Cloudflare **Pages** (build command: none,
output directory: `/`) — so `functions/api/contact.js` is a **Pages
Function**: Cloudflare maps `functions/api/contact.js` to `POST
/api/contact` automatically on deploy, no router or extra config needed.

**Required environment variables** (Cloudflare Pages dashboard → Settings →
Environment variables — never commit these, never reference them from
client-side code):

| Variable | Example | Notes |
|---|---|---|
| `RESEND_API_KEY` | *(secret)* | API key from [resend.com](https://resend.com) |
| `CONTACT_FROM_EMAIL` | `contact@northstardust.studio` | must be a Resend-verified sending domain |
| `CONTACT_TO_EMAIL` | `northstardust.studio@gmail.com` | where messages land |

Until those three are set, `/api/contact` responds `503` with a message
pointing visitors to the studio's email directly — the form's own error
state surfaces that honestly rather than pretending to succeed.

If this project is ever moved from Pages to a standalone Worker, the logic
in `functions/api/contact.js` moves into a `fetch()` handler essentially
unchanged — only the export shape (`onRequestPost` → `fetch`) differs.

## Content

Long-form copy — The Studio / The Compass / The Horizon on Home, and the
Founder bio and "Let's Connect" text on Contact — lives in
`assets/Website Texts.md`, not duplicated in the HTML by hand.

Each HTML page ships with that same copy already inlined (so the page has
real content on first paint, works with JavaScript disabled, and is fully
crawlable — none of that depends on a fetch succeeding). When the page is
served over http(s) and `main.js` runs, it re-fetches
`assets/Website Texts.md`, parses it by its `## Heading` structure, and
replaces the matching containers' `<p>` text if the fetch succeeds. Edit the
`.md` file and the live site picks it up on next load — no HTML edit
required. If the fetch fails (opened from disk, offline, blocked), the
inlined copy simply stays as-is.

**Keep the HTML and the `.md` file in sync by hand for now.** There's no
build step to enforce it; if you change the copy, update both.

## Design tokens

Colours, type scale and spacing are custom properties at the top of
`styles.css` (`:root`). Nothing else hard-codes a brand value.

```
Gold Dark    #BF9440       Midnight   #0F172A
Gold Light   #F2D68A       Light Peach #F0E5DC
                            Ivory      #F1EDE7
```

Type scale (desktop, ≥1200px — the Prompt/Website.txt targets):
`--fs-h1` 64px · `--fs-h2` 48px · `--fs-h3` 24px · `--fs-body` 20px ·
`--fs-link` 16px · `--fs-small` 14px. Every rule references one of these
tokens; nothing introduces a new size.

**Glass card** (Figma-confirmed): Gold Light fill at 5% opacity, 20px
backdrop blur, 30px radius, 20px padding, **no stroke**. One shared `.glass`
class.

## Known approximations — please confirm

A few spec values had no exact match available in the project and were
approximated rather than invented. All are isolated to a single place, so
fixing them later is a small edit:

1. ~~**The "light blue" filled-field colour**~~ — resolved. `--field-filled`
   in `styles.css` is now the confirmed value `#397EE6`.
2. **Font weights.** The spec calls for Cormorant Garamond *Medium*,
   Spectral *Medium*/*SemiBold*, but only Cormorant 300/400 and Spectral
   300/400 woff2 files exist in `assets/fonts/`. Weight 400 (the heaviest
   available for each) is used throughout as the closest match; weight 300
   is no longer used anywhere and its `@font-face` rules were removed. If
   true Medium/SemiBold cuts of Cormorant Garamond and Spectral are added to
   `assets/fonts/`, update the `@font-face` blocks and the `font-weight`
   values in `styles.css` (search `font-weight:400` under the type-scale
   comment).
3. **Reference screenshots** (`Header.png`, `Footer.png`, `Founder.png`,
   `Contact.png`, `Desktop Home Page.png`, etc.) named throughout the original
   Prompt document were not physically present in the project or supplied as
   attachments — layout was built from the explicit pixel/typography values
   in the spec instead, which fully specify every dimension used.
4. ~~**Founder role letter-spacing**~~ — resolved. `main.js` measures the
   founder name's rendered width at runtime and solves for the exact
   letter-spacing needed on the role line below it, rather than using a
   fixed `0.18em` value.
5. **Error-state red** (`--field-error` in `styles.css`) isn't in the brand
   palette — spec never names one for form validation errors. Used a
   standard accessible red; low-risk since error colour is a UX convention,
   not a brand decision.

## Accessibility

- Semantic landmarks, one `h1` per page, logical heading order.
- All form fields have a real (visually-hidden) `<label>` even though the
  visual design is placeholder-only — a placeholder is not an accessible
  name.
- Errors are wired with `aria-invalid` and `aria-describedby` pointing at a
  `role="alert"` message, not colour alone.
- Every animation (starfield drift/twinkle, cursor stardust trail, reveal-
  on-scroll, page slide transitions, hover scale) is disabled under
  `prefers-reduced-motion`. The cursor trail additionally only runs on
  fine-pointer (mouse) devices — it never attaches on touch.
- Page transitions are progressive enhancement: with JavaScript off, links
  are plain anchors and navigate instantly and correctly.
- Tested with Playwright at 1440/1024/768/375px: no console errors, no
  failed asset requests, no horizontal overflow at any width.

## Maintenance

| Task | When |
|---|---|
| Update copy | Edit `assets/Website Texts.md` **and** the matching HTML paragraphs |
| Confirm domain auto-renew | Annually |
| Check outbound links resolve | Annually |
| Rotate `RESEND_API_KEY` | Per Resend's own guidance |
