import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="text-accent">▶</span> NeonArcade — free browser games,
          no sign-up.
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/about/" className="hover:text-foreground">
            About
          </Link>
          <Link href="/privacy/" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/dmca/" className="hover:text-foreground">
            DMCA
          </Link>
          <Link href="/credits/" className="hover:text-foreground">
            Credits
          </Link>
        </nav>
      </div>
    </footer>
  );
}
