/**
 * Skip link (WCAG 2.4.1, Bypass Blocks).
 *
 * StudyBuddy renders a header and a 13-item sidebar before the page content.
 * Without this, a keyboard or switch user tabs through all of it on every
 * navigation before reaching what they came for.
 *
 * It is visually hidden until focused rather than removed: `display: none` and
 * `visibility: hidden` take an element out of the tab order entirely, which
 * would make the link unreachable by the very users it exists for.
 */
export function SkipToContent({
  targetId = "main-content",
}: {
  targetId?: string;
}) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-usc-cardinal focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-usc-gold focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}

export default SkipToContent;
