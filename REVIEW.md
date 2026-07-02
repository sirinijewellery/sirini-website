# Sirini Jewellery — Security & Code Review

## How to run

Start a new Claude Code session with **Fable 5** model and paste the prompt below.

---

## Prompt

```
You are reviewing the Sirini Jewellery ecommerce codebase at D:\Owner\Desktop\Sirini_Website.

Read HANDOFF.md and AGENTS.md first — they contain critical context about the stack
(Next.js 16, Prisma 7/Neon, Tailwind v4, NextAuth v5, Cloudinary, Razorpay).

Perform a thorough security review AND code quality review. Write your findings to
REVIEW-FINDINGS.md in the project root when done.

## Security Review

Check every item below. For each finding, note: file path, line number, severity
(critical/high/medium/low), description, and recommended fix.

### Authentication & Authorization
- Every route under /api/admin/* MUST check `auth()` and `isAdmin`. Find any that don't.
- Check auth.ts / NextAuth configuration for session security issues.
- Check that admin page guards in app/admin/* layouts redirect properly.
- Look for routes that accept user IDs or product IDs without ownership validation.

### Input Validation
- Check all API routes for missing input validation/sanitization.
- Look for raw SQL queries (should be none with Prisma, but verify).
- Check file upload endpoint (api/admin/products/upload) for:
  - File type validation
  - File size limits
  - Path traversal
  - Filename sanitization

### XSS / Injection
- Check every use of dangerouslySetInnerHTML — is the content sanitized?
- Check CMS content (blog, about, FAQ, etc.) rendered on the storefront.
- Check URL params used in page rendering (search, category, etc.).
- Check any user-generated content (reviews, names) rendered without escaping.

### Data Exposure
- Run: grep -r "RAZORPAY\|DATABASE_URL\|NEXTAUTH_SECRET\|API_KEY" --include="*.ts" --include="*.tsx" -l
  Ensure no secrets leak into client bundles ("use client" files must not import env vars).
- Check that server-only modules aren't accidentally importable from client components.
- Check API responses for over-exposure of data (e.g., returning full user objects).

### Dependencies
- Run `npm audit` and report high/critical vulnerabilities.
- Check for outdated dependencies with known CVEs.

### CSRF / Rate Limiting
- Check mutation endpoints for CSRF protection.
- Note which public endpoints lack rate limiting (forms, auth, API).

### Razorpay Integration
- Check payment flow for amount tampering vulnerabilities.
- Verify webhook signature validation.
- Check that computeTotals() is used server-side before creating orders.

### Cloudinary
- Check that upload endpoints validate file types.
- Check for SSRF via image URL parameters.

## Code Quality Review

### Architecture
- Look for circular imports or dependency violations.
- Check for "use client" components that import server-only modules.
- Verify ISR pages produce deterministic output (no Date.now(), Math.random()).

### Error Handling
- Check API routes return proper status codes and don't leak stack traces.
- Check for unhandled promise rejections in server components.

### Performance
- Look for N+1 query patterns in server components.
- Check for unnecessary client-side JavaScript (large "use client" boundaries).
- Check image optimization (Cloudinary loader usage, proper sizing).

### Type Safety
- Run `npx tsc --noEmit` and report any errors.
- Look for `any` types that could mask bugs.

## Output Format

Write REVIEW-FINDINGS.md with:

1. **Executive Summary** — overall security posture, top 3 concerns
2. **Critical/High Findings** — each with file, line, description, fix
3. **Medium/Low Findings** — grouped by category
4. **Code Quality Issues** — architecture, performance, type safety
5. **Positive Observations** — things done well
6. **Recommended Actions** — prioritized next steps

Be specific. Include file paths and line numbers. Don't report theoretical issues
that don't apply to this codebase. Focus on real, exploitable vulnerabilities and
concrete code quality improvements.
```

---

## Notes

- This review is read-only — it should NOT modify any code, only write REVIEW-FINDINGS.md.
- Run with Fable 5 for the deepest analysis.
- After the review, bring findings back to the main session to discuss and fix.
