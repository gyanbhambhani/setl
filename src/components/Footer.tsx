import { Separator } from "@/components/ui/separator";
import { SetlWordmark } from "@/components/SetlLogo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10
          text-[13px] text-muted-foreground sm:flex-row sm:items-center
          sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <SetlWordmark className="text-[20px]" />
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <span className="hidden sm:inline">
            Verified student housing. Berkeley first.
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.28em]">
          A{" "}
          <a
            href="https://mano.network"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            mano.network
          </a>{" "}
          project
        </span>
      </div>
    </footer>
  );
}
