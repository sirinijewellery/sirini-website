import { NextResponse } from "next/server";

// Delivery zones keyed by normalized state name.
const METRO_STATES = new Set([
  "maharashtra",
  "gujarat",
  "delhi",
  "karnataka",
  "telangana",
  "tamil nadu",
  "goa",
]);

const REMOTE_STATES = new Set([
  "jammu and kashmir",
  "ladakh",
  "arunachal pradesh",
  "assam",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "tripura",
  "sikkim",
  "andaman and nicobar islands",
  "andaman & nicobar islands",
  "lakshadweep",
]);

function normalizeState(state: string): string {
  return state.trim().toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ");
}

function zoneForState(state: string): { minDays: number; maxDays: number } {
  const s = normalizeState(state);
  if (METRO_STATES.has(s)) return { minDays: 3, maxDays: 5 };
  if (REMOTE_STATES.has(s)) return { minDays: 7, maxDays: 10 };
  return { minDays: 5, maxDays: 7 };
}

interface PostOffice {
  Name?: string;
  District?: string;
  State?: string;
}

interface IndiaPostResult {
  Status?: string;
  PostOffice?: PostOffice[] | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim() ?? "";

  // Indian pincodes are 6 digits and never start with 0.
  if (!/^[1-9]\d{5}$/.test(code)) {
    return NextResponse.json({ valid: false });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ valid: false, error: "lookup_failed" });
    }

    const data = (await res.json()) as IndiaPostResult[];
    const entry = Array.isArray(data) ? data[0] : undefined;

    if (
      !entry ||
      entry.Status !== "Success" ||
      !Array.isArray(entry.PostOffice) ||
      entry.PostOffice.length === 0
    ) {
      return NextResponse.json({ valid: false });
    }

    const office = entry.PostOffice[0];
    const state = office.State ?? "";
    const city = office.District ?? office.Name ?? "";
    const { minDays, maxDays } = zoneForState(state);

    return NextResponse.json({
      valid: true,
      city,
      state,
      minDays,
      maxDays,
    });
  } catch {
    // Network failure, timeout (abort), or JSON parse error.
    return NextResponse.json({ valid: false, error: "lookup_failed" });
  } finally {
    clearTimeout(timeout);
  }
}
