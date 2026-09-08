/**
 * Accessibility tests for the app chrome.
 *
 * These cover the parts of the interface a user meets on every page: if the
 * navigation is unusable by keyboard, nothing behind it is reachable either.
 */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SkipToContent from "../SkipToContent";
import RouteAnnouncer, { routeTitle } from "../RouteAnnouncer";
import {
  expectNoA11yViolations,
  renderWithRouter,
  tabbableElements,
} from "@/test/a11y";

describe("SkipToContent", () => {
  it("has no axe violations", async () => {
    const { container } = renderWithRouter(<SkipToContent />);
    await expectNoA11yViolations(container);
  });

  it("is reachable by keyboard as the first tab stop", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <div>
        <SkipToContent />
        <nav>
          <a href="/courses">Courses</a>
        </nav>
        <main id="main-content" tabIndex={-1}>
          Content
        </main>
      </div>,
    );

    await user.tab();

    const skipLink = screen.getByRole("link", { name: /skip to main content/i });
    expect(skipLink).toHaveFocus();
  });

  it("points at the main landmark", () => {
    const { container } = renderWithRouter(
      <div>
        <SkipToContent />
        <main id="main-content" tabIndex={-1}>
          Content
        </main>
      </div>,
    );

    const skipLink = screen.getByRole("link", { name: /skip to main content/i });
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // The target must exist and be focusable, or the link goes nowhere.
    const target = container.querySelector("#main-content");
    expect(target).not.toBeNull();
    expect(target).toHaveAttribute("tabindex", "-1");
  });

  it("stays in the tab order while visually hidden", () => {
    // sr-only clips the element; display:none or visibility:hidden would
    // remove it from the tab order and make the link unusable.
    const { container } = renderWithRouter(<SkipToContent />);
    expect(tabbableElements(container)).toHaveLength(1);
  });
});

describe("RouteAnnouncer", () => {
  it("renders a polite live region", () => {
    renderWithRouter(<RouteAnnouncer />);
    const announcer = screen.getByTestId("route-announcer");
    expect(announcer).toHaveAttribute("aria-live", "polite");
    expect(announcer).toHaveAttribute("aria-atomic", "true");
  });

  it("sets a document title for the current route", () => {
    renderWithRouter(<RouteAnnouncer />, { route: "/courses" });
    expect(document.title).toBe("Courses · StudyBuddy");
  });

  it("maps routes to human-readable names", () => {
    expect(routeTitle("/")).toBe("Dashboard");
    expect(routeTitle("/settings/profile")).toBe("Settings");
    expect(routeTitle("/tutors")).toBe("Tutors");
    // Unknown dynamic routes fall back to the first segment.
    expect(routeTitle("/tutor/abc-123")).toBe("Tutor");
  });

  it("prefers the longest matching prefix", () => {
    // "/tutor-dashboard" must not be swallowed by a shorter "/tutors" match.
    expect(routeTitle("/tutor-dashboard")).toBe("Tutor dashboard");
  });

  it("has no axe violations", async () => {
    const { container } = renderWithRouter(<RouteAnnouncer />);
    await expectNoA11yViolations(container);
  });
});
