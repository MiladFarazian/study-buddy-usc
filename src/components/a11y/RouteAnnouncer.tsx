import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Announces client-side navigation to assistive technology.
 *
 * A full page load makes a screen reader announce the new document. A React
 * Router navigation does not: the URL and the DOM change while the screen
 * reader stays silent and focus stays wherever the user left it — usually on a
 * link that no longer exists. That silence is the single most common
 * accessibility defect in a single-page app.
 *
 * Two things fix it, and both are needed:
 *  - announce the new page's name into a live region, and
 *  - move focus to the top of the new content, so the next Tab starts there.
 */

/** Human-readable page names, longest-prefix wins. */
const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/login": "Sign in",
  "/register": "Register",
  "/courses": "Courses",
  "/tutors": "Tutors",
  "/students": "My students",
  "/schedule": "Schedule",
  "/messages": "Messages",
  "/resources": "Resources",
  "/analytics": "Analytics",
  "/badges": "Badges",
  "/settings": "Settings",
  "/faq": "Frequently asked questions",
  "/tutor-dashboard": "Tutor dashboard",
  "/make-school-easy": "Make school easy",
  "/become-a-tutor": "Become a tutor",
  "/featured-tutors": "Featured tutors",
  "/auth/callback": "Signing in",
  "/payment-success": "Payment successful",
  "/payment-canceled": "Payment canceled",
};

export function routeTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  const match = Object.keys(ROUTE_TITLES)
    .filter((route) => route !== "/" && pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];

  if (match) return ROUTE_TITLES[match];

  // Fall back to the last path segment: "/tutors/abc-123" -> "Tutors".
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return "StudyBuddy";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function RouteAnnouncer({
  mainId = "main-content",
}: {
  mainId?: string;
}) {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The initial load is announced by the browser itself; announcing it again
    // would make the page speak its own name twice.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      document.title = `${routeTitle(location.pathname)} · StudyBuddy`;
      return;
    }

    const title = routeTitle(location.pathname);
    document.title = `${title} · StudyBuddy`;

    // Focus the new content so keyboard users continue from the top of the
    // page rather than from a link that just unmounted.
    const main = document.getElementById(mainId);
    if (main) {
      main.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [location.pathname, mainId]);

  return (
    <div
      // Rendering the title as text in a live region is what actually gets
      // spoken; changing document.title alone is not announced during a
      // client-side navigation.
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="route-announcer"
    >
      {isFirstRender.current ? "" : `${routeTitle(location.pathname)} page`}
    </div>
  );
}

export default RouteAnnouncer;
