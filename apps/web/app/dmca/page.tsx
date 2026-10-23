export const metadata = { title: "DMCA & Takedowns" };

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
      <h1 className="mb-4 text-3xl font-bold">DMCA &amp; Takedowns</h1>
      <p className="text-muted">
        We only host games that are our own, openly licensed, or used with the
        developer&apos;s written permission. If you believe a game here infringes
        your rights, we will review and remove it promptly.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">How to request a takedown</h2>
      <p className="text-muted">
        Email us with: the game&apos;s page URL, a description of the work you
        own, proof of ownership, and your contact details.
      </p>
      <p className="mt-3">
        <a
          href="mailto:takedowns@example.com"
          className="text-accent hover:underline"
        >
          takedowns@example.com
        </a>
      </p>
      <p className="mt-3 text-sm text-muted">
        Replace this address with your real contact email before launch.
      </p>
    </div>
  );
}
