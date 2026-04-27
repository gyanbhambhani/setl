"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chips } from "@/components/Chips";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

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
  { value: "Southside", label: "Southside" },
  { value: "Northside", label: "Northside" },
  { value: "Downtown Berkeley", label: "Downtown Berkeley" },
  { value: "Oakland Border", label: "Oakland Border" },
];

const DEALBREAKERS = [
  { value: "no_laundry", label: "No laundry" },
  { value: "no_pets", label: "No pets allowed" },
  { value: "no_parking", label: "No parking" },
  { value: "no_dishwasher", label: "No dishwasher" },
  { value: "shared_bath", label: "Shared bathroom" },
  { value: "no_natural_light", label: "No natural light" },
];

const ROOMMATE_OPTIONS = [
  { value: "0", label: "Just me" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
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
  const [roommates, setRoommates] = useState(
    String(defaults?.roommates ?? 1)
  );
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
          roommates: Number(roommates),
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
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Budget</FieldLegend>
          <FieldDescription>{formattedRange}</FieldDescription>
          <Card className="mt-2">
            <CardContent className="space-y-5 py-4">
              <RangeRow
                label="Minimum"
                value={budgetMin}
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                onChange={(v) => {
                  setBudgetMin(v);
                  if (v > budgetMax) setBudgetMax(v);
                }}
              />
              <RangeRow
                label="Maximum"
                value={budgetMax}
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                onChange={(v) => {
                  setBudgetMax(v);
                  if (v < budgetMin) setBudgetMin(v);
                }}
              />
            </CardContent>
          </Card>
        </FieldSet>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="move_date">Move-in date</FieldLabel>
            <Input
              id="move_date"
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
            />
          </Field>
          <FieldSet>
            <FieldLegend variant="label">Roommates</FieldLegend>
            <ToggleGroup
              value={[roommates]}
              onValueChange={(v) => {
                const next = (v as string[])[0];
                if (next) setRoommates(next);
              }}
              variant="outline"
              size="sm"
              spacing={2}
              className="flex-wrap"
              aria-label="Number of roommates"
            >
              {ROOMMATE_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-full px-4"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FieldSet>
        </div>

        <FieldSet>
          <FieldLegend variant="label">Neighborhoods</FieldLegend>
          <FieldDescription>Pick any that work for you.</FieldDescription>
          <Chips
            options={NEIGHBORHOODS}
            selected={neighborhoods}
            onChange={setNeighborhoods}
            ariaLabel="Neighborhoods"
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Dealbreakers</FieldLegend>
          <FieldDescription>
            We&rsquo;ll filter listings that match these.
          </FieldDescription>
          <Chips
            options={DEALBREAKERS}
            selected={dealbreakers}
            onChange={setDealbreakers}
            ariaLabel="Dealbreakers"
          />
        </FieldSet>

        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor="description">Describe your ideal place</FieldLabel>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Sunny, walkable to campus, room for a desk."
          />
          <FieldDescription>One sentence is plenty.</FieldDescription>
          <FieldError>{error ?? undefined}</FieldError>
        </Field>

        <div
          className="flex flex-col-reverse items-start gap-4 sm:flex-row
            sm:items-center sm:justify-between"
        >
          <p className="text-[13px] text-muted-foreground">
            By submitting, you&rsquo;ll see verified listings and get matched
            manually.
          </p>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Sending…" : "Show me places"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        className="mb-1.5 flex justify-between text-[12px]
          text-muted-foreground"
      >
        <span>{label}</span>
        <span className="font-mono text-foreground">
          ${value.toLocaleString()}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand"
        aria-label={label}
      />
    </div>
  );
}
