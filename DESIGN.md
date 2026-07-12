---
name: Mann Dev
description: Custom-built freelance web dev site — coastal navy editorial, modelled on lionelmann.com's visual language
colors:
  bg: "#1e2530"
  surface: "#252b34"
  fg: "#f0f2f4"
  mid: "#969ba6"
  dim: "#636872"
  accent: "#f2c94c"
  rule: "rgba(240,242,244,.09)"
  rule-accent: "rgba(242,201,76,.22)"
typography:
  display-hero:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(40px, 6vw, 70px)"
    fontWeight: 500
    lineHeight: 1.08
  display-headline:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(30px, 4vw, 52px)"
    fontWeight: 500
    lineHeight: 1.12
  display-title:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(1.8rem, 3vw, 2.8rem)"
    fontWeight: 600
    lineHeight: 1
  display-card-title:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  display-numeral:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "3.5rem"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  body-copy:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.15em"
rounded:
  none: "3px"
  small: "6px"
  medium: "10px"
  card: "28px"
  pill: "50%"
spacing:
  gutter: "clamp(1.5rem, 5vw, 4rem)"
  container: "1280px"
  section-gap: "96px"
components:
  link-cta:
    textColor: "{colors.accent}"
    underline: "expands left-to-right on hover, 2px accent"
    icon: "arrow, translates 3px right on hover"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "2.5rem"
  process-card-hover:
    transform: "scale(1.025)"
    boxShadow: "0 12px 40px rgba(0,0,0,.28)"
    borderColor: "rgba(242,201,76,.14)"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    border: "1px solid {colors.rule-accent}"
    padding: "0.3rem 0.8rem"
  input-text:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    borderBottom: "1px solid {colors.rule}"
    focusBorderBottom: "1px solid {colors.accent}"
---

# Design System: Mann Dev

## 1. Overview

**Creative North Star: "Coastal Navy Editorial"**

Deliberately modelled on lionelmann.com's visual language, carried over to Mann Dev's own content. A deep, warm navy field (never black) holds soft-cornered surface cards, set in a serif/sans pairing — Lora for anything that needs to speak with authority, Figtree for everything functional. There are no filled buttons anywhere in the system: every call to action is a text link with an animated underline and a nudging arrow. Corners are generously rounded (28px on cards, small radii on internal UI), which is the opposite instinct of the site's previous sharp-edged, zero-radius era — softness now reads as considered rather than templated.

Density is still editorial — long rule dividers, numbered process cards, generous section gaps — but the components are friendlier and less severe than the old ink-and-amber system: rounded surface cards instead of borderless grid cells, a single warm gold accent instead of amber, and abstract wireframe "site preview" panels instead of literal code blocks.

**Key Characteristics:**
- Deep navy background (`#1e2530`), never true black; lifted navy-grey surface (`#252b34`) for every card
- One warm gold accent (`#f2c94c`) — reserved for links, underlines, tags, active states, the pulsing availability dot
- Lora serif for headlines and card titles, Figtree sans for everything else
- Generously rounded corners (28px cards) — a deliberate softness, not a holdover from a sharp-edged era
- No filled buttons: every CTA is a text link with an animated underline + arrow
- Signature "service visual" panels: abstract wireframe mockups (dots, nav rails, content lines) standing in for a rendered site, not literal code

## 2. Colors

Warm navy dark mode: one background tone, one lifted surface tone, warm-white foreground, two greys for secondary text, and a single gold accent used consistently across every interactive element.

### Primary
- **Accent Gold** (`#f2c94c`): The only saturated color in the system. Used for the pulsing availability dot, all CTA text/underlines, nav link underlines, active tab indicator, card numerals on hover, tag/badge borders and text, and the sustainability/care badge fill. Never used as a large background fill.

### Neutral
- **Background** (`#1e2530`): Page background. A deep, desaturated navy — never pure black.
- **Surface** (`#252b34`): Card and panel background — one step lighter than the page background, no border needed to read as "raised" (radius + fill does the work).
- **Foreground** (`#f0f2f4`): Primary text color, headline color, selection background text.
- **Mid** (`#969ba6`): Secondary/body copy, form placeholders-turned-labels, tag/meta text.
- **Dim** (`#636872`): Tertiary text — character counters, the least important label on a screen.
- **Rule** (`rgba(240,242,244,.09)`): Hairline dividers between sections and card borders.
- **Rule Accent** (`rgba(242,201,76,.22)`): Gold-tinted hairline used for tag/badge borders and the "care" principle card's accent border.

### Named Rules
**The No-Fill Rule.** Gold never covers more than a hairline, a tag border, a badge chip, or text itself. There is no gold button fill anywhere in the system — CTAs are always text links.
**The Warm-Navy Rule.** Background and surface are both warm-tinted navy, not cool slate or pure black — the site should never read as "generic dark mode."

## 3. Typography

**Display Font:** Lora (serif, with Georgia fallback)
**Body Font:** Figtree (humanist sans, with system-ui fallback)

**Character:** A confident serif for anything that needs weight — hero line, section headlines, card titles, the oversized ghost numerals on process cards — paired with a clean, functional sans for everything else. There is no monospace or script font anywhere in the current system; the "typewriter" personality of the site's earlier era has been fully retired in favor of this warmer, more approachable pairing.

### Hierarchy
- **Display Hero** (Lora, 500 weight, `clamp(40px, 6vw, 70px)`, line-height 1.08): The `<h1>` hero line only.
- **Display Headline** (Lora, 500 weight, `clamp(30px, 4vw, 52px)`, line-height 1.12): Section-opening statements — About, Process, Principles, Contact headlines.
- **Display Title** (Lora, 600 weight, `clamp(1.8rem, 3vw, 2.8rem)`, line-height 1): Service tab-panel card titles.
- **Display Card Title** (Lora, 600 weight, `1.25–1.3rem`, line-height 1.2): Process-card and principle-card titles.
- **Display Numeral** (Lora, 700 weight, `3.5rem`, line-height 1): Ghost step numbers (01–05) on process cards, low-opacity gold at rest, brightening to full gold on card hover.
- **Body** (Figtree, 400 weight, 16px base / down to 0.9rem in copy blocks, line-height 1.7–1.9): All running copy, set in `mid` grey against the navy background.
- **Label** (Figtree, 500–700 weight, 0.65–0.85rem, letter-spacing 0.05–0.2em, uppercase): Nav links, kickers ("How It Works"), tags, badges, form field labels, status pill text.

### Named Rules
**The Serif-For-Weight Rule.** Lora appears only where a line needs authority: h1/h2 headlines and card titles. It never appears in running body copy, labels, or UI chrome — that's Figtree's job.
**The Wide Label Rule.** Anything in Label role is uppercase with meaningful letter-spacing (0.05em minimum, up to 0.2em for the smallest kickers).

## 4. Elevation

Mostly flat — cards are distinguished from the page by fill and radius alone, not shadow. The one exception is the **process-card hover state**, which deliberately breaks from the old "no card-lift" doctrine: on hover, a process card scales to 1.025, gains a soft drop shadow (`0 12px 40px rgba(0,0,0,.28)`), and its border tints toward gold. This is now an intentional, repeatable pattern — not an anti-pattern to avoid.

### Shadow Vocabulary
- **Process Card Hover Shadow** (`box-shadow: 0 12px 40px rgba(0,0,0,.28)`): Applied only on hover/focus of a `.process-card`, paired with a subtle scale and a border-color shift to `rgba(242,201,76,.14)`.

### Named Rules
**The Hover-Lift Rule.** Process cards lift on hover (scale + shadow + border tint); every other card (service cards, principle cards) stays flat at all times. Don't apply the lift outside the process grid.

## 5. Components

### CTAs (`.link-cta`, `.form-submit`, `.service-cta`)
- **Shape:** No button chrome at all — text only, in accent gold, with an SVG arrow.
- **Interaction:** A 2px accent underline expands from 0 to full width on hover; the arrow translates 3px right. No background fill ever appears.
- **Usage:** One `.link-cta` per section entry point (hero, about), plus inline `.service-cta` per service card and `.form-submit` for the contact form.

### Cards (`.card`, `.service-card`, `.process-card`, `.principle-card`)
- **Corner Style:** 28px radius (`--card-radius`), consistently, on every card in the system.
- **Background:** Flat `surface` (`#252b34`) fill — no per-cell borderless grid pattern like the old system; every card owns its own background.
- **Border:** Subtle `rgba(240,242,244,.06)` border at rest on process/principle cards; service cards omit the border and rely on fill + internal rule dividers instead.
- **Internal Padding:** `2.5rem` standard card padding; service-card sub-columns use `2rem 2.5rem`.
- **Special case — `.principle-care`:** gets a diagonal gold-tinted gradient wash (`linear-gradient(135deg, rgba(242,201,76,.07), var(--surface) 60%)`) and a gold-tinted border, marking it as the MRR/care upsell card.

### Tags & Badges (`.pc-tag`, `.principle-tag`, `.service-badge`, `.stack-tag`, `.tab-mrr-badge`, `.care-badge`)
- **Outline style** (`pc-tag`, `principle-tag`, `service-badge`): transparent fill, 1px gold-tinted border, gold uppercase label text.
- **Filled style** (`tab-mrr-badge`, `care-badge`): solid gold fill, navy (`#1e2530`) text — reserved for the "Monthly"/MRR-adjacent badges, the one place gold is used as a fill.
- **Neutral style** (`stack-tag`): 1px rule border, mid-grey text — used for tech-stack chips in the service footer.

### Inputs / Fields (`.form-input`, `.form-textarea`, `.form-select`)
- **Style:** No visible box — transparent background, single 1px rule underline only, no top/side borders. This pattern is unchanged from the site's earlier system.
- **Focus:** Underline shifts from `rule` to `accent`; the floated label shifts from `mid` to `fg`.
- **Labels:** Float from inside the field to above it on focus or once filled.

### Navigation
- **Style:** Static (non-fixed) header, transparent, sitting on the page background.
- **Typography:** Label-role links in `fg`, each with a permanent 2px gold underline (not a hover-only state) except the portal link, which stays borderless until hover.
- **Mobile:** Nav links hide below 900px (`.nav-hide-mobile`); logo and mobile-visible items remain.

### Service Visual (signature component)
The service tab panels each include a `.service-visual` — a small bordered panel with a traffic-light dot row and an abstract wireframe mockup beneath (nav rail + content lines for "Full Website," a single hero line + CTA block for "Landing Page," a node-and-flow diagram for "AI Automation"). This replaced the old literal code-block-to-preview device: it now implies "this is what gets built" through abstraction rather than a fake code snippet. Any new panel claiming "here's what you get" should reuse this wireframe idiom, not reintroduce a code block.

### Tabs (`.tabs-bar`, `.tab-btn`, `.tab-indicator`)
- Underline-indicator tab bar (GSAP-animated `left`/`width` on the shared `.tab-indicator` element), four tabs: Landing Page, Full Website, Care & Hosting (carries the `.tab-mrr-badge` "Monthly" chip), AI Automation.

## 6. Do's and Don'ts

### Do:
- **Do** keep every CTA a text link with an underline + arrow — never introduce a filled button (The No-Fill Rule).
- **Do** keep background and surface warm navy tones, never cool slate or pure black (The Warm-Navy Rule).
- **Do** use Lora only for headlines/card titles and Figtree for everything else (The Serif-For-Weight Rule).
- **Do** round every card to 28px — consistent softness is the current identity, not a holdover to fight.
- **Do** reserve the hover-lift (scale + shadow) for process cards only (The Hover-Lift Rule).
- **Do** use the wireframe "service visual" idiom (dots + abstract lines) rather than literal code blocks when showing "what gets built."

### Don't:
- **Don't** reintroduce sharp/zero-radius corners — that was the previous era's signature, not this one's.
- **Don't** add a solid-fill button anywhere except the two explicitly-filled badge chips (`tab-mrr-badge`, `care-badge`).
- **Don't** use monospace or script fonts (Bebas Neue, IBM Plex Mono, Playfair Display are retired from this system).
- **Don't** apply the process-card hover lift to service cards or principle cards.
- **Don't** fabricate client testimonials or social proof — real, attributed testimonials must come from Julien directly, not be invented.
- **Don't** use bright SaaS gradients, hero-metric blocks, or stock illustration — the anti-references from PRODUCT.md still hold even though the palette softened.
