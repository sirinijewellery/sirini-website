---
name: jewelry-lead-gen
description: Use when asked to build or re-run a B2B lead list of IMITATION/fashion jewelry retail/wholesale businesses (e.g. "find leads in <region>", "run the lead-gen pipeline", "get me jewelry business contacts in X"). Scope is imitation/artificial/costume jewelry ONLY — real gold/diamond/precious-metal jewelers are explicitly excluded. Combines Apify (Google Maps), Vibe Prospecting, Clay, and Apollo into one Name/Location/Mobile No/Email spreadsheet — **XLSX ONLY, never CSV** — in D:\Owner\Desktop\Claude\LeadGen\.
---

# Jewelry lead-gen pipeline

Produces one combined **xlsx** (never csv — see Output format below) of
**imitation/fashion jewelry** retail/wholesale businesses for a target
region, with columns **Name, Location, Mobile No, Email**. Adapted from a
workflow shared by a contact at Saloni Fashion Jewellery (SFJ): Apify → B2B
enrichment → Clay waterfall → Apollo. Apify was confirmed connected and
working as of the third run (2026-07-08) — see "Discovery + phone numbers
via Apify" below, now the primary source for both.

## Output format: XLSX only, never CSV

The owner explicitly said "I only want Excel sheets from now, no more
CSVs" (2026-07-08). Any intermediate CSV (from Vibe Prospecting exports,
PowerShell `Export-Csv` before the Excel COM conversion, etc.) is a scratch
file only — write it to the scratchpad temp directory, convert to `.xlsx`,
and delete or never place a `.csv` in `D:\Owner\Desktop\Claude\LeadGen\`. If a
prior run left a `.csv` there, remove it when you next touch that folder.

## Scope: imitation jewelry ONLY — real/fine jewelers are out of scope

The owner explicitly wants imitation/artificial/costume/fashion jewelry
businesses, not real gold/diamond/precious-metal jewelers. **There is no
clean category filter for this** — neither `linkedin_category` nor
`naics_category` autocomplete returns anything more specific than "luxury
goods & jewelry" / "fashion accessories manufacturing" / "apparel & fashion"
for queries like "imitation jewelry" or "costume jewelry" (checked
2026-07-08), and those categories are dominated by real/fine jewelers and
unrelated fashion businesses respectively. Treat this as a **mandatory
post-fetch text classification step**, not a filter parameter:

1. Fetch broadly using `linkedin_category` values `["retail luxury goods and
   jewelry", "wholesale luxury goods and jewelry", "fashion accessories
   manufacturing"]` plus the region filter (this necessarily over-includes
   real jewelers — that's expected and corrected in step 2).
2. Classify each result from `business_name` + `business_business_description`
   (both available free in the exploration preview, before spending any
   credits):
   - **Keep** if it signals imitation/artificial/fashion jewelry: "imitation",
     "artificial jewellery", "fashion jewellery", "junk jewellery" (common
     Indian trade term), "costume jewellery", "oxidised jewellery",
     "danglers"/"junk jewelry" wholesalers, American Diamond (AD) jewellery,
     kundan/meenakari imitation work, or a description that never mentions
     precious metals/stones at all while clearly selling jewelry.
   - **Drop** if it signals fine/real jewelry: "gold", "diamond", "platinum",
     "22k"/"18k"/"916 hallmark", "gemstone", "precious metal", "BIS
     hallmark", "solitaire" — these are the Malabar Group / Bhima Jewels /
     Joyalukkas / Krishna Jewellers style of business from the first run of
     this pipeline (2026-07-08) and are explicitly OUT of scope now.
   - When a business's description is ambiguous or absent, check
     `business_naics`/`business_sic_code_description` as a secondary signal,
     but don't rely on NAICS alone — 4483/448310 covers both real and
     imitation jewelry stores.
3. Only run `businesses_reference_table`-scoped prospect/contact enrichment
   (steps 3-4 below) on the businesses that survive this filter — don't pay
   to enrich contacts for real-jewelry businesses you're about to discard.

## Inputs to confirm with the user before running

- **Region(s)** — company HQ location, ISO 3166-2 codes (e.g. `IN-KL` Kerala, `IN-TG` Telangana).
- **Business category** — imitation/fashion/costume jewelry only (see Scope
  above). Do not default back to general "jewelry retail/wholesale" — that
  was the pre-2026-07-08 scope and has been explicitly narrowed.
- **Batch size** — how many businesses to pull. Do NOT default to "all" —
  the category+region universe can be 10,000+ rows. Check current credit
  balances first (see Cost checks below) and size the batch to what's
  actually affordable, then confirm with the user.
- **Output folder** — default `D:\Owner\Desktop\Claude\LeadGen\<date>\`.

## Mobile numbers are a required field, not best-effort

The owner always needs mobile numbers — a 0% fill rate is a problem to
solve, not just a stat to report (see the first 2026-07-08 run, which
shipped 136 businesses with 0 mobile numbers across Vibe
Prospecting/Clay/Apollo). Always check for Apify tools via ToolSearch at
the start of a run — do not assume it's connected just because the owner
says so, and do not assume it's absent just because a prior run didn't have
it either (it was added mid-project on 2026-07-08's third run without
warning, appearing as `mcp__Apify__*` tools).

### Discovery + phone numbers via Apify (primary method, confirmed working 2026-07-08)

Use `compass/crawler-google-places` ("Google Maps Scraper", ~$0.004/place —
cheap enough not to worry about batch size). This is now the **primary**
source for both discovery and phone numbers, not just a phone-number
fallback:

- Call `search-actors` with keywords "Google Maps" if the exact actor name
  is ever needed again; `fetch-actor-details` for the full input schema.
- **Discovery**: `call-actor` with `searchStringsArray` set to imitation-
  specific search terms (`"imitation jewellery shop"`, `"fashion jewellery
  shop"`, `"artificial jewellery"` worked well), `locationQuery` set to ONE
  region per run (e.g. `"Kerala, India"`), `maxCrawledPlacesPerSearch`
  ~20/term. This is dramatically more precise than Vibe Prospecting's
  category-based fetch — searching Google Maps directly for imitation/
  fashion/artificial terms self-filters far better than the
  `linkedin_category` approach ever could, because Google's own search
  relevance does the imitation-vs-real filtering for you. Expect ~85-90% of
  results to already be on-scope; still skim titles for explicit
  "Gold and Diamonds" branding (real jewelers that matched anyway) and drop
  those, plus non-retail matches (colleges, generic craft stores) and
  obvious out-of-region results.
- Base place data (no add-ons needed) already includes `phone`,
  `phoneUnformatted`, `address`, `city`, `state`, `categoryName`, `website`
  — no need to enable the paid "Company contacts enrichment" or "Business
  leads enrichment" add-ons for this use case.
- **Recognize regional imitation-jewelry terminology**: "Gold Covering" and
  "One Gram Gold" / "1 Gram Gold" in a business name are Indian trade terms
  for gold-*plated* imitation jewelry, not real gold — despite containing
  the word "gold," these are firmly in scope. "Fancy" (Kerala usage) also
  commonly means imitation/costume jewelry and accessories.
- **Targeted lookup for a specific business missing a phone**: put
  `"<business name> <city>"` as a `searchStringsArray` entry with
  `locationQuery: "India"` and `maxCrawledPlacesPerSearch: 1`. This is
  hit-or-miss — Google Maps may return a same-named-but-different business,
  or the actual right business under its parent company's name (e.g. a
  brand's flagship showroom). **Verify the returned `title` and `website`
  plausibly match before using the phone** — a wrong-business phone number
  is worse than a blank cell. Discard clear mismatches (e.g. a "car
  accessories store" returned for a jewelry brand search).
- Get run status/results via `get-actor-run` and `get-dataset-items`
  (project only the fields needed — `title,phone,address,city,state,
  categoryName,website` — the full schema has 80+ fields and will blow out
  context otherwise).

### Target only experienced, successful businesses

The owner wants leads on businesses with a track record, not brand-new or
unproven shops. Apply both of these together (rating alone isn't enough —
a 2-week-old shop can rack up five 5-star reviews from friends and family):

- Pass `placeMinimumStars: "four"` (4.0+) in the `call-actor` input. This
  also has the side effect of skipping places with zero reviews entirely
  (per the actor's own field description), so it's doing double duty.
  Small added cost (~$0.001/place, "Filter applied" add-on) — negligible.
- Also project `reviewsCount` and `totalScore` in `get-dataset-items`
  (`fields=title,phone,address,city,state,categoryName,website,reviewsCount,totalScore`)
  and additionally require `reviewsCount >= 15` when classifying — a
  handful of 5-star reviews isn't the same as an established customer base.
  Drop anything below that threshold even if the star filter let it
  through.
- A business with multiple branches/locations in the results (e.g. a chain
  like Kushal's Fashion Jewellery, which showed up 8 times across
  different Hyderabad neighborhoods on 2026-07-08) is a strong positive
  signal of being established — don't dedupe these branches away, each is
  a legitimately separate outreach target, but it's a useful mental check
  that the "experienced/successful" bar is being applied sensibly.
- This filter is now part of the mandatory classification pass alongside
  the imitation-vs-real check — a business must pass BOTH (imitation-scope
  AND experienced/successful) to make the final list.

### Fallback: Claude-in-Chrome (for businesses Apify's API search can't resolve)

Apify's targeted name+city lookup is API-driven and picks Google's single
best-guess match — it has no way to show you the list of candidates when a
name is ambiguous or the business has weak SEO, which is exactly why
lookups for rhine accessories / Made For Her Jewellery / Elegante Jewelz
returned wrong businesses on 2026-07-08. When a business still has no
Mobile No after the Apify pass, use Claude-in-Chrome for a live, visual
lookup instead of guessing from a single API result:

1. Load the core browser tools once per session if not already loaded:
   `ToolSearch` with `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__find,mcp__claude-in-chrome__get_page_text`.
2. Navigate to `https://www.google.com/maps/search/<business+name>+<city>`.
3. Read the page (snapshot/get_page_text) and look at the actual list of
   candidate results — unlike the Apify single-match lookup, you can see
   multiple listings and pick the one whose name/locality/website actually
   matches the business you're trying to enrich.
4. Click into the matching listing and read its phone number directly from
   the info panel. If Maps has no phone but the listing links to a website
   or Instagram, navigate there and check the contact/footer/bio for a
   number as a secondary check.
5. If no plausible listing exists at all (the business may be online-only,
   like rhine accessories), leave Mobile No blank rather than attach an
   unrelated business's number — a wrong number is worse than none.
6. This is inherently a live, visual, one-at-a-time method — use it for the
   handful of stragglers left after the Apify batch pass, not as the
   primary discovery method (Apify is faster and cheaper for bulk).
7. **Unattended/scheduled runs**: browser control tools may not be available
   in a headless scheduled-task context. Check availability first; if
   absent, skip this fallback and report the remaining blanks rather than
   failing the run.

### Fallback: Apollo organization enrichment

If Apify isn't connected, Apollo's `apollo_organizations_enrich` can pull a
corporate phone number using `lead_credit` (separate from `direct_dial_credit`,
which governs personal-mobile reveal and doesn't affect this call). Confirmed
6 of 11 hit rate on 2026-07-08's second run — a real improvement over 0%,
but Apify's Google Maps data has since proven both higher-yield and more
directly a phone Google actually shows the public (matches the original ask
better than a B2B database's corporate line).

## Cost checks (do this before spending anything)

- Vibe Prospecting: there's no direct "check my balance" tool. Call
  `estimate-cost` (or read `enough_credits_to_export` on any fetch/enrich
  response) to probe whether a given batch size is affordable *before*
  committing to it. `fetch-entities` exploration/preview and
  `enrich-*` masked previews are free; `show-sample` (flat 5 credits/table)
  and `export-to-csv` are what actually charge.
- Apollo: call `apollo_usage_stats_credit_usage_stats` first. Org/people
  search and enrichment draw from `lead_credit`; phone reveal
  (`reveal_phone_number`) draws from `direct_dial_credit` — if that bucket
  is at 0, don't attempt phone reveal, it will just fail.
- Apollo's tool descriptions carry their own mandatory per-call consent
  language ("Do NOT call this endpoint without explicit user approval").
  Honor that even if the user has given blanket approval for the overall
  task — do one consolidated confirmation covering the total batch/credit
  count, not per-row.

## Pipeline

1. **Autocomplete the category** (Vibe Prospecting `autocomplete`,
   `field: linkedin_category`). For imitation jewelry there is no specific
   label to find (see Scope section above) — use the broad set
   `["retail luxury goods and jewelry", "wholesale luxury goods and jewelry",
   "fashion accessories manufacturing"]` and rely on the mandatory text
   classification step to narrow it down, rather than trying to find a
   more specific category value.

2. **Discovery** — `fetch-entities` with `entity_type: businesses`,
   filtered by `linkedin_category` + `company_region_country_code` (region
   codes only — do NOT also pass `company_country_code`, they're mutually
   exclusive and the tool errors). This is free (masked preview). Note
   `database_total` to see the full matching universe before committing to
   a batch size.

3. **Decision-maker contacts** — `fetch-entities` again with
   `entity_type: prospects`, `businesses_reference_table` set to the
   businesses table from step 2, `job_level` filtered to
   owner/founder/c-suite/director/manager, `max_per_company: 1`. Expect a
   low match rate (a fraction of businesses will have an indexed
   decision-maker) — this is normal for smaller regional businesses, not a
   bug.

4. **Reveal contact details** — `enrich-prospects` with
   `enrich-prospects-contacts`, `contact_types: ["email"]` (mobile phone via
   this connector is usually null for small Indian businesses — check a
   preview before paying for `["email","phone"]` both, it roughly doubles
   cost for data that often isn't there). Size the table down (re-fetch with
   a smaller `number_of_results`) if `enough_credits_to_export` comes back
   false.

5. **Export** — `export-to-csv` on the enriched prospects table, and
   separately on the plain businesses table (use `limit` to cap it within
   remaining credits). Download both `_full_download_url` links with
   `curl -sL <url> -o file.csv`.

6. **Clay gap-fill (optional, for businesses with no matched prospect)** —
   pick a handful of domains not already covered, call
   `find-and-enrich-contacts-at-company` with `contactFilters.job_title_keywords`
   (owner/founder/director/manager) and `dataPoints.contactDataPoints: [{type: "Email"}]`
   only (never add data points the user didn't ask for). Then
   `get-task-context` with the returned `taskId` to pull the actual email
   value — the initial response never has enrichment values inline. Expect
   a low hit rate; this is a bonus pass, not the primary source.

7. **Apollo (optional)** — only if direct_dial_credit > 0 and the user has
   re-confirmed a batch/credit count for this run. `apollo_organizations_enrich`
   can add a corporate phone number without needing direct-dial credits;
   `apollo_people_match` + `reveal_phone_number` does need direct-dial
   credits for a personal mobile.

8. **Merge** — dedupe by `business_domain` when present; otherwise by
   **lowercased business name + digits-only phone** (Apify Google Maps rows
   usually have no domain, so name+phone is the effective key for them —
   the same key the daily scheduled run uses; keep them identical). Do NOT
   dedupe away same-name chain branches at different addresses (see "Target
   only experienced" above — each branch is a separate outreach target).
   Contact-enriched rows win over plain business rows. Build exactly 4 columns: `Name` (business name),
   `Location` (`City, Region` title-cased), `Mobile No`, `Email`. Write CSV
   with PowerShell `Export-Csv`, then convert to `.xlsx` via Excel COM
   automation:
   ```powershell
   $excel = New-Object -ComObject Excel.Application
   $excel.Visible = $false; $excel.DisplayAlerts = $false
   $wb = $excel.Workbooks.Open($csvPath)
   $wb.Sheets.Item(1).UsedRange.Rows.Item(1).Font.Bold = $true
   $wb.SaveAs($xlsxPath, 51)
   $wb.Close($false); $excel.Quit()
   ```

9. **Report honestly** — state the real fill rate for Mobile No and Email
   (it is often low for smaller regional businesses — don't imply otherwise).
   Mention which of the 3 connectors were actually used and what each
   contributed.

## Unattended/scheduled runs (canonical rules — the daily task defers here)

A scheduled task (`daily-jewelry-leadgen`, daily 9 AM, Kerala + Telangana)
runs this pipeline with no user present. Its prompt summarizes this skill;
**this section is the source of truth** for what changes when unattended:

- **Never run consent-gated steps unattended.** Apollo tools and Vibe
  Prospecting exports/enrichment carry per-call user-confirmation
  requirements — skip them entirely rather than self-approving. Clay
  email-only gap-fill is fine (no live-confirmation requirement).
- **Batch size is fixed by the task prompt** (search terms ×
  `maxCrawledPlacesPerSearch` ~20), not confirmed interactively. Apify at
  ~$0.004/place is the only spend.
- **Dedupe against ALL prior output** before writing: read every `.xlsx`
  under `D:\Owner\Desktop\Claude\LeadGen\**\` recursively and build a
  seen-set keyed by lowercased name + digits-only phone. Only never-seen
  businesses count as "new".
- **Two outputs every run**: a dated
  `<YYYY-MM-DD>\new_jewelry_leads_<date>.xlsx` (new rows only) and an
  append-merge into the cumulative `master_jewelry_leads.xlsx`.
- **Zero new leads is a valid outcome** (market coverage saturates) —
  report it, don't treat it as failure.
- **Browser-based fallbacks may be unavailable headless** — check tool
  availability first; leave blanks rather than fail or guess.
- **Never touch git** in a scheduled run.

If the scheduled task's prompt and this section ever disagree, fix the
prompt (`C:\Users\Owner\.claude\scheduled-tasks\daily-jewelry-leadgen\SKILL.md`)
to match this skill, not the other way around.

## Known gaps in this pipeline (as of the third run, 2026-07-08)

- Clay's contact data points do not include phone at all (`Email`,
  `Summarize Work History`, `Find Thought Leadership` only) — Clay cannot
  fill Mobile No, only Email. Use it for email gap-fill only.
- Email fill rate remains low (2/116 in the third run) — Apify's Google
  Maps data doesn't include email, and Vibe Prospecting/Clay's LinkedIn-based
  contact matching has a low hit rate for small regional businesses. This
  is the next gap to close if the owner asks for better email coverage.
- Scope was narrowed to imitation/fashion jewelry only on 2026-07-08 (after
  the first run targeted general jewelry retail/wholesale and returned real
  gold/diamond jewelers like Malabar Group and Bhima Jewels). Any list built
  before that date mixes both and should not be treated as imitation-only.
- Mobile number coverage went 0% (run 1, Vibe Prospecting/Clay/Apollo only)
  → 43% (run 2, added Apollo org enrichment) → 86% (run 3, Apify Google Maps
  as primary source). Google Maps search-based discovery is now the
  preferred method for this pipeline, not just its phone-number step.
