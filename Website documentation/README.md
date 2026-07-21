# Sirini Jewellery — Website Documentation

Complete reference for the Sirini Jewellery ecommerce site: what it is, how it
was built, every feature it has, and the rules that keep it consistent.

**Two audiences:**

1. **Anyone working on this site** — read `03-architecture.md` first, then the
   file for the area you're touching.
2. **A brand-new jewellery ecommerce project** — hand this whole folder to an AI
   agent (or a developer) along with the new brand's details. Start with
   `12-new-project-blueprint.md`; it is written as a build spec, not a history.

---

## The files

| # | File | What's inside |
|---|------|---------------|
| 01 | [The Plan & Working Philosophy](01-plan-and-philosophy.md) | Why the site was built this way. The five build phases. The non-negotiable rules (the "golden rule", deploy-and-verify, evidence-before-claims). |
| 02 | [What Changed](02-what-changed.md) | The full evolution of the site, grouped by theme — what was built, in what order, and what problem each wave solved. |
| 03 | [Architecture](03-architecture.md) | Tech stack, folder layout, routing, rendering strategy (ISR/SSR/client), data flow, auth model. |
| 04 | [Site Map & Sections](04-site-map-and-sections.md) | Every public page, every homepage section, every shared component and what it does. |
| 05 | [Design System](05-design-system.md) | The full colour palette with hex values, typography scale, spacing, and the complete motion/animation library. |
| 06 | [Admin Panel](06-admin-panel.md) | Every admin screen and every setting the owner can change without a developer. |
| 07 | [Feature Catalogue](07-features-catalogue.md) | Exhaustive feature list — storefront, commerce, content, SEO, growth, ops. |
| 08 | [Data Model](08-data-model.md) | Every database table, field, and relationship, with the reasoning behind each. |
| 09 | [API Reference](09-api-reference.md) | All 44 API routes: method, purpose, auth, rate limits, validation. |
| 10 | [Integrations & Environment](10-integrations-and-env.md) | Cloudinary, Razorpay, Resend, Google Analytics/GTM, Vercel. Every env var. |
| 11 | [Security & Performance](11-security-and-performance.md) | Security posture, threat decisions, cost controls, performance work and why. |
| 12 | [New Project Blueprint](12-new-project-blueprint.md) | **The reusable spec.** Everything a jewellery ecommerce site must have, ordered as a build plan, brand-agnostic. |
| 13 | [Runbook](13-runbook.md) | Practical procedures: run locally, ship, roll back, add a setting/section/field, troubleshooting table, emergency steps, maintenance schedule. |

---

## Fast facts

| | |
|---|---|
| **Brand** | Sirini Jewellery — handcrafted Kundan, Meenakari & gold-plated fashion jewellery |
| **Founded** | Mumbai, 2017. Founder: Nishit Savla |
| **Live site** | https://sirinijewellery.com |
| **Stack** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7 · PostgreSQL |
| **Hosting** | Vercel (push to `main` → auto-build → live in ~2–3 min) |
| **Payments** | Razorpay (online) + Cash on Delivery |
| **Images** | Cloudinary CDN, via a custom `next/image` loader |
| **Email** | Resend |
| **Auth** | NextAuth v5 (credentials), JWT sessions |
| **Built by** | Jihaan Savla — jihaan.savla@gmail.com · +91 90040 73041 |

---

## How to use this folder for a new project

Drop this entire folder into the new project's repo (or just into the
conversation) and say something like:

> Here is the full documentation of a jewellery ecommerce site I already run.
> Build me the same class of site for **[new brand name]**, using
> `12-new-project-blueprint.md` as the requirements spec. The brand details are:
> [name, colours, product categories, contact info, payment provider].
> Follow the conventions in `01-plan-and-philosophy.md`.

The blueprint file is deliberately brand-free — it describes *what every
jewellery ecommerce site of this class needs*, not Sirini's specific copy. The
other files are the worked example that proves each requirement is real.

---

*Last updated: 2026-07-21*
