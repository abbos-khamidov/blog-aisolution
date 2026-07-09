# Blog AISOLUTION Redesign Brief

## Role

Act as a senior product designer plus frontend engineer.

## Goal

Update `blog.aisolution.uz` design by finding the best AI/tech-blog references and applying the most relevant UX/UI patterns to the current Next.js project.

The result should feel:

- cleaner
- more readable
- more premium
- better structured
- mobile-friendly

## Required Workflow

1. Plan
2. Implementation
3. Validation summary

Do not only propose ideas. Implement the improvements in code.

## Research And Reference Selection

1. Find and evaluate all relevant reference styles/components in the codebase or provided design sources.
2. Select only the 5-7 strongest and most applicable references for an AI/tech blog.
3. For each selected reference, explain why it applies and what pattern should be adopted.
4. Remove or avoid weak, overloaded, or irrelevant patterns.

## Areas To Improve

- Homepage
- Blog listing
- Article page
- Navigation
- CTA blocks
- Tags and categories
- Light and dark theme system
- Brand logo, motto, and image assets

## UX/UI Quality Bar

After changes, verify:

- UI is consistent
- Typography is readable
- Spacing is balanced
- Mobile layout works
- Light and dark themes both feel intentional, not just inverted
- Theme toggle is easy to find and does not add visual noise
- Brand assets render crisply on both themes
- No broken components

## Theme Requirements

- Implement both light and dark themes.
- Use semantic design tokens for background, surface, text, muted text, border, accent, and elevated states.
- Add a clean theme toggle in navigation.
- Respect user/system preference where practical, while allowing manual override.
- Avoid pure black and pure white dominance; keep the visual premium, readable, and calm.
- Check contrast on article body text, cards, navigation, tags, and CTA blocks.

## Brand Assets

Use the provided brand assets as design inputs:

- Source logo light: `logoLight.png`
- Source logo dark: `logoDark.png`
- Source motto light: `mottoLight.png`
- Source motto dark: `mottoDark.png`

Prepared transparent PNG assets:

- `public/brand/logo-light-transparent.png`
- `public/brand/logo-dark-transparent.png`
- `public/brand/motto-light-transparent.png`
- `public/brand/motto-dark-transparent.png`

The source files were RGB PNGs without alpha. Transparent versions were generated for theme-safe usage. During redesign, inspect them in context and only use the versions that remain sharp and readable at real UI sizes.

## Product Direction

The blog is an expert media surface for AISOLUTION, not just a news feed. The design should support opinionated AI/tech analysis, market commentary, competitor observations, and founder/company perspective while keeping the experience fast, clear, and credible.

## Notes For Later

Start this work after the technical deployment/setup phase is complete.
