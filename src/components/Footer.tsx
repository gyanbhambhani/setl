export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline">
      <div
        className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8
          text-[13px] text-muted sm:flex-row sm:items-center
          sm:justify-between"
      >
        <span>Setl — Verified student housing. Berkeley first.</span>
        <span className="font-mono uppercase tracking-widest text-[11px]">
          Made in the East Bay
        </span>
      </div>
    </footer>
  );
}
