---
name: Mann Dev
description: Custom-built freelance web dev site — editorial dark mode with a scarce amber accent
colors:
  ink-black: "#0d0b09"
  ink-panel: "#131110"
  ink-deep: "#0a0907"
  ink-code: "#060504"
  paper-cream: "#ede8d5"
  warm-grey: "#9a9080"
  rule: "rgba(237,232,213,0.1)"
  rule-accent: "rgba(196,146,42,0.3)"
  amber: "#c4922a"
  amber-dim: "rgba(196,146,42,0.18)"
  signal-green: "#4ade80"
typography:
  display:
    fontFamily: "'Bebas Neue', sans-serif"
    fontSize: "clamp(7rem, 20vw, 20rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Bebas Neue', sans-serif"
    fontSize: "clamp(3rem, 6vw, 7rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "normal"
  title:
    fontFamily: "'Bebas Neue', sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "'IBM Plex Mono', monospace"
    fontSize: "14px"
    fontWeight: 300
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "'IBM Plex Mono', monospace"
    fontSize: "0.68rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.2em"
  accent-script:
    fontFamily: "'Playfair Display', serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  none: "0px"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2.5rem"
  xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "0.8rem 2.5rem"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.amber}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.warm-grey}"
    rounded: "{rounded.none}"
    padding: "0.45rem 1.2rem"
  button-ghost-hover:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink-black}"
  input-text:
    backgroundColor: "transparent"
    textColor: "{colors.paper-cream}"
    rounded: "{rounded.none}"
    typography: "{typography.body}"
---

# Design System: Mann Dev

## 1. Overview

**Creative North Star: "The Editor's Desk"**

A desk-lamp glow on dark wood at night: a single craftsman's workspace, not an open-plan agency floor. The system is near-black and warm, lit by one scarce amber accent, set in a typewriter mono body with Bebas Neue doing the shouting and Playfair Display doing the one quiet, italic aside. Everything is flat, ruled, and grid-aligned — the visual equivalent of clean, unbloated code. It explicitly rejects bright SaaS gradients, hero-metric blocks, stock illustration, and anything that signals "built from a template," because the entire site's argument is that it wasn't.

Density is editorial: long rule lines, generous negative space between sections, content organized like a printed brief (numbered sections, "01/04" pagination) rather than stacked cards. Motion is purposeful and restrained — masked text reveals, a sliding tab indicator, a magnetic CTA — never decorative bounce.

**Key Characteristics:**
- Near-black warm ink background, never true `#000`
- One scarce amber accent — restraint is the point, not warmth-everywhere
- Bebas Neue for scale and shout, IBM Plex Mono for everything functional, Playfair Display italic for the one editorial aside per section
- Flat surfaces, hairline rules, zero border-radius
- Soft amber glow (not drop shadow) signals the one important panel per view

## 2. Colors

The palette is two near-black ink tones, one warm cream foreground, one muted warm-grey for secondary text, and a single amber accent used scarcely against all of it.

### Primary
- **Amber** (#c4922a): The only saturated color in the system. Reserved for underlines, active states, the submit button, hover transitions, and the rare glow around a featured panel (hero window, sticky process visual). It should never dominate a view — its scarcity is what reads as premium, not its warmth.

### Neutral
- **Ink Black** (#0d0b09): Primary background. A warm near-black, never pure `#000`.
- **Ink Panel** (#131110): Slightly lifted background for strips like the marquee — distinguishes a band of content without using a shadow.
- **Ink Deep** (#0a0907): Background for bordered "window" panels (browser mockup, process visual) — one step darker than the page to read as inset.
- **Ink Code** (#060504): Darkest tone, used only inside the code-snippet stage of the process visual.
- **Paper Cream** (#ede8d5): Primary text color and selection background. A warm off-white, never pure `#fff`.
- **Warm Grey** (#9a9080): Secondary/body copy, nav links at rest, meta labels — anything that should recede behind the cream headline color.
- **Rule** (rgba(237,232,213,.1)): Hairline dividers between sections, cards, and form fields.
- **Rule Accent** (rgba(196,146,42,.3)): A warmer, amber-tinted hairline used specifically under section labels and around the two "window" panels — a quieter cousin of the Primary accent.
- **Signal Green** (#4ade80): Reserved exclusively for live/availability indicators (the pulsing "available" dot, deploy-success log lines). Never decorative.

### Named Rules
**The Scarcity Rule.** Amber appears on rules, underlines, hover states, and exactly one CTA per section — never as a fill color across more than a thin strip of any view. If amber is covering more than a hairline or a button, it's being overused.

**The Warm-Neutral Rule.** No neutral in this system is pure black or pure white. Every ink and paper tone carries the same warm, slightly brown-gold undertone as the amber accent.

## 3. Typography

**Display Font:** Bebas Neue (with sans-serif fallback)
**Body Font:** IBM Plex Mono (with monospace fallback)
**Label/Mono Font:** IBM Plex Mono
**Accent Font:** Playfair Display, italic (with serif fallback)

**Character:** A loud condensed display face paired with a quiet, functional monospace body and one italic serif aside — the contrast between "shouted headline" and "typed code" is the whole personality. Playfair appears sparingly, like a hand-written margin note on a typed page.

### Hierarchy
- **Display** (400 weight, `clamp(7rem, 20vw, 20rem)`, line-height 0.82, letter-spacing -0.02em): The hero wordmark only. One use per page.
- **Headline** (400 weight, `clamp(3rem, 6vw, 7rem)`, line-height 0.9): Section-opening statements (About headline, Contact headline).
- **Title** (400 weight, `clamp(2rem, 4vw, 3.5rem)`, line-height 1, letter-spacing 0.02em): Tab titles, process-step titles, section labels at smaller scale.
- **Body** (300 weight, 14px, line-height 1.7): All running copy. Cap measure at 65–75ch where copy runs long (about/services descriptions already respect this via column width).
- **Label** (400 weight, 0.68rem, letter-spacing 0.2em, uppercase): Nav links, kickers, stat labels, form field labels — always uppercase, always wide-tracked.
- **Accent Script** (400 weight, 1rem, italic, letter-spacing 0.12em, lowercase): The single Playfair Display moment per view — the "development" hero subtitle, the about signature, the manifesto quote.

### Named Rules
**The One Serif Rule.** Playfair Display italic appears once per major section, never as body copy and never in more than one weight. It is the margin note, not the chapter.

**The Wide Label Rule.** Anything in Label role is uppercase with ≥0.18em letter-spacing. Tight-tracked uppercase mono reads as cheap; the wide tracking is what makes it read as deliberate.

## 4. Elevation

Flat by default — there is no Material-style shadow scale and no card-lift-on-hover pattern. Depth is conveyed two ways: one step of ink darkness (Ink Black → Ink Deep → Ink Code) for panels that sit "inside" the page, and a soft amber ambient glow reserved for the single most important panel in a given view (the hero browser-window mockup, the sticky process-visual canvas). The glow is a signal of focus, not a structural shadow — it never appears on more than one element on screen at a time.

### Shadow Vocabulary
- **Ambient Focus Glow** (`box-shadow: 0 0 60px rgba(196,146,42,0.08), 0 0 0 1px rgba(196,146,42,0.06) inset`): Applied to exactly one "windowed" panel per view to mark it as the thing worth looking at. Pairs with a 1px amber-tinted border.

### Named Rules
**The One Glow Rule.** Only one element on screen may carry the ambient amber glow at a time. It is a spotlight, not ambient lighting.

## 5. Components

### Buttons
- **Shape:** Square corners throughout (0px radius) — no exceptions.
- **Primary** (`.form-submit`): Solid amber fill, ink-black text, `0.8rem 2.5rem` padding, uppercase 0.2em-tracked label.
- **Hover / Focus:** Primary inverts to transparent fill with amber text and an amber border — never a darkening overlay.
- **Ghost** (`.nav-cta`, `.tab-cta`): Transparent fill, 1px border (amber-tinted or cream depending on context), warm-grey or cream label text.
- **Ghost Hover:** Fills solid amber with ink-black text — the only moment a ghost button gains a hard fill.
- **Magnetic behavior:** Primary and ghost CTAs both track the cursor within their bounds (subtle translate, eased back on leave) — reserved for true calls-to-action, not every clickable element.

### Cards / Containers
- **Corner Style:** 0px radius, always.
- **Background:** Stat boxes and audit-score panels sit directly on the page background with only a 1px Rule border separating cells in a grid — never a raised card with its own background color.
- **Shadow Strategy:** None. See Elevation — flat at rest; a thin amber overlay (4% opacity) washes in on hover instead of a lift.
- **Border:** 1px Rule between grid cells; outer container gets a 1px Rule border.
- **Internal Padding:** `2.5rem 2rem` for stat/audit cells, `2rem 3rem` for content panels.

### Inputs / Fields
- **Style:** No visible box — transparent background, single 1px Rule underline only (`border-bottom`), no top/side borders.
- **Focus:** Underline shifts from Rule to Amber; the field label (floated above on focus/fill) shifts from warm-grey to cream.
- **Labels:** Float from inside the field (placeholder position) to above it on focus or once filled — never a static label sitting outside the field.

### Navigation
- **Style:** Fixed top bar, transparent at rest, blurred ink-black at 85% opacity once scrolled. Hides on scroll-down, reappears on scroll-up.
- **Typography:** Label-role links, warm-grey at rest, cream on hover. Logo in Bebas Neue.
- **Mobile:** Link list collapses entirely below 900px; only logo and CTA remain.

### Browser-Window Panel (signature component)
The hero and process sections both use a bordered "browser window" chrome (three traffic-light dots, a fake URL bar, a code body) to literalize "this is what gets built" before showing a miniature rendered preview beneath it. This is the system's signature device — code above, its rendered output below, joined by a `→ renders to` divider in Label type. Any new panel that wants to claim "we build it live" should reuse this pattern rather than inventing a generic card.

## 6. Do's and Don'ts

### Do:
- **Do** keep amber to hairlines, underlines, one CTA, and one glow per view (The Scarcity Rule).
- **Do** tint every neutral warm — Ink Black (#0d0b09) and Paper Cream (#ede8d5), never `#000`/`#fff`.
- **Do** use Bebas Neue only for scale/shout and IBM Plex Mono for everything functional; reserve Playfair italic for one aside per section.
- **Do** keep every corner square (0px radius) — sharp edges are part of the "no templates" argument.
- **Do** show the build, don't just claim it — when documenting process or capability, prefer the code-block → rendered-preview pattern over a bullet list of claims.
- **Do** use wide-tracked (≥0.18em) uppercase mono for all labels, kickers, and nav links.

### Don't:
- **Don't** use bright SaaS gradients, hero-metric blocks, or stock illustration — explicitly named anti-references in PRODUCT.md.
- **Don't** add team photos or agency-style process diagrams; this is a solo-craftsman site, not an agency.
- **Don't** let amber cover more than a thin strip, a button, or a single glow — if it's filling a section background, it's wrong.
- **Don't** add drop shadows or card-lift hovers. Depth comes from ink-tone stepping and the single ambient glow, never a Material shadow.
- **Don't** round any corner. A radius anywhere reads as templated.
- **Don't** stack more than one Playfair Display moment in the same viewport — it's a margin note, not a paragraph font.
- **Don't** apply the amber glow to more than one panel on screen at once (The One Glow Rule).
