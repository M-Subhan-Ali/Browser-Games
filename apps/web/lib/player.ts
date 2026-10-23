// Guest-only identity. Everything here lives on the player's device only.
// Anonymous ID + nickname in localStorage; per-game saves in IndexedDB.
import { get, set, del } from "idb-keyval";

const ID_KEY = "portal:playerId";
const NICK_KEY = "portal:nickname";

export type Player = { id: string; nickname: string | null };

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getNickname(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NICK_KEY);
}

export function setNickname(nickname: string): void {
  localStorage.setItem(NICK_KEY, nickname);
}

export function getPlayer(): Player {
  return { id: getPlayerId(), nickname: getNickname() };
}

// Per-game saves, capped at 1 MB each (enforced here and documented in the SDK).
const MAX_SAVE_BYTES = 1024 * 1024;

export async function saveGame(slug: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data);
  if (json.length > MAX_SAVE_BYTES) {
    throw new Error("Save exceeds 1 MB limit");
  }
  await set(`save:${slug}`, json);
}

export async function loadGame<T = unknown>(slug: string): Promise<T | null> {
  const json = await get<string>(`save:${slug}`);
  return json ? (JSON.parse(json) as T) : null;
}

export async function clearGame(slug: string): Promise<void> {
  await del(`save:${slug}`);
}

export function clearAllLocalData(): void {
  localStorage.removeItem(ID_KEY);
  localStorage.removeItem(NICK_KEY);
  // Recently-played + saves are cleared on the privacy page in Phase 2.
}

// Recently played — stored locally, newest first.
const RECENT_KEY = "portal:recent";

export function pushRecent(slug: string, limit = 12): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(RECENT_KEY);
  const list: string[] = raw ? JSON.parse(raw) : [];
  const next = [slug, ...list.filter((s) => s !== slug)].slice(0, limit);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RECENT_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}
