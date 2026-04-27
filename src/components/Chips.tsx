"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Option = { value: string; label: string };

export function Chips({
  options,
  selected,
  onChange,
  ariaLabel,
}: {
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  ariaLabel?: string;
}) {
  return (
    <ToggleGroup
      multiple
      value={selected}
      onValueChange={(v) => onChange(v as string[])}
      variant="outline"
      size="sm"
      spacing={2}
      aria-label={ariaLabel}
      className="flex-wrap"
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className="rounded-full px-4"
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
