// Copies the games/ folder into apps/web/public/g so the portal can serve
// games same-origin during local dev and in the static export.
//
// In production you instead deploy games/ to a SECOND Cloudflare Pages project
// and set NEXT_PUBLIC_GAMES_ORIGIN to its URL — then this copy is just a local
// convenience and the portal loads games cross-origin as designed.
import { cp, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(here, "..");
const gamesSrc = path.join(webRoot, "..", "..", "games");
const dest = path.join(webRoot, "public", "g");

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
// Skip _headers (Pages config for the games origin, not a game asset).
await cp(gamesSrc, dest, {
  recursive: true,
  filter: (src) => path.basename(src) !== "_headers",
});

console.log("[copy-games] games -> public/g");
