import { readFileSync } from "node:fs";
import path from "node:path";

export type License = {
  type: string;
  author: string;
  source?: string;
  permissionFile?: string;
};

export type Game = {
  slug: string;
  title: string;
  version: string;
  categories: string[];
  thumbnail?: string;
  description: string;
  controls: string[];
  orientation: "any" | "portrait" | "landscape";
  featured?: boolean;
  new?: boolean;
  leaderboard: boolean;
  maxScore: number;
  needsNickname: boolean;
  license: License;
};

// The catalog is the single source of truth. It lives at the repo root
// (content/catalog.json) and is read once at build time for static export.
let cache: Game[] | null = null;

function loadCatalog(): Game[] {
  if (cache) return cache;
  // process.cwd() during `next build` is apps/web; the catalog is two levels up.
  const file = path.join(process.cwd(), "..", "..", "content", "catalog.json");
  const raw = readFileSync(file, "utf8");
  cache = JSON.parse(raw) as Game[];
  return cache;
}

export function getAllGames(): Game[] {
  return loadCatalog();
}

export function getGame(slug: string): Game | undefined {
  return loadCatalog().find((g) => g.slug === slug);
}

export function getFeaturedGames(): Game[] {
  return loadCatalog().filter((g) => g.featured);
}

export function getNewGames(): Game[] {
  return loadCatalog().filter((g) => g.new);
}

export function getCategories(): string[] {
  const set = new Set<string>();
  for (const g of loadCatalog()) {
    for (const c of g.categories) set.add(c);
  }
  return [...set].sort();
}

export function getGamesByCategory(category: string): Game[] {
  return loadCatalog().filter((g) => g.categories.includes(category));
}

export function getRelatedGames(game: Game, limit = 4): Game[] {
  return loadCatalog()
    .filter(
      (g) =>
        g.slug !== game.slug &&
        g.categories.some((c) => game.categories.includes(c)),
    )
    .slice(0, limit);
}
