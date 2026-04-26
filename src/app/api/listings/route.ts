import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabaseAdmin,
  LISTING_VIDEO_BUCKET,
} from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/supabaseServer";
import { landlordConfirmationEmail, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_PHOTO_COUNT = 8;
const NEIGHBORHOODS = new Set([
  "Southside",
  "Northside",
  "Downtown Berkeley",
  "Oakland Border",
]);

function getString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function getNumber(form: FormData, key: string): number | null {
  const raw = getString(form, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function getStringList(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || !user.email) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const landlord_email = getString(form, "landlord_email") || user.email;
  const landlord_phone = getString(form, "landlord_phone");
  const address = getString(form, "address");
  const neighborhood = getString(form, "neighborhood");
  const rent = getNumber(form, "rent");
  const available_date = getString(form, "available_date");
  const bedrooms = getNumber(form, "bedrooms");
  const bathrooms = getNumber(form, "bathrooms");
  const amenities = getStringList(form, "amenities");
  const agreed = getString(form, "respond_within_24h") === "on";
  const photos = form
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!address || !rent || !available_date) {
    return NextResponse.json(
      { error: "Address, rent, and availability date are required." },
      { status: 400 }
    );
  }
  if (!NEIGHBORHOODS.has(neighborhood)) {
    return NextResponse.json(
      { error: "Choose a valid neighborhood." },
      { status: 400 }
    );
  }
  if (!isEmail(landlord_email)) {
    return NextResponse.json(
      { error: "A valid landlord email is required." },
      { status: 400 }
    );
  }
  if (!agreed) {
    return NextResponse.json(
      { error: "You must agree to the 24-hour response policy." },
      { status: 400 }
    );
  }
  if (photos.length === 0) {
    return NextResponse.json(
      { error: "At least one listing photo is required." },
      { status: 400 }
    );
  }
  if (photos.length > MAX_PHOTO_COUNT) {
    return NextResponse.json(
      { error: `You can upload up to ${MAX_PHOTO_COUNT} photos.` },
      { status: 400 }
    );
  }
  for (const photo of photos) {
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload image files only (JPG, PNG, WEBP, etc)." },
        { status: 400 }
      );
    }
    if (photo.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Each photo must be under 50MB." },
        { status: 400 }
      );
    }
  }

  const supabase = getSupabaseAdmin();
  const photoUrls: string[] = [];
  for (const photo of photos) {
    const ext = (photo.name.split(".").pop() ?? "jpg").toLowerCase();
    const safeExt = /^[a-z0-9]{1,6}$/.test(ext) ? ext : "jpg";
    const path = `${crypto.randomUUID()}.${safeExt}`;

    const { error: uploadErr } = await supabase.storage
      .from(LISTING_VIDEO_BUCKET)
      .upload(path, photo, {
        contentType: photo.type || "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      console.error("[listings] upload failed", uploadErr);
      const tooLarge =
        uploadErr &&
        (uploadErr.status === 413 || uploadErr.statusCode === "413");
      return NextResponse.json(
        {
          error: tooLarge
            ? "One of your photos exceeds the Storage limit " +
              "(Free plan max is 50MB per file)."
            : "Couldn't upload your photos. Make sure the listing-videos " +
              "bucket exists and is public.",
        },
        { status: tooLarge ? 413 : 500 }
      );
    }

    const { data: pub } = supabase.storage
      .from(LISTING_VIDEO_BUCKET)
      .getPublicUrl(path);
    photoUrls.push(pub.publicUrl);
  }

  const { data: row, error: insertErr } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      landlord_email,
      landlord_phone: landlord_phone || null,
      address,
      neighborhood,
      rent,
      available_date,
      bedrooms,
      bathrooms,
      amenities,
      video_url: photoUrls[0] ?? null,
      photo_urls: photoUrls,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    console.error("[listings] insert failed", insertErr);
    return NextResponse.json(
      { error: "Could not save your listing. Try again." },
      { status: 500 }
    );
  }

  const { subject, html } = landlordConfirmationEmail();
  await sendEmail({ to: landlord_email, subject, html });

  return NextResponse.json({ id: row.id }, { status: 201 });
}
