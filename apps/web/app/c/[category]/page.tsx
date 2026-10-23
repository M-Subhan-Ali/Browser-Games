import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategories,
  getGamesByCategory,
} from "@/lib/catalog";
import { GameCard } from "@/components/GameCard";

export function generateStaticParams() {
  return getCategories().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: PageProps<"/c/[category]">): Promise<Metadata> {
  const { category } = await params;
  const title = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${title} Games`,
    description: `Play free ${category} games in your browser.`,
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/c/[category]">) {
  const { category } = await params;
  const games = getGamesByCategory(category);
  if (games.length === 0) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold capitalize">{category} games</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
    </div>
  );
}
