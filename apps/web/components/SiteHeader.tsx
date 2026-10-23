import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { SearchBar } from "./SearchBar";
import { getAllGames } from "@/lib/catalog";

export function SiteHeader() {
  const categories = getCategories();
  const games = getAllGames().map((g) => ({
    slug: g.slug,
    title: g.title,
    description: g.description,
    categories: g.categories,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl tracking-tight">
            <span className="text-accent">▶</span> Neon
            <span className="text-accent-2">Arcade</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 text-sm text-muted md:flex">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/c/${c}/`}
              className="rounded-md px-2 py-1 capitalize transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {c}
            </Link>
          ))}
        </nav>

        <div className="ml-auto w-full max-w-xs">
          <SearchBar games={games} />
        </div>
      </div>
    </header>
  );
}
