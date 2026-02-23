# Landing Page Redesign — "The Full Editorial"

## Summary
Replace the generic auth page with a scrollable marketing + auth landing page using a bold & earthy visual identity.

## Color Palette
- Hero/dark sections bg: `#1a3a2a` (deep forest green)
- Warm section bg: `#f5f0e8` (sand/tan)
- Light section bg: `#f8faf8` (existing)
- Primary accent: `#22c55e` (leaf green)
- Text on dark: `#f5f0e8`
- Text on light: `#1a1a1a`
- Muted text: `#6b7260`

## Sections
1. **Hero** — Full viewport, dark green bg, serif headline, large "30" typographic element, CTA to auth
2. **How It Works** — 3 steps on sand bg, bold numbering
3. **Category Showcase** — 8 cards grid using CATEGORY_COLORS, light bg
4. **The Science** — Key stat from American Gut Project, dark green bg
5. **Auth** — Restyled sign in/up form, sand bg
6. **Footer** — Minimal, dark green bg

## Technical
- Single file: `src/app/auth/page.tsx`
- No new dependencies
- Smooth scroll via CSS
- System serif for headlines, system-ui for body
- Mobile-first responsive
