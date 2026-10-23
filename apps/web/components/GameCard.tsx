import Link from "next/link";
import type { Game } from "@/lib/catalog";

// Deterministic gradient from the slug so every card has art even before a
// real WebP thumbnail is added.
function gradientFor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360;
  const h2 = (h + 60) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${h2} 70% 35%))`;
}

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/play/${game.slug}/`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10"
    >
      <div
        className="relative flex aspect-video items-center justify-center"
        style={{ background: gradientFor(game.slug) }}
      >
        <span className="px-3 text-center text-lg font-bold text-white/90 drop-shadow">
          {game.title}
        </span>
        {game.new && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-background">
            NEW
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold group-hover:text-accent">{game.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">
          {game.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {game.categories.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border px-2 py-0.5 text-xs capitalize text-muted"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
