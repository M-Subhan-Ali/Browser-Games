import Link from "next/link";
import {
  getFeaturedGames,
  getNewGames,
  getCategories,
  getGamesByCategory,
} from "@/lib/catalog";
import { GameCard } from "@/components/GameCard";

export default function HomePage() {
  const featured = getFeaturedGames();
  const newest = getNewGames();
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-10 rounded-2xl border border-border bg-surface/60 p-8 text-center">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Play free games, <span className="text-accent">instantly</span>.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-muted">
          No account. No download. Pick a game and play — your saves stay on
          your device.
        </p>
      </section>

      {featured.length > 0 && (
        <Section title="Featured">
          {featured.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </Section>
      )}

      {newest.length > 0 && (
        <Section title="New">
          {newest.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </Section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold">Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((c) => {
            const count = getGamesByCategory(c).length;
            return (
              <Link
                key={c}
                href={`/c/${c}/`}
                className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/60"
              >
                <span className="block text-lg font-semibold capitalize">
                  {c}
                </span>
                <span className="text-sm text-muted">
                  {count} {count === 1 ? "game" : "games"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}
