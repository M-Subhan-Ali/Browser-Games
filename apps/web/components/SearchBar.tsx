"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";

type SearchGame = {
  slug: string;
  title: string;
  description: string;
  categories: string[];
};

export function SearchBar({ games }: { games: SearchGame[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(games, {
        keys: ["title", "categories", "description"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [games],
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return fuse
      .search(q)
      .slice(0, 8)
      .map((r) => r.item);
  }, [query, fuse]);

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        placeholder="Search games…"
        aria-label="Search games"
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent"
      />
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          {results.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/play/${g.slug}/`}
                className="block px-3 py-2 text-sm hover:bg-surface-2"
                onMouseDown={(e) => e.preventDefault()}
              >
                <span className="font-medium">{g.title}</span>
                <span className="ml-2 text-xs capitalize text-muted">
                  {g.categories.join(", ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted shadow-xl">
          No games found.
        </div>
      )}
    </div>
  );
}
