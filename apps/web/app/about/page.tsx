export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
      <h1 className="mb-4 text-3xl font-bold">About NeonArcade</h1>
      <p className="text-muted">
        NeonArcade is a free browser games portal. No account, no download — pick
        a game and play. Your saves and nickname stay on your own device.
      </p>
      <p className="mt-4 text-muted">
        Every game here is either our own, open-source with redistributable
        assets, or hosted with the developer&apos;s written permission. If you
        make browser games and want them featured, get in touch.
      </p>
    </div>
  );
}
