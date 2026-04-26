"use client";

type Option = { value: string; label: string };

export function ChipMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={
              "rounded-full border px-4 py-2 text-sm transition-colors " +
              (active
                ? "border-accent bg-accent-soft text-accent-hover"
                : "border-hairline bg-surface text-foreground/80" +
                  " hover:border-foreground/30")
            }
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
