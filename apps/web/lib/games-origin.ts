// Where game files are served from.
//
// Production: a second Cloudflare Pages project, e.g.
//   NEXT_PUBLIC_GAMES_ORIGIN=https://yourportal-games.pages.dev
//
// Local dev / default: empty string means "same origin", and games are copied
// into public/g by scripts/copy-games.mjs so the portal runs with $0 and no
// second server. The postMessage bridge trusts exactly this origin.
export const GAMES_ORIGIN = process.env.NEXT_PUBLIC_GAMES_ORIGIN ?? "";

export function gameUrl(slug: string, version: string): string {
  // Directory form (trailing slash) so the game's relative script paths
  // (e.g. ../../portal-sdk.js) resolve the same locally and on a separate
  // games origin. Pointing at index.html can trigger a redirect that drops
  // the trailing slash and breaks relative resolution.
  //
  // Production: games live at the ROOT of the second Pages project.
  // Local/same-origin: games are copied under /g by scripts/copy-games.mjs.
  if (GAMES_ORIGIN) return `${GAMES_ORIGIN}/${slug}/${version}/`;
  return `/g/${slug}/${version}/`;
}

// The origin string the parent page compares postMessage events against.
export function expectedGameOrigin(): string {
  if (GAMES_ORIGIN) return new URL(GAMES_ORIGIN).origin;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
