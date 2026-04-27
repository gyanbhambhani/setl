import { cn } from "@/lib/utils";

type Variant = "default" | "stacked" | "mark";
type Tone = "ink" | "brand" | "cream";

const toneClass: Record<Tone, string> = {
  ink: "text-foreground",
  brand: "text-brand",
  cream: "text-[#fafaf8]",
};

export function SetlWordmark({
  className,
  variant = "default",
  tone = "ink",
}: {
  className?: string;
  variant?: Variant;
  tone?: Tone;
}) {
  if (variant === "mark") {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex items-center justify-center font-display",
          "text-[20px] leading-none tracking-tight",
          toneClass[tone],
          className
        )}
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        s
        <span className="text-brand">·</span>l
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-[2px] font-display leading-none",
        "tracking-tight lowercase",
        toneClass[tone],
        variant === "stacked" ? "flex-col items-start gap-[6px]" : "",
        className
      )}
      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
    >
      <span className="font-medium">setl</span>
      <span
        aria-hidden
        className="ml-[3px] inline-block size-[5px] rounded-full bg-brand
          translate-y-[-1px]"
      />
      {variant === "stacked" ? (
        <span
          className="font-mono text-[10px] uppercase tracking-[0.32em]
            text-muted-foreground"
        >
          berkeley housing
        </span>
      ) : null}
    </span>
  );
}

export function SetlMark({
  className,
  tone = "cream",
}: {
  className?: string;
  tone?: Tone;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md",
        "bg-brand font-display text-[15px] font-medium",
        toneClass[tone],
        className
      )}
      style={{ fontVariationSettings: "'opsz' 144" }}
    >
      s
    </span>
  );
}
