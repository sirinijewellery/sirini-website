// ── Major Indian cities (metros + tier-1/tier-2 across all states/UTs) ──────────
// Sorted alphabetically, deduped. Used to power the city autocomplete + fuzzy
// autocorrect in the checkout & address forms. Cities are MANY, so the matcher
// is lenient: it only snaps obvious typos to a close match and otherwise leaves
// the user's free-text input untouched.

const RAW_CITIES: string[] = [
  "Agartala",
  "Agra",
  "Ahmedabad",
  "Ahmednagar",
  "Aizawl",
  "Ajmer",
  "Akola",
  "Aligarh",
  "Allahabad",
  "Alwar",
  "Ambala",
  "Amravati",
  "Amritsar",
  "Anand",
  "Anantapur",
  "Asansol",
  "Aurangabad",
  "Bareilly",
  "Bathinda",
  "Belgaum",
  "Bellary",
  "Bengaluru",
  "Bhagalpur",
  "Bharuch",
  "Bhavnagar",
  "Bhilai",
  "Bhilwara",
  "Bhiwandi",
  "Bhopal",
  "Bhubaneswar",
  "Bikaner",
  "Bilaspur",
  "Bokaro",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Cuttack",
  "Darbhanga",
  "Davanagere",
  "Dehradun",
  "Delhi",
  "Dhanbad",
  "Dharwad",
  "Dibrugarh",
  "Dindigul",
  "Durgapur",
  "Erode",
  "Faridabad",
  "Firozabad",
  "Gandhinagar",
  "Gaya",
  "Ghaziabad",
  "Gorakhpur",
  "Greater Noida",
  "Gulbarga",
  "Guntur",
  "Gurgaon",
  "Guwahati",
  "Gwalior",
  "Haldwani",
  "Haridwar",
  "Hisar",
  "Hubli",
  "Hyderabad",
  "Imphal",
  "Indore",
  "Itanagar",
  "Jabalpur",
  "Jaipur",
  "Jalandhar",
  "Jalgaon",
  "Jammu",
  "Jamnagar",
  "Jamshedpur",
  "Jhansi",
  "Jodhpur",
  "Jorhat",
  "Junagadh",
  "Kakinada",
  "Kalyan",
  "Kanchipuram",
  "Kannur",
  "Kanpur",
  "Karimnagar",
  "Karnal",
  "Kochi",
  "Kohima",
  "Kolhapur",
  "Kolkata",
  "Kollam",
  "Kota",
  "Kottayam",
  "Kozhikode",
  "Kurnool",
  "Latur",
  "Loni",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Malappuram",
  "Mangaluru",
  "Mathura",
  "Meerut",
  "Mehsana",
  "Moradabad",
  "Mumbai",
  "Muzaffarnagar",
  "Muzaffarpur",
  "Mysuru",
  "Nagercoil",
  "Nagpur",
  "Nanded",
  "Nashik",
  "Navi Mumbai",
  "Nellore",
  "Nizamabad",
  "Noida",
  "Palakkad",
  "Panaji",
  "Panipat",
  "Panvel",
  "Patiala",
  "Patna",
  "Pimpri-Chinchwad",
  "Pondicherry",
  "Port Blair",
  "Prayagraj",
  "Pune",
  "Raipur",
  "Rajahmundry",
  "Rajkot",
  "Ranchi",
  "Ratlam",
  "Rewa",
  "Rohtak",
  "Rourkela",
  "Saharanpur",
  "Salem",
  "Sangli",
  "Satara",
  "Secunderabad",
  "Shillong",
  "Shimla",
  "Sikar",
  "Siliguri",
  "Solapur",
  "Sonipat",
  "Srinagar",
  "Surat",
  "Thane",
  "Thanjavur",
  "Thiruvananthapuram",
  "Thoothukudi",
  "Thrissur",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupati",
  "Tirupur",
  "Tumkur",
  "Udaipur",
  "Udupi",
  "Ujjain",
  "Vadodara",
  "Valsad",
  "Vapi",
  "Varanasi",
  "Vasai-Virar",
  "Vellore",
  "Vijayawada",
  "Visakhapatnam",
  "Warangal",
];

// Dedupe (case-insensitive) and sort alphabetically.
export const INDIAN_CITIES: string[] = Array.from(
  new Map(RAW_CITIES.map((c) => [c.toLowerCase(), c])).values()
).sort((a, b) => a.localeCompare(b));

// ── Levenshtein distance ────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// ── closestCity ──────────────────────────────────────────────────────────────────
// Case-insensitive exact match first; then the nearest city within a small
// Levenshtein threshold (scaled to the input length). Returns null if nothing
// close — callers should then keep the user's typed value (cities are lenient).

export function closestCity(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const lower = trimmed.toLowerCase();

  // 1. Exact (case-insensitive) match.
  const exact = INDIAN_CITIES.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;

  // 2. Closest by edit distance, within a small threshold.
  //    Shorter words get a tighter threshold to avoid wrong snaps.
  const threshold = lower.length <= 4 ? 1 : lower.length <= 7 ? 2 : 3;

  let best: string | null = null;
  let bestDist = Infinity;
  for (const city of INDIAN_CITIES) {
    const dist = levenshtein(lower, city.toLowerCase());
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }

  return best !== null && bestDist <= threshold ? best : null;
}
