import { z } from "zod";

// Single source of truth for email validation across the API surface. Trims
// surrounding whitespace, lowercases (so the same address can't slip in under
// different casing — dedupes leads/newsletter/users), validates format, and
// caps length at 254 (the RFC 5321 maximum) to prevent oversized-input abuse.
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
