import { getAllGames } from "@/lib/catalog";

export const metadata = { title: "Credits" };

export default function CreditsPage() {
  const games = getAllGames();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
      <h1 className="mb-4 text-3xl font-bold">Credits</h1>
      <p className="mb-6 text-muted">
        Every game, its author and its license.
      </p>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {games.map((g) => (
          <li
            key={g.slug}
            className="flex flex-wrap items-center justify-between gap-2 p-4"
          >
            <div>
              <p className="font-semibold">{g.title}</p>
              <p className="text-sm text-muted">by {g.license.author}</p>
            </div>
            <div className="text-right text-sm">
              <span className="rounded-full border border-border px-2 py-0.5 text-muted">
                {g.license.type}
              </span>
              {g.license.source && (
                <a
                  href={g.license.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-accent hover:underline"
                >
                  source
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
