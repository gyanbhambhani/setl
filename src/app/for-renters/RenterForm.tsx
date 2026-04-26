"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { Field, inputBase } from "@/components/Field";

export type RenterDefaults = {
  budget_min: number | null;
  budget_max: number | null;
  move_date: string | null;
  roommates: number | null;
  neighborhoods: string[] | null;
  dealbreakers: string[] | null;
  description: string | null;
};

const NEIGHBORHOODS = [
  { value: "southside", label: "Southside" },
  { value: "northside", label: "Northside" },
  { value: "downtown", label: "Downtown Berkeley" },
  { value: "oakland_border", label: "Oakland border" },
];

const DEALBREAKERS = [
  { value: "no_laundry", label: "No laundry" },
  { value: "no_pets", label: "No pets allowed" },
  { value: "no_parking", label: "No parking" },
  { value: "no_dishwasher", label: "No dishwasher" },
  { value: "shared_bath", label: "Shared bathroom" },
  { value: "no_natural_light", label: "No natural light" },
];

const MIN_BUDGET = 600;
const MAX_BUDGET = 5000;

export function RenterForm({
  defaults,
}: {
  defaults: RenterDefaults | null;
}) {
  const router = useRouter();
  const [budgetMin, setBudgetMin] = useState(defaults?.budget_min ?? 1500);
  const [budgetMax, setBudgetMax] = useState(defaults?.budget_max ?? 2800);
  const [moveDate, setMoveDate] = useState(defaults?.move_date ?? "");
  const [roommates, setRoommates] = useState(defaults?.roommates ?? 1);
  const [neighborhoods, setNeighborhoods] = useState<string[]>(
    defaults?.neighborhoods ?? []
  );
  const [dealbreakers, setDealbreakers] = useState<string[]>(
    defaults?.dealbreakers ?? []
  );
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedRange = useMemo(
    () =>
      `$${budgetMin.toLocaleString()} – $${budgetMax.toLocaleString()}/mo`,
    [budgetMin, budgetMax]
  );

  function toggle(arr: string[], value: string): string[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/renters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          budget_min: budgetMin,
          budget_max: budgetMax,
          move_date: moveDate || null,
          roommates,
          neighborhoods,
          dealbreakers,
          description,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Something went wrong.");
      }
      router.push("/listings?welcome=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <Field label="Budget" hint={formattedRange}>
        <div
          className="rounded-2xl border border-hairline bg-surface p-5"
        >
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1 flex justify-between text-[12px] text-muted">
                <span>Minimum</span>
                <span>${budgetMin.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                step={50}
                value={budgetMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setBudgetMin(v);
                  if (v > budgetMax) setBudgetMax(v);
                }}
                className="w-full accent-[#5c7a5c]"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[12px] text-muted">
                <span>Maximum</span>
                <span>${budgetMax.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                step={50}
                value={budgetMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setBudgetMax(v);
                  if (v < budgetMin) setBudgetMin(v);
                }}
                className="w-full accent-[#5c7a5c]"
              />
            </div>
          </div>
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Move-in date" htmlFor="move_date">
          <input
            id="move_date"
            type="date"
            value={moveDate}
            onChange={(e) => setMoveDate(e.target.value)}
            className={inputBase}
          />
        </Field>
        <Field label="Number of roommates" htmlFor="roommates">
          <select
            id="roommates"
            value={roommates}
            onChange={(e) => setRoommates(Number(e.target.value))}
            className={inputBase}
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "Just me" : `${n} roommate${n > 1 ? "s" : ""}`}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Neighborhoods">
        <ChipMultiSelect
          options={NEIGHBORHOODS}
          selected={neighborhoods}
          onToggle={(v) => setNeighborhoods((a) => toggle(a, v))}
        />
      </Field>

      <Field label="Dealbreakers">
        <ChipMultiSelect
          options={DEALBREAKERS}
          selected={dealbreakers}
          onToggle={(v) => setDealbreakers((a) => toggle(a, v))}
        />
      </Field>

      <Field
        label="Describe your ideal place"
        htmlFor="description"
        hint="One sentence is plenty"
      >
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Sunny, walkable to campus, room for a desk."
          className={`${inputBase} resize-none`}
        />
      </Field>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-muted">
          By submitting, you&rsquo;ll see verified listings and get matched
          manually.
        </p>
        <Button size="lg" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Show me places"}
        </Button>
      </div>
    </form>
  );
}
