/**
 * WCAG 2.1 AA scan of the routes a signed-out visitor can reach.
 *
 * Authenticated routes are not covered here — they need a seeded session, and a
 * scan that logs in against live Supabase would be flaky in CI. The component
 * tests under `src/**\/__tests__` carry that weight instead.
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PUBLIC_ROUTES = [
  { path: "/", name: "home" },
  { path: "/login", name: "login" },
  { path: "/courses", name: "courses" },
  { path: "/tutors", name: "tutors" },
  { path: "/faq", name: "FAQ" },
  { path: "/make-school-easy", name: "make school easy" },
  { path: "/become-a-tutor", name: "become a tutor" },
];

const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Waits for the SPA to paint, so axe doesn't scan an empty root div. */
async function gotoAndSettle(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#root *", { timeout: 15_000 });
  await page.waitForLoadState("networkidle").catch(() => {
    // Supabase keeps connections open; a settled DOM is enough to scan.
  });
}

test.describe("public routes meet WCAG 2.1 AA", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} has no detectable violations`, async ({ page }) => {
      await gotoAndSettle(page, route.path);

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_AA_TAGS)
        // WCAG 1.4.3 exempts "text that is part of a logo or brand name" from
        // the contrast minimum. The StudyBuddy wordmark renders USC gold
        // (#FFCC00) on white at 1.5:1 and is covered by that exemption; axe
        // cannot recognise a logotype, so the exclusion is declared here and
        // scoped to the wordmark alone. Every other element is still checked.
        .exclude("[data-brand-wordmark]")
        .analyze();

      // Print the offending selectors: "3 violations" is not actionable in a
      // CI log, but a node target and a help URL are.
      if (results.violations.length > 0) {
        console.error(
          `\n${route.path} violations:\n` +
            results.violations
              .map((violation) =>
                `  [${violation.impact}] ${violation.id}: ${violation.help}\n` +
                violation.nodes
                  .map((node) => `    ${node.target.join(" ")}`)
                  .join("\n") +
                `\n    ${violation.helpUrl}`
              )
              .join("\n\n"),
        );
      }

      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("keyboard navigation", () => {
  test("the skip link is the first tab stop and moves focus to main", async ({
    page,
  }) => {
    await gotoAndSettle(page, "/");

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();

    // It must also be visible once focused — an invisible focused control
    // leaves a sighted keyboard user with no idea where they are.
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("every focusable control shows a visible focus indicator", async ({
    page,
  }) => {
    await gotoAndSettle(page, "/login");

    // WCAG 2.4.7: tabbing must never land somewhere invisible.
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");

      const hasIndicator = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) return true;

        const style = getComputedStyle(active);
        const outlineVisible = style.outlineStyle !== "none" &&
          parseFloat(style.outlineWidth) > 0;
        const ringVisible = style.boxShadow !== "none";
        return outlineVisible || ringVisible;
      });

      expect(hasIndicator).toBe(true);
    }
  });

  test("content is reachable without a mouse at 320px", async ({ page }) => {
    // WCAG 1.4.10: no horizontal scrolling at the narrowest supported width.
    await page.setViewportSize({ width: 320, height: 640 });
    await gotoAndSettle(page, "/");

    const overflows = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflows).toBe(false);
  });
});

test("the page declares a language", async ({ page }) => {
  // WCAG 3.1.1 — without it a screen reader reads English with the user's
  // default voice, which can be unintelligible.
  await gotoAndSettle(page, "/");
  await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
});
