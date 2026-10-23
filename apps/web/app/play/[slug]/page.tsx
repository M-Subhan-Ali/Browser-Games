import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllGames,
  getGame,
  getRelatedGames,
} from "@/lib/catalog";
import { GameFrame } from "@/components/GameFrame";
import { GameCard } from "@/components/GameCard";

export function generateStaticParams() {
  return getAllGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/play/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return {};
  return {
    title: game.title,
    description: game.description,
    openGraph: { title: game.title, description: game.description },
  };
}

export default async function PlayPage({ params }: PageProps<"/play/[slug]">) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  const related = getRelatedGames(game);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {" / "}
        <Link
          href={`/c/${game.categories[0]}/`}
          className="capitalize hover:text-foreground"
        >
          {game.categories[0]}
        </Link>
        {" / "}
        <span className="text-foreground">{game.title}</span>
      </nav>

      <h1 className="mb-3 text-2xl font-bold">{game.title}</h1>

      <GameFrame
        slug={game.slug}
        version={game.version}
        needsNickname={game.needsNickname}
        orientation={game.orientation}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="mb-2 font-semibold">About</h2>
          <p className="text-muted">{game.description}</p>

          <h2 className="mb-2 mt-5 font-semibold">Controls</h2>
          <div className="flex flex-wrap gap-2">
            {game.controls.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border px-3 py-1 text-sm capitalize text-muted"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-surface p-4 text-sm">
          <h2 className="mb-2 font-semibold">Credits &amp; license</h2>
          <p className="text-muted">
            By{" "}
            <span className="text-foreground">{game.license.author}</span>
          </p>
          <p className="mt-1 text-muted">
            License: <span className="text-foreground">{game.license.type}</span>
          </p>
          {game.license.source && (
            <a
              href={game.license.source}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-accent hover:underline"
            >
              Source
            </a>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Related games</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
