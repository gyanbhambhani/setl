"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

const AMENITIES = [
  { value: "in_unit_laundry", label: "In-unit laundry" },
  { value: "shared_laundry", label: "Shared laundry" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "parking", label: "Parking" },
  { value: "pets_allowed", label: "Pets allowed" },
  { value: "furnished", label: "Furnished" },
  { value: "outdoor_space", label: "Outdoor space" },
  { value: "ac", label: "Air conditioning" },
];

const NEIGHBORHOODS = [
  "Southside",
  "Northside",
  "Downtown Berkeley",
  "Oakland Border",
];

const MAX_PHOTO_MB = 50;
const MAX_PHOTO_COUNT = 8;

export function LandlordForm({ defaultEmail }: { defaultEmail: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotoError(null);
    if (files.length === 0) {
      setPhotoFiles([]);
      return;
    }
    if (files.length > MAX_PHOTO_COUNT) {
      setPhotoError(`Upload up to ${MAX_PHOTO_COUNT} photos.`);
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Please upload image files only.");
        return;
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        setPhotoError(`Each photo must be under ${MAX_PHOTO_MB}MB.`);
        return;
      }
    }
    setPhotoFiles(files);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    if (!neighborhood) {
      setSubmitError("Choose a neighborhood.");
      return;
    }
    if (photoFiles.length === 0) {
      setSubmitError("At least one listing photo is required.");
      return;
    }
    if (photoFiles.length > MAX_PHOTO_COUNT) {
      setSubmitError(`Upload up to ${MAX_PHOTO_COUNT} photos.`);
      return;
    }
    for (const file of photoFiles) {
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        setSubmitError(`Each photo must be under ${MAX_PHOTO_MB}MB.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("neighborhood", neighborhood);
      fd.delete("amenities");
      for (const a of amenities) fd.append("amenities", a);
      fd.delete("photos");
      for (const file of photoFiles) {
        fd.append("photos", file, file.name);
      }
      const res = await fetch("/api/listings", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Could not submit your listing.");
      }
      setDone(true);
      formRef.current?.reset();
      setNeighborhood("");
      setAmenities([]);
      setPhotoFiles([]);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not submit your listing."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex items-start gap-4 py-6">
          <CheckCircle2
            className="mt-0.5 size-6 shrink-0 text-brand"
            strokeWidth={1.5}
          />
          <div>
            <h2
              className="font-display text-[22px] leading-tight tracking-tight"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              Your listing is in review.
            </h2>
            <p
              className="mt-2 text-[15px] leading-[1.6] text-muted-foreground"
            >
              We&rsquo;ll review your photos within a day. Once approved, your
              place is live for verified Berkeley renters. Check your inbox for
              confirmation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="address">Unit address</FieldLabel>
          <Input
            id="address"
            name="address"
            required
            placeholder="2410 Channing Way, Apt 4, Berkeley CA"
          />
        </Field>

        <FieldSet>
          <FieldLegend variant="label">Neighborhood</FieldLegend>
          <ToggleGroup
            value={neighborhood ? [neighborhood] : []}
            onValueChange={(v) => {
              const next = (v as string[])[0];
              setNeighborhood(next ?? "");
            }}
            variant="outline"
            size="sm"
            spacing={2}
            className="flex-wrap"
            aria-label="Neighborhood"
          >
            {NEIGHBORHOODS.map((n) => (
              <ToggleGroupItem
                key={n}
                value={n}
                className="rounded-full px-4"
              >
                {n}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="rent">Rent</FieldLabel>
            <Input
              id="rent"
              name="rent"
              type="number"
              min={400}
              max={10000}
              required
              placeholder="2850"
            />
            <FieldDescription>USD per month</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="available_date">Available</FieldLabel>
            <Input
              id="available_date"
              name="available_date"
              type="date"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="bedrooms">Bedrooms</FieldLabel>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min={0}
              max={10}
              required
              placeholder="2"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="bathrooms">Bathrooms</FieldLabel>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              step={0.5}
              min={0}
              max={10}
              required
              placeholder="1.5"
            />
          </Field>
        </div>

        <FieldSet>
          <FieldLegend variant="label">Amenities</FieldLegend>
          <Chips
            options={AMENITIES}
            selected={amenities}
            onChange={setAmenities}
            ariaLabel="Amenities"
          />
        </FieldSet>

        <FieldSet data-invalid={photoError ? true : undefined}>
          <FieldLegend variant="label">Listing photos</FieldLegend>
          <FieldDescription>
            Up to {MAX_PHOTO_COUNT} photos, {MAX_PHOTO_MB}MB max each.
          </FieldDescription>
          <label
            className="group flex cursor-pointer flex-col items-center gap-3
              rounded-xl border border-dashed border-border bg-card px-5
              py-7 text-center transition-colors hover:border-foreground/40"
          >
            <span
              className="inline-flex size-10 items-center justify-center
                rounded-lg bg-brand-soft text-brand-ink"
            >
              <Camera className="size-5" strokeWidth={1.5} />
            </span>
            <span className="text-[15px] font-medium">
              {photoFiles.length > 0
                ? `${photoFiles.length} photo${
                    photoFiles.length > 1 ? "s" : ""
                  } selected`
                : "Tap to choose photos"}
            </span>
            <span
              className="text-[12px] text-muted-foreground"
            >
              {photoFiles.length > 0
                ? photoFiles
                    .slice(0, 3)
                    .map((f) => f.name)
                    .join(" • ")
                : "Show multiple angles: main room, kitchen, bathroom, condition."}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              multiple
              onChange={handlePhotoChange}
            />
          </label>
          <FieldError>{photoError ?? undefined}</FieldError>
        </FieldSet>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="landlord_email">Landlord email</FieldLabel>
            <Input
              id="landlord_email"
              name="landlord_email"
              type="email"
              required
              defaultValue={defaultEmail}
              placeholder="you@example.com"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="landlord_phone">Landlord phone</FieldLabel>
            <Input
              id="landlord_phone"
              name="landlord_phone"
              type="tel"
              placeholder="(510) 555-0143"
            />
          </Field>
        </div>

        <Card>
          <CardContent className="flex items-start gap-3 py-4">
            <input
              id="respond_within_24h"
              type="checkbox"
              name="respond_within_24h"
              required
              className="mt-1 size-4 accent-brand"
            />
            <label
              htmlFor="respond_within_24h"
              className="text-[14px] leading-[1.55] text-foreground/90"
            >
              I agree to respond to interested renters within 24 hours. If I
              don&rsquo;t, Setl may deprioritize my listing.
            </label>
          </CardContent>
        </Card>

        <Field data-invalid={submitError ? true : undefined}>
          <FieldError>{submitError ?? undefined}</FieldError>
        </Field>

        <div
          className="flex flex-col-reverse items-start gap-4 sm:flex-row
            sm:items-center sm:justify-between"
        >
          <p className="text-[13px] text-muted-foreground">
            A real person reviews every submission.
          </p>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Uploading…" : "Submit for review"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
