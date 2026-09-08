# Accessibility

StudyBuddy targets **WCAG 2.1 AA** — the level US higher-education procurement
and Section 508 ask for, which matters for a USC-facing product.

## Running the checks

```bash
npm run test:a11y      # axe-core + keyboard tests in jsdom (fast)
npm run test:e2e:a11y  # axe-core in a real browser across public routes
npm run lint           # includes jsx-a11y static rules
```

All three run in CI (`.github/workflows/ci.yml`).

## The three layers, and why none of them is enough alone

**1. `eslint-plugin-jsx-a11y` — static.** Catches a missing `alt`, an invalid
ARIA role, a positive `tabindex`. Runs in milliseconds, no rendering. Blind to
anything that depends on runtime state.

**2. `axe-core` in jsdom — component level.** Scans rendered output for ARIA and
structural violations. Colour contrast is **disabled** here: jsdom has no layout
engine and no canvas, so axe cannot sample rendered pixels and the rule can
neither pass nor fail honestly. Leaving it on would emit noise and imply
coverage that does not exist.

**3. `@axe-core/playwright` in Chromium — page level.** Real layout, so this is
where contrast, focus visibility, and 320px reflow are actually judged.

None of this substitutes for manual testing. **axe-core detects roughly a third
of WCAG issues** — the machine-checkable third. It cannot tell you whether a
label is *meaningful*, whether focus order matches visual order, or whether a
flow is usable with VoiceOver. A green build is the floor, not a claim of
conformance.

### What is not covered

- **Authenticated routes.** The browser scan covers signed-out routes only;
  scanning behind login needs a seeded session and would be flaky against live
  Supabase. Component tests carry that weight instead.
- **Screen-reader behaviour.** No automated tool tests VoiceOver or NVDA.
- **Cognitive accessibility.** Reading level, error recovery, timeouts.

## Fixes applied

| Issue | WCAG | Fix |
|---|---|---|
| No way to bypass header + 13-item sidebar | 2.4.1 | `SkipToContent`, first tab stop, targets `#main-content` |
| SPA navigation silent to screen readers; focus stranded | 4.1.3, 2.4.3 | `RouteAnnouncer` — live region + focus moves to `<main>` |
| Pinch zoom disabled (`maximum-scale=1, user-scalable=no`) | 1.4.4 | Removed from the viewport meta |
| Active nav item signalled by colour only | 1.4.1 | `aria-current="page"` |
| Icon-only Messages link had no name | 4.1.2 | `aria-label`, icon `aria-hidden` |
| Two unlabelled `<nav>` landmarks | 1.3.1 | `aria-label="Main"` / `"Primary"` |
| Select comboboxes unnamed until data loaded | 4.1.2 | `aria-label`, course number included so each name is unique |
| `text-muted-foreground` at 4.34:1 | 1.4.3 | Lightness 46.9% → 44.9% (4.66:1 worst case) |
| "Admin Login" at 2.54:1 | 1.4.3 | gray-400 → gray-600 (7.56:1) |
| External links switched tab silently | 3.2.5 | "(opens in a new tab)" in the accessible name |
| Decorative icons announced | 1.1.1 | `aria-hidden="true"` |
| Loading skeletons announced as content | 4.1.3 | `aria-busy` + a single "Loading…" message |

### The one exclusion

The StudyBuddy wordmark renders USC gold (`#FFCC00`) on white at **1.5:1**.
WCAG 1.4.3 exempts "text that is part of a logo or brand name" from the contrast
minimum, so this is conformant — but axe cannot recognise a logotype. The
exemption is declared narrowly: elements carry `data-brand-wordmark`, and
`e2e/a11y.spec.ts` excludes that selector alone. Everything else on the page is
still checked.

Worth noting separately: the exemption makes it *conformant*, not *readable*.
Gold-on-white is genuinely hard to read, and using a darker gold for text while
keeping `#FFCC00` for fills would be an improvement. That is a brand decision,
not a compliance one.

## Lint policy

The repository carries ~141 pre-existing lint errors, mostly
`@typescript-eslint/no-explicit-any`. A bare `eslint .` in CI would fail every
run and train everyone to ignore the job.

So the CI lint job **fails only on `jsx-a11y` rules**, which are clean today.
Accessibility cannot regress; the wider backlog is visible as annotations
without blocking. Widen the gate as that debt is paid down.

`jsx-a11y` content rules are off for `src/components/ui/**`: shadcn primitives
are `forwardRef` wrappers whose children arrive via `{...props}`, so the rules
fire on every one of them. The real check belongs at the call site, which the
app-level rules still cover.

## Writing accessible components here

- Every interactive element needs an accessible name that does not depend on
  async data. If the name comes from a value that loads later, add `aria-label`.
- Decorative icons: `aria-hidden="true"`. Meaningful icons: give them a label.
- State conveyed by colour needs a non-visual equivalent (`aria-current`,
  `aria-selected`, `aria-invalid`, text).
- Never remove a focus outline without replacing it. `e2e/a11y.spec.ts` tabs
  through 15 controls and asserts each shows an outline or a ring.
- Radix primitives are accessible by default — focus trapping, escape handling,
  ARIA wiring. Prefer them over hand-rolled dialogs and menus.
- New page? Add its path to `PUBLIC_ROUTES` in `e2e/a11y.spec.ts` if it is
  reachable signed-out, and to `ROUTE_TITLES` in `RouteAnnouncer.tsx`.
