"use client";

import { useState } from "react";
import { clearAllLocalData } from "@/lib/player";

export function ClearDataButton() {
  const [done, setDone] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => {
          clearAllLocalData();
          setDone(true);
        }}
        className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-accent/60"
      >
        Clear my data
      </button>
      {done && (
        <p className="mt-2 text-sm text-accent">
          Done — your local data was cleared.
        </p>
      )}
    </div>
  );
}
