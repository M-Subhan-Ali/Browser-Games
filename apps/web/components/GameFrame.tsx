"use client";

import { useEffect, useRef, useState } from "react";
import { gameUrl, expectedGameOrigin } from "@/lib/games-origin";
import {
  getPlayer,
  setNickname,
  saveGame,
  loadGame,
  pushRecent,
} from "@/lib/player";

type Props = {
  slug: string;
  version: string;
  needsNickname: boolean;
  orientation: "any" | "portrait" | "landscape";
};

type SdkMessage = {
  __portal: true;
  id: number;
  call: string;
  args: unknown[];
};

export function GameFrame({ slug, version, needsNickname }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [showNickname, setShowNickname] = useState(false);
  const pendingNickRef = useRef<((nick: string) => void) | null>(null);

  useEffect(() => {
    pushRecent(slug);
    const expected = expectedGameOrigin();
    const win = () => iframeRef.current?.contentWindow ?? null;

    function reply(id: number, result: unknown) {
      win()?.postMessage({ __portalReply: true, id, result }, expected || "*");
    }

    async function onMessage(e: MessageEvent) {
      // Only trust messages from the exact games origin AND our iframe window.
      if (expected && e.origin !== expected) return;
      if (e.source !== win()) return;

      const msg = e.data as SdkMessage;
      if (!msg || msg.__portal !== true) return;

      switch (msg.call) {
        case "ready": {
          setStatus("ready");
          reply(msg.id, true);
          break;
        }
        case "getPlayer": {
          let player = getPlayer();
          if (!player.nickname && needsNickname) {
            const nick = await askNickname();
            if (nick) {
              setNickname(nick);
              player = getPlayer();
            }
          }
          reply(msg.id, player);
          break;
        }
        case "save": {
          try {
            await saveGame(slug, msg.args[0]);
            reply(msg.id, true);
          } catch {
            reply(msg.id, false);
          }
          break;
        }
        case "load": {
          const data = await loadGame(slug);
          reply(msg.id, data);
          break;
        }
        // Phase 3 — leaderboards. Stubbed so games degrade gracefully now.
        case "submitScore": {
          reply(msg.id, { ok: false, queued: true });
          break;
        }
        case "getLeaderboard": {
          reply(msg.id, []);
          break;
        }
        case "gameplayStart":
        case "gameplayStop": {
          reply(msg.id, true);
          break;
        }
        default:
          reply(msg.id, null);
      }
    }

    function askNickname(): Promise<string | null> {
      return new Promise((resolve) => {
        pendingNickRef.current = (nick: string) => resolve(nick);
        setShowNickname(true);
      });
    }

    window.addEventListener("message", onMessage);

    // If the game never calls ready(), surface an error state.
    const timeout = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
    }, 15000);

    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeout);
    };
  }, [slug, needsNickname]);

  function submitNickname(nick: string) {
    pendingNickRef.current?.(nick);
    pendingNickRef.current = null;
    setShowNickname(false);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-black">
      <div className="aspect-video w-full">
        <iframe
          ref={iframeRef}
          src={gameUrl(slug, version)}
          title="Game"
          className="h-full w-full"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock"
          allow="fullscreen; gamepad; autoplay"
          onError={() => setStatus("error")}
        />
      </div>

      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">Loading game…</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/95 p-6 text-center">
          <p className="text-lg font-semibold">This game failed to load.</p>
          <p className="text-sm text-muted">
            Try reloading the page. If it keeps happening, the game may be
            temporarily unavailable.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background"
          >
            Reload
          </button>
        </div>
      )}

      {showNickname && (
        <NicknameDialog
          onSubmit={submitNickname}
          onCancel={() => submitNickname("")}
        />
      )}
    </div>
  );
}

function NicknameDialog({
  onSubmit,
  onCancel,
}: {
  onSubmit: (nick: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const valid = /^[A-Za-z0-9_]{3,16}$/.test(value);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Pick a nickname</h2>
        <p className="mt-1 text-sm text-muted">
          Shown on leaderboards. 3–16 letters, numbers or underscores.
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid) onSubmit(value);
          }}
          placeholder="e.g. neon_fox"
          className="mt-3 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 outline-none focus:border-accent"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            Skip
          </button>
          <button
            onClick={() => valid && onSubmit(value)}
            disabled={!valid}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
