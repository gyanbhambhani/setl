import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium tracking-wide text-foreground/80
            uppercase"
        >
          {label}
        </label>
        {hint ? (
          <span className="text-[12px] text-muted">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export const inputBase =
  "w-full rounded-xl border border-hairline bg-surface px-4 py-3 text-[15px]" +
  " text-foreground placeholder:text-muted/70 transition-colors" +
  " focus:outline-none focus:border-accent focus:ring-2" +
  " focus:ring-accent/20";
