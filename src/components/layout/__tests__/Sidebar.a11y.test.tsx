import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expectNoA11yViolations, renderWithRouter } from "@/test/a11y";

// The sidebar reads auth and view-mode context; stubbing them keeps these
// tests about markup rather than about session plumbing.
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: { id: "user-1", approved_tutor: false },
    loading: false,
  }),
}));

vi.mock("@/contexts/ViewModeContext", () => ({
  useViewMode: () => ({ isTutorView: false, isStudentView: true }),
}));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const { default: Sidebar } = await import("../Sidebar");

describe("Sidebar accessibility", () => {
  it("has no axe violations once loaded", async () => {
    const { container } = renderWithRouter(<Sidebar />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Courses" })).toBeInTheDocument()
    );
    await expectNoA11yViolations(container);
  });

  it("exposes a labelled navigation landmark", async () => {
    renderWithRouter(<Sidebar />);
    await waitFor(() =>
      expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument()
    );
  });

  it("marks the active route with aria-current", async () => {
    renderWithRouter(<Sidebar />, { route: "/courses" });

    const active = await screen.findByRole("link", { name: "Courses" });
    expect(active).toHaveAttribute("aria-current", "page");

    // Colour alone would leave a screen reader with no way to know where it is.
    const inactive = screen.getByRole("link", { name: "Schedule" });
    expect(inactive).not.toHaveAttribute("aria-current");
  });

  it("warns that external links open a new tab", async () => {
    renderWithRouter(<Sidebar />);

    // The accessible name includes the warning, so a screen reader user hears
    // it before activating the link rather than after the tab has switched.
    const external = await screen.findByRole("link", {
      name: "Become a Tutor (opens in a new tab)",
    });

    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("keeps every navigation item reachable by keyboard", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Sidebar />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Courses" })).toBeInTheDocument()
    );

    const links = screen.getAllByRole("link");
    for (const link of links) {
      await user.tab();
      expect(link).toHaveFocus();
    }
  });

  it("hides decorative icons from assistive technology", async () => {
    const { container } = renderWithRouter(<Sidebar />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Courses" })).toBeInTheDocument()
    );

    // Every icon is decorative here: the adjacent text already names the link.
    const icons = container.querySelectorAll("nav svg");
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });
});
