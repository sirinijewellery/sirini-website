// Root template — remounts on each top-level navigation, so the page content
// gently fades up on every route change (and first load). Wraps the page only,
// not the layout, so the navbar/footer stay put while the content transitions.
// Animation + reduced-motion handling live in globals.css (.page-enter).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
