import { ClearDataButton } from "@/components/ClearDataButton";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
      <h1 className="mb-4 text-3xl font-bold">Privacy</h1>
      <p className="text-muted">
        We collect as little as possible. There are no accounts and no tracking
        cookies.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">What stays on your device</h2>
      <ul className="list-disc space-y-1 pl-6 text-muted">
        <li>An anonymous random ID (so leaderboards can tell players apart).</li>
        <li>An optional nickname you choose.</li>
        <li>Per-game saves.</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold">What a server ever sees</h2>
      <p className="text-muted">
        Only when you submit a score (coming with leaderboards): the game, your
        anonymous ID, your nickname and the score. No email, age, IP address or
        location is stored.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">Clear your data</h2>
      <p className="text-muted">
        This removes your anonymous ID, nickname and recently-played list from
        this browser.
      </p>
      <ClearDataButton />
    </div>
  );
}
