"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { Field, inputBase } from "@/components/Field";

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
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggle(arr: string[], value: string): string[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

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
      <div
        className="rounded-2xl border border-hairline bg-surface p-8"
      >
        <h2 className="text-[22px] font-semibold tracking-tight">
          Thanks — your listing is in review.
        </h2>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted">
          We&rsquo;ll review your listing photos within a day. Once approved,
          your place is live for verified Berkeley renters. Check your inbox for
          confirmation.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-10"
    >
      <Field label="Unit address" htmlFor="address">
        <input
          id="address"
          name="address"
          required
          placeholder="2410 Channing Way, Apt 4, Berkeley CA"
          className={inputBase}
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Neighborhood" htmlFor="neighborhood">
          <select
            id="neighborhood"
            name="neighborhood"
            required
            className={inputBase}
          >
            <option value="">Choose one</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Field label="Rent" htmlFor="rent" hint="USD / month">
          <input
            id="rent"
            name="rent"
            type="number"
            min={400}
            max={10000}
            required
            placeholder="2850"
            className={inputBase}
          />
        </Field>
        <Field label="Available" htmlFor="available_date">
          <input
            id="available_date"
            name="available_date"
            type="date"
            required
            className={inputBase}
          />
        </Field>
        <Field label="Bedrooms" htmlFor="bedrooms">
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            max={10}
            required
            placeholder="2"
            className={inputBase}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Bathrooms" htmlFor="bathrooms">
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            step={0.5}
            min={0}
            max={10}
            required
            placeholder="1.5"
            className={inputBase}
          />
        </Field>
      </div>

      <Field label="Amenities">
        <ChipMultiSelect
          options={AMENITIES}
          selected={amenities}
          onToggle={(v) => setAmenities((a) => toggle(a, v))}
        />
      </Field>

      <Field
        label="Listing photos"
        hint={`Up to ${MAX_PHOTO_COUNT} photos, 50MB max each`}
      >
        <label
          className="flex cursor-pointer flex-col gap-3 rounded-2xl border
            border-dashed border-hairline bg-surface px-5 py-6 text-center
            transition-colors hover:border-foreground/30"
        >
          <span className="text-[15px] font-medium">
            {photoFiles.length > 0
              ? `${photoFiles.length} photo${photoFiles.length > 1 ? "s" : ""} selected`
              : "Tap to choose photos"}
          </span>
          <span className="text-[12px] text-muted">
            {photoFiles.length > 0
              ? photoFiles
                  .slice(0, 3)
                  .map((f) => f.name)
                  .join(" • ")
              : "Show multiple angles: main room, kitchen, bathroom, and condition."}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={handlePhotoChange}
          />
        </label>
        {photoError ? (
          <p className="text-sm text-red-700" role="alert">
            {photoError}
          </p>
        ) : null}
        {photoFiles.some((f) => f.size > MAX_PHOTO_MB * 1024 * 1024) ? (
          <p className="text-sm text-red-700" role="alert">
            Each photo must be under {MAX_PHOTO_MB}MB.
          </p>
        ) : null}
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Landlord email" htmlFor="landlord_email">
          <input
            id="landlord_email"
            name="landlord_email"
            type="email"
            required
            defaultValue={defaultEmail}
            placeholder="you@example.com"
            className={inputBase}
          />
        </Field>
        <Field label="Landlord phone" htmlFor="landlord_phone">
          <input
            id="landlord_phone"
            name="landlord_phone"
            type="tel"
            placeholder="(510) 555-0143"
            className={inputBase}
          />
        </Field>
      </div>

      <label
        className="flex items-start gap-3 rounded-2xl border border-hairline
          bg-surface px-5 py-4"
      >
        <input
          type="checkbox"
          name="respond_within_24h"
          required
          className="mt-1 h-4 w-4 accent-[#5c7a5c]"
        />
        <span className="text-[14px] leading-[1.55] text-foreground/90">
          I agree to respond to interested renters within 24 hours. If I
          don&rsquo;t, Setl may deprioritize my listing.
        </span>
      </label>

      {submitError ? (
        <p className="text-sm text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-muted">
          A real person reviews every submission.
        </p>
        <Button size="lg" type="submit" disabled={submitting}>
          {submitting ? "Uploading…" : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
