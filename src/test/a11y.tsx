/**
 * Test helpers for accessibility assertions.
 *
 * axe-core finds roughly a third of WCAG issues — the machine-checkable third.
 * It cannot tell you whether a label is *meaningful*, whether focus order makes
 * sense, or whether an interaction works with a screen reader. Treat a clean
 * axe run as the floor, not the ceiling; the keyboard tests alongside these
 * cover what axe structurally cannot.
 */

import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe, type JestAxeConfigureOptions } from "jest-axe";
import { expect } from "vitest";

export function renderWithRouter(
  ui: ReactElement,
  { route = "/", ...options }: RenderOptions & { route?: string } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
    ...options,
  });
}

/** WCAG 2.1 AA — the conformance level US higher-education procurement asks for. */
const WCAG_AA: JestAxeConfigureOptions = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
  rules: {
    // jsdom has no layout engine and no canvas, so axe cannot sample rendered
    // pixels and this rule can neither pass nor fail honestly here. Contrast is
    // checked for real in a browser by the Playwright pass (e2e/a11y.spec.ts);
    // leaving it enabled would only emit noise and a false sense of coverage.
    "color-contrast": { enabled: false },
  },
};

export async function expectNoA11yViolations(
  container: Element,
  options: JestAxeConfigureOptions = WCAG_AA,
) {
  const results = await axe(container, options);
  expect(results).toHaveNoViolations();
  return results;
}

/** Elements in tab order, in order. Used to assert focus sequence. */
export function tabbableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type=hidden])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter((element) => element.getAttribute("aria-hidden") !== "true");
}
