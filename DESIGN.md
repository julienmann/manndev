---
name: Manndev
description: Hand-built studio site for small businesses. Deep navy water, one gold light, serif authority.
colors:
  bg: "#1e2530"
  surface: "#252b34"
  fg: "#f0f2f4"
  mid: "#969ba6"
  dim: "#636872"
  accent: "#f2c94c"
  rule: "#f0f2f417"
  rule-soft: "#f0f2f40f"
  rule-accent: "#f2c94c38"
typography:
  display:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(40px, 6vw, 70px)"
    fontWeight: 500
    lineHeight: 1.08
  headline:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(30px, 4vw, 52px)"
    fontWeight: 500
    lineHeight: 1.12
  service-name:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(1.6rem, 4.4vw, 3.6rem)"
    fontWeight: 600
    lineHeight: 1.3
  card-title:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  numeral:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "3.5rem"
    fontWeight: 700
    lineHeight: 1
  lead:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.8
  body:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  body-small:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.18em"
  label-large:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.05em"
rounded:
  hairline: "3px"
  small: "8px"
  option: "14px"
  panel: "20px"
  card: "28px"
  round: "50%"
  pill: "999px"
spacing:
  gutter: "clamp(1.5rem, 5vw, 4rem)"
  container: "1280px"
  section-gap: "96px"
  section-gap-mobile: "64px"
  card-padding: "2.5rem"
components:
  link-cta:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "2.5rem"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "1.75rem"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    padding: "0.3rem 0.8rem"
  tag-hover:
    backgroundColor: "#f2c94c14"
    textColor: "{colors.accent}"
  badge-filled:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
  input-text:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
  choice-option:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.option}"
    padding: "1rem 1.1rem"
  choice-option-selected:
    backgroundColor: "#f2c94c0f"
    textColor: "{colors.fg}"
---

# Design System: Manndev

## 1. Overview

**Creative North Star: "Harbour at Dusk"**

The last light over a working harbour: deep water navy going dark, one warm gold line on the horizon, and soft, well-worn forms that have clearly been made by hand. Manndev is a small studio selling custom, hand-coded websites, so the page itself has to be the proof. Nothing here is a template: every surface, underline and card lift is built for this site, and the restraint is the confidence.

The system is layered, not flat. The navy field carries a faint printed grain, and a single gold horizon line runs under the hero; cards sit a step above the water in a slate fill with a hairline edge, and rise toward you (shadow, gold edge, a few pixels of lift) when you reach for them. Gold is the only colour and it is rationed: text links, underlines, tags, the availability pulse, the one italic word in the hero. Type does the talking: Lora for anything that needs authority, Figtree for everything that needs to work.

This system rejects what PRODUCT.md names as anti-references: "generic SaaS landing pages (bright gradients, hero-metric blocks, stock illustrations)", "bloated agency sites with layers of process jargon and team photos", and "anything that reads as templated, since 'no templates' is a core claim the design must visually back up."

**Key Characteristics:**
- Deep dusk-navy field (never black) with a slate surface one step up; printed grain over everything
- One lamplight gold accent, used on no more than a hairline, a word, or a small tag at a time
- Lora serif for headlines, card titles and numerals; Figtree sans for body, labels and UI
- Generously rounded forms (28px cards, 20px panels, 14px choices)
- One button that fills: "Start a project" is an outlined gold pill whose dot floods it with gold on hover; the form submit and other primary actions stay outlined; every other action is a gold text link with a drawn underline and a nudging arrow
- Layered depth: grain and the gold horizon at rest, lift and gold edges on intent

## 2. Colors: The Harbour Palette

Warm navy water, a slate hull, sea-fog text, and a single lamplight gold.

### Primary
- **Lamplight Gold** (`accent`): The only saturated colour. Text links and their underlines, the nav's standing underline, tag and badge text, the availability dot, the italic hero word, focus outlines. Never a large fill.

### Neutral
- **Dusk Water** (`bg`): The page. A deep, warm-leaning navy; never pure black, never cool slate.
- **Harbour Slate** (`surface`): Cards, panels and dialogs, one step above the water.
- **Sea Fog** (`fg`): Headlines, card titles, primary text.
- **Weathered Grey** (`mid`): Body copy, secondary labels, counters. 5.1:1 on slate, the minimum for anything a visitor needs to read.
- **Hull Grey** (`dim`): Decorative only (inactive marks, backgrounds of backgrounds). Never for information: it fails AA.
- **Hairline** (`rule`, 9% fog): Section dividers and form underlines.
- **Soft Hairline** (`rule-soft`, 6% fog): Card edges at rest.
- **Gold Hairline** (`rule-accent`, 22% gold): Tag borders, the care card's edge, the care list divider.
- **Gold steps** (`accent-wash` 8%, `accent-edge` 20%, `accent-edge-strong` 42%): hover fills, card edges on hover, the care card and tags on hover. Use these tokens, not one-off gold alphas.

### Named Rules
**The One Lamp Rule.** Gold appears as a line, a word or a small chip, never as a panel or button fill. The exceptions: the filled "Monthly" badge, the "Start a project" pill while hovered or focused, and the skip link while focused.

**The Legible Grey Rule.** Anything a visitor must read uses `mid` or brighter. `dim` is decoration.

**The Warm Water Rule.** Background and surface stay warm navy. If a screen reads as "generic dark mode", the navy has gone too cool or too black.

## 3. Typography

**Display Font:** Lora (with Georgia, serif)
**Body Font:** Figtree (with system-ui, sans-serif)

**Character:** A bookish serif with a steady hand, paired with a friendly humanist sans. Lora carries weight and warmth; Figtree keeps everything functional and quiet. Only four Lora cuts load: 500, 600, 700 and italic 500.

### Hierarchy
- **Display** (Lora 500, `clamp(40px, 6vw, 70px)`, 1.08): The hero `<h1>` only. One word may be set in italic 500 gold.
- **Headline** (Lora 500, `clamp(30px, 4vw, 52px)`, 1.12): Section openers: About, Process, Principles, Services, Contact.
- **Service Name** (Lora 600, `clamp(1.6rem, 4.4vw, 3.6rem)`, 1.3): The service tab names.
- **Card Title** (Lora 600, 1.25–1.3rem, 1.2): Principle card titles. Process step titles run larger (`clamp(1.6rem, 2.6vw, 2.2rem)`).
- **Numeral** (Lora 700, `clamp(4rem, 10vw, 8.5rem)`, 0.85; 3.5rem on phones): The step numbers on process cards, at 46% gold (3:1).
- **Lead** (Figtree 400, 1.1rem, 1.8): The hero sub-line only.
- **Body** (Figtree 400, 1rem, 1.7): Running copy, set in Weathered Grey, 45–75ch per line.
- **Body Small** (Figtree 400, 0.9rem, 1.8): Card copy.
- **Label** (Figtree 600, 0.7rem, uppercase, 0.15–0.2em tracking): Tags, badges, form labels. No tracked-caps kicker above section headings: the headline opens the section on its own.
- **Label Large** (Figtree 500–600, 0.85rem, uppercase, 0.05–0.1em tracking): Nav, footer nav, CTA and submit text.

No other sizes. Small secondary text (sub-lines, notes, footer copy) uses Body Small at 0.9rem.

### Named Rules
**The Serif-For-Weight Rule.** Lora appears only where a line needs authority: headlines, card titles, numerals, service and project names, the onboarding questions. Never in labels or running body copy.

**The Label Floor Rule.** No text below 0.7rem (11.2px). Uppercase, wide-tracked labels read smaller than their size, so the floor is non-negotiable, including badges.

**The Plain Punctuation Rule.** No em dashes in copy. Use commas, colons, parentheses or full stops.

## 4. Elevation

Layered. Depth exists at rest, and one more step appears on intent. At rest: a fixed grain texture (SVG noise at 7%) sits over the whole page; cards are Harbour Slate with a Soft Hairline edge. On hover, cards rise: a soft shadow, a gold-tinted edge, and a few pixels of lift.

### Shadow Vocabulary
- **Principle lift** (`box-shadow: 0 16px 44px rgba(0,0,0,.3)`): Principle cards on hover, with `translateY(-6px)` and a 20% gold edge (40% on the care card); the icon brightens and rises, and the tag gains a faint gold fill.

### Named Rules
**The Lift On Intent Rule.** Nothing moves until it's reached for. Hover lifts live inside `@media (hover:hover)` so a tap on a phone never leaves a card stuck mid-air; touch devices get the resting state, with anything the hover would have revealed (such as the step numerals at 46% gold) shown by default.

**The Transform Handoff Rule.** GSAP entrance tweens must end with `clearProps: 'transform,translate,rotate,scale'`. GSAP writes inline transforms (and, since 3.12, inline `translate/scale: none`), which silently block every CSS hover transform.

**The Compositor Rule.** Animate only `transform` and `opacity`. Underlines scale on `scaleX`; covered process cards dim through a child layer's `opacity`, never a scrubbed custom property. Never animate width, left or margins.

## 5. Components

### Start a Project Pill (the main CTA)
- **Use:** Every "Start a project" action: the hero and Services on the home page, the 404 page and the blog. Markup: `.cta-pill` > `.cta-pill-rest` (dot + label) and an `aria-hidden` `.cta-pill-hover` copy, so the accessible name is read once.
- **Rest:** 1px gold outline pill, an 8px gold dot before the gold label (Label Large, uppercase).
- **Hover / keyboard focus:** The dot floods the whole pill with gold (a 640px circle scaled from the 8px dot, so it stays crisp; .6s ease-out), the label slides right and fades, and a Dusk Water copy with an arrow slides in from the right, centred (.45s). Hover lives in `@media (hover:hover)`; `:focus-visible` gets the same state.
- **Source:** After Magic UI's interactive hover button (21st.dev).

### Outlined Buttons (other primary actions)
- **Use:** The form submit ("Send enquiry") and the 404 page's "Back to home". Everything else stays a text link.
- **Shape:** Text-link styling (`.link-cta` / `.form-submit`) plus `.btn-outline`: 1px gold border, `.9rem 1.75rem` padding, fully round (pill, `border-radius: 999px`), no underline.
- **Hover:** Background tints to 8% gold (`rgba(242,201,76,.08)`); the arrow still nudges 3px right. Never a solid fill.

### Text Links
- **Shape:** No chrome. Gold uppercase label text with an arrow.
- **Hover:** A 2px gold underline draws in from the left (`scaleX` 0→1, 0.3s, `cubic-bezier(.25,1,.5,1)`); the arrow nudges 3px right.
- **Touch:** An invisible 14px hit box extends every small link to at least 44px on coarse pointers, without changing layout.
- **Disabled:** 35% opacity, no underline.

### Cards
- **Corner Style:** 28px.
- **Background:** Harbour Slate with a Soft Hairline edge; the care card adds a 135° gold wash and a Gold Hairline edge.
- **Padding:** 2.5rem.
- **Hover:** See Elevation. Principle cards rise; process cards have no hover (they move with the scroll instead).
- **Variety:** Principle cards form a bento (tall, two stacked, one full-width), never an identical grid.

### Tags & Badges
- **Outline tag:** Transparent, 1px Gold Hairline, gold label text. Gains an 8% gold fill on its card's hover.
- **Filled badge:** Solid gold, Dusk Water text. Reserved for "Monthly".

### Inputs / Fields
- **Style:** Transparent, a single underline at 42% Sea Fog (3:1 on the water, so the field can be found), no box.
- **Label:** 0.7rem. Floats from inside the field to above it on focus or once filled (`translateY`, Weathered Grey → Sea Fog). The service select's label sits raised from the start.
- **Autofill:** Name and email fields carry `given-name`, `family-name` and `email`.
- **Select:** Sea Fog text with a small gold chevron; the default option is a real answer ("Not sure yet"), never a disabled placeholder. The options mirror the service tabs plus the care plan.
- **Brief:** Grows with the text up to about 20rem, 2000 characters; a counter appears only when fewer than 200 remain (gold under 60). A draft survives a refresh in the same tab (`sessionStorage`) and is cleared on send.
- **Status:** `role="status"`; errors say the text is kept and give the email as a fallback.
- **No script:** The form has `method="post"` and the Web3Forms `action`, so it still sends (never a GET with personal data in the address).
- **Focus:** The underline turns gold. A global 2px gold `:focus-visible` outline covers everything else.

### Choice Options (Onboarding)
- **Style:** 14px-rounded rows with a Hairline edge; a hollow ring (radio) or rounded square (checkbox) marker.
- **Selected:** Gold edge, 6% gold fill, filled gold marker.
- **Keyboard:** Real radio and checkbox inputs underneath; focus draws the gold outline around the whole row. Sibling-selector fallbacks keep the checked and focus states visible in browsers without `:has()`.

### Process Film
- **Use:** The 21-second process film is closed by default. A gold text link beside the "From first call to launch day." heading opens it: "Watch the 21-second film" with a small play triangle, then "Close the film". On phones the link sits under the heading.
- **Open:** The film unfolds in place under the heading (clip from the top, a few pixels of drop, fade; .8s expo out), and the process stack below moves down. It plays while open and on screen. Nothing downloads until it's opened, the poster included (`data-poster`, set on the first open).
- **Access:** The video has an `aria-label`; the figure is never `aria-hidden`, since it can be opened.
- **Reduced motion:** Opens without the reveal, with video controls instead of autoplay.

### Process Stack (signature)
- **Use:** The five process steps are sticky cards in one column. Each sticks a little lower than the last (`top: 9vh + i × 1.4rem`; `4.5vh + i × .9rem` on phones), so the finished stack shows every card's edge.
- **Lit card:** The card being read lights up, as the old hover did: a 20% gold edge and the numeral brightening from 46% to 85% gold (.45s). Exactly one card is lit at a time, from when it rises past 65% of the screen until the next card is 70% down; none outside the section. Works on touch and under reduced motion.
- **Motion:** As a card slides up over the one before, the covered card eases back to `scale(.94)` (origin top) and dims under a Dusk Water layer to 50%, scrubbed to scroll from when the next card is 70% down the screen. The full stack holds for 12vh before it scrolls away.
- **Layout:** Large gold numeral on the left, title, body (max 56ch) and tag on the right; a single column on phones. A soft upward shadow separates each card from the one beneath.
- **Constraints:** `body`/`html` use `overflow-x: clip` (inside `@supports`), never `hidden`, or sticky stops working; the same goes for the blog and onboarding pages. Each card's `--i` step is set by script, one per card, so a sixth card just works. Scroll triggers hang off zero-height markers between cards, because a stuck card's own box moves. The dim is a child `.pc-shade` layer whose `opacity` is scrubbed. Under reduced motion the stack still stacks, with no scale or dimming. On screens shorter than 560px the cards stop sticking, so no card is ever taller than the space it sticks in.

### Service Stack (Services)
- **Use:** The whole Services section is centred. The service names stack in large Lora 600 (`clamp(1.8rem, 4.4vw, 3.6rem)`), in `mid` at rest. They work as a vertical tablist.
- **Active:** Hover, focus, tap or arrow keys make a name active. Its letters roll up one by one (14ms stagger, `translateY`) to a Sea Fog copy underneath.
- **Details:** Below the stack, the active service's summary (italic Lora) and its items (each with its own 4px gold dot) cross-fade in. The panels share one grid cell, so the section never jumps in height.
- **Why:** One focal point, no side image, detail on request. Never go back to a grid of bullet columns.

### Selected Work (signature, waiting on real projects)
- **Use:** A hairline index of real, client-approved projects: Lora name, type, year. Ships `hidden` until there are projects to show.
- **Pointer:** The row's underline draws in gold, the name nudges right, and the screenshot (16:10, 14px radius) trails the cursor via `gsap.quickTo`.
- **Touch:** No trailing preview; each row shows its own screenshot inline.

### About Outcomes
- **Use:** The About side column lists four outcomes (Lora title, one `mid` line each), never a keyword list of services.
- **Reading reveal:** The About copy starts in Weathered Grey (readable, AA) and each word lights up to Sea Fog as it passes the reading line (colour, scrubbed to scroll). Never start below AA contrast. Skipped entirely under reduced motion.

### Contact Details
- **Clock:** Montréal local time (`America/Toronto`, formatted in the page language) sits under the address, updating every 30 seconds.

### Carbon Badge (footer)
- **Style:** The third-party badge is re-dressed as two outline label chips (fog value, gold link). Hidden when the API returns no result.

### Lamplight Wordmark (signature, footer)
The page ends on the light it opened with. A full-width mann/dev wordmark (Figtree 600, SVG `textLength` so it always spans the container) sits at the foot of the page as a 13% Sea Fog outline, with the slash outlined in 50% gold.
- **Light:** A second copy on top (22% gold fill, gold stroke) shows only inside a soft circle (`mask-image` radial gradient, radius `clamp(110px, 16vw, 240px)`).
- **Motion:** When the wordmark scrolls into view the light sweeps in from the left and settles on the slash (1.6s, power3 out). On pointer devices it then goes out, and follows the cursor anywhere in the footer, fading when the cursor leaves. On touch it stays resting on the slash.
- **Reduced motion:** Outline only, no light.

### Analytics Consent
- **Use:** Google Analytics loads on no page until the visitor allows it (`/js/consent.js`, shared by every page). The question appears once, after the spotlight intro has finished: a small Harbour Slate card in the bottom-left corner, "We'd like to count visits with Google Analytics, only if you allow it." with an outlined "Allow" and a plain "No thanks" (French on French pages). The answer is remembered; nothing else ever asks again.
- **Why:** The site sells Law 25 compliance and promises "no surveillance pixels reporting your visitors to networks you never agreed to". Its own analytics have to keep that promise.

### Skip Link
- **Use:** First focusable element on every page: "Skip to content" (French: "Aller au contenu"), jumping to `#main`.
- **Style:** Solid gold pill with Dusk Water text (the one place gold fills, because it only exists while focused). Hidden above the viewport until focused.

### Navigation
- **Style:** Static header on the water. Label-role links in Sea Fog, each with a standing 2px gold underline; Portal stays unlined until hover.
- **Logo:** The mann/dev wordmark at 20px tall, cropped to its ink so it aligns with the gutter.
- **Mobile:** Process hides below 600px; the links may wrap to a second line, and the language toggle drops its divider when it does.

### Spotlight Intro (signature, loading)
Every page load opens in the dark. A warm light (an 11% gold radial wash with a soft edge to Dusk Water) sweeps in from the left and settles on the mann/dev logo in the centre. Then the logo glides into the header logo's exact position, and as it settles the light expands from the centre of the screen (it never moves off centre), and the hero text (headline, sub-line, button and horizon) is revealed through a soft circle that grows with the light (a feathered radial `mask-image` on the hero container, 70% to 160% of the light's radius, cleared when the intro ends). The mask grows from zero, not from the light's starting size, and the text fades from 0 to 1 over 0.9s as it does, so nothing appears at once. Never a hard `clip-path` edge. Only the nav fades in.
- **Length:** Text starts appearing about 1.5s in; the intro is gone by about 2.8s. Any click, key, scroll or touch-drag skips straight to the page, and so does a resize or rotation.
- **When:** Every load, including refreshes and direct visits to /fr/, while the tab is visible. Not after switching language with a header toggle (home or blog; a one-time `sessionStorage` flag set on a plain click), and not on links to a section (`/#contact` etc.), so a deep link never lands under the overlay. If the page restores scrolled past the header, the logo fades out with the light instead of gliding into the header. Never under reduced motion.
- **Failure:** If either GSAP file hasn't arrived after 3 seconds, the page is shown as is and the hero never replays. The form, tabs, film, toggle and clock don't depend on GSAP at all, and if the motion layer throws, every tween is finished and the page shown at rest.
- **Cost:** Transform and opacity only. The overlay sits under the grain, so the texture stays continuous.

### Hero Horizon (signature)
The North Star made literal: one gold line (1px, 40% opacity) running edge to edge under the hero CTA (the viewport width minus any scrollbar, so it never causes sideways scroll). It opens out from the centre during the intro (`scaleX`, expo out).
- **Pointer:** Within 90px of the line, it bends toward the cursor (up to ~17px, strongest a little off the line) and brightens toward 90% gold. Crossing the line drops a ripple sized by the cursor's speed, which travels outward and dies away in about three seconds. Movement eases back flat with exponential smoothing: no springs, no overshoot.
- **Touch:** A slow two-wave swell of under 3px that fades out over 8 seconds each time the line comes into view.
- **Cost:** One SVG path redrawn by the GSAP ticker only while the water moves; the ticker sleeps as soon as the line stops changing (flat, or settled on a resting cursor). Its geometry comes from its parent and the viewport, never from its own (scaled) box. Static under reduced motion.

## 6. Do's and Don'ts

### Do:
- **Do** keep every secondary action a gold text link with a drawn underline and arrow; "Start a project" is the pill, the form submit and 404 "Back to home" are outlined buttons (The One Lamp Rule).
- **Do** keep the water warm navy (`#1e2530`) and the hull slate (`#252b34`).
- **Do** use Lora only for headlines, card titles, numerals, service names and onboarding questions.
- **Do** keep every readable word at `mid` (5.1:1) or brighter, and every label at 0.7rem or larger.
- **Do** put hover lifts in `@media (hover:hover)` and extend small tap targets to 44px on touch.
- **Do** end GSAP entrance tweens with `clearProps` so CSS hovers can work.
- **Do** animate with `transform` and `opacity` only, and respect `prefers-reduced-motion`.
- **Do** keep the principle cards a bento, not a uniform grid.

### Don't:
- **Don't** build anything resembling "generic SaaS landing pages (bright gradients, hero-metric blocks, stock illustrations)".
- **Don't** drift toward "bloated agency sites with layers of process jargon and team photos".
- **Don't** ship "anything that reads as templated". "No templates" is a core claim the design must visually back up.
- **Don't** add other filled buttons; gold fills are for the "Monthly" badge, the hovered "Start a project" pill and the focused skip link only.
- **Don't** use `dim` (`#636872`) for information: it fails contrast.
- **Don't** use gradient text, glass cards, or coloured side stripes thicker than 1px.
- **Don't** use em dashes in copy.
- **Don't** animate `width`, `left`, `top` or margins.
- **Don't** fabricate client testimonials or social proof. Real, attributed testimonials and projects come from the studio directly.
