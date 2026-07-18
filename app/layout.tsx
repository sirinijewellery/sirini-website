import {
  EB_Garamond,
  DM_Sans,
  Playfair_Display,
  Inter,
  Cormorant_Garamond,
  Jost,
  Fraunces,
  Nunito_Sans,
  Marcellus,
  Poppins,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";
import { WhatsAppWrapper } from "@/components/WhatsAppWrapper";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { baseMetadata } from "@/lib/seo";
import { getRibbonMessages, getBusinessDetails } from "@/lib/queries/site";
import { getThemeSettings, buildThemeOverrideCss } from "@/lib/queries/theme";
import { WebSiteJsonLd } from "@/components/WebSiteJsonLd";
import { CartDrawer } from "@/components/CartDrawer";
import { AbandonedCartNudge } from "@/components/AbandonedCartNudge";
import { LeadCapturePopup } from "@/components/LeadCapturePopup";
import NextTopLoader from "nextjs-toploader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { BrandedLoader } from "@/components/BrandedLoader";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { LocalBusinessJsonLd } from "@/components/LocalBusinessJsonLd";
import type { Viewport } from "next";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// ── Owner-selectable font pairings (Theme settings) ─────────────────────────
// next/font requires build-time declaration, so the whole curated set is
// pre-registered here. Each font exposes its own CSS variable; ALL of them are
// attached to <body> so the files load. lib/queries/theme.ts then injects a
// :root override remapping --font-eb-garamond / --font-dm-sans to the chosen
// pairing's variables. The default pairing emits no override → identical look.
// Keys/variable names here MUST match THEME_FONT_PAIRINGS in lib/queries/theme.ts.
// preload: false on every non-default pairing below — next/font defaults to
// preload:true, which would <link rel="preload"> ALL 10 font families on
// every page load even though only one pairing renders at a time (owner
// picks it in Theme settings). Only the shipped default (EB Garamond + DM
// Sans, just above) needs eager preload; the rest still work identically
// when selected, just fetched on-demand instead of upfront.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: false,
});
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const fontVariables = [
  ebGaramond.variable,
  dmSans.variable,
  playfair.variable,
  inter.variable,
  cormorant.variable,
  jost.variable,
  fraunces.variable,
  nunito.variable,
  marcellus.variable,
  poppins.variable,
].join(" ");

export const metadata = {
  ...baseMetadata(),
  // Icons are provided by the file-convention files in /app:
  //   app/icon.png (512²), app/apple-icon.png (180²), app/favicon.ico (32²)
  // These are square + branded so Google/Chrome render the Sirini mark.
  verification: {
    // Google Search Console verification token. An env var override wins if set;
    // the fallback is the verified token for https://sirinijewellery.com.
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ??
      "HyECf3SM6I_ej62Z0q4HiDZqaC7mkQAZ3BpKQw-o70w",
  },
};

// In Next.js, theme-color belongs in a separate `viewport` export, not in
// `metadata` (it was moved out of metadata to avoid blocking dynamic rendering).
export const viewport: Viewport = {
  themeColor: "#5C1A24",
};

// First-load splash dismissal. Runs inline so it works before hydration.
// Hides the splash the moment the document is parsed (DOMContentLoaded ≈
// HTML + render-blocking CSS done — the window where the page would
// otherwise look blank/unstyled), with a 6s failsafe.
//
// HYDRATION-SAFETY (learned the hard way): this script must NOT touch any
// React-managed DOM — removing/mutating the splash div before hydration
// causes a silent client re-render in production that re-inserts the splash
// WITHOUT re-running this script, leaving it permanently covering the page.
// Instead it only toggles a class on <html> (same pattern next-themes uses;
// React never reconciles documentElement classes) and CSS does the hiding:
// see `html.sirini-splash-done #sirini-splash` in globals.css.
// NOTE: if a CSP is ever added (see next.config.ts), this inline script needs
// a nonce or hash.
const SPLASH_SCRIPT = `(function(){var done=false;var hide=function(){if(done)return;done=true;document.documentElement.classList.add("sirini-splash-done")};if(document.readyState!=="loading"){hide()}else{document.addEventListener("DOMContentLoaded",hide);setTimeout(hide,6000)}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [ribbonMessages, business, themeSettings] = await Promise.all([
    getRibbonMessages(),
    getBusinessDetails(),
    getThemeSettings(),
  ]);
  // Owner theme overrides. Empty string when nothing is customized → no style
  // content emitted → the site renders byte-for-byte identical to its defaults.
  const themeOverrideCss = buildThemeOverrideCss(themeSettings);
  // suppressHydrationWarning on <html>: the splash-dismissal inline script
  // adds a class to <html> before hydration (hydration-safe by design) —
  // this stops React dev-mode from flagging that expected difference.
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Owner theme overrides — colours + font pairing. Rendered only when the
          owner has customized something; otherwise this is empty and the site
          uses the defaults from globals.css. Values are sanitized in
          lib/queries/theme.ts so this inlined CSS is always safe. */}
      {themeOverrideCss && (
        <head>
          <style dangerouslySetInnerHTML={{ __html: themeOverrideCss }} />
        </head>
      )}
      {/* Google Tag Manager — lets the owner inject any checkout/conversion
          scripts (Meta Pixel, Google Ads, etc.) from the GTM dashboard without
          code. Set NEXT_PUBLIC_GTM_ID in Vercel to activate. */}
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <body
        className={`${fontVariables} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        {/* First-load splash — branded loading moment for slow INITIAL loads
            (loading.tsx only covers route transitions, not the first visit).
            Server-rendered so it paints straight from the HTML before any JS.
            Invisible for the first 800ms (`.splash-fade-in`), so fast loads
            never see it; slow connections get the logo instead of a
            half-styled page. Dismissed by the inline script on
            DOMContentLoaded. aria-hidden: decorative — AT users get the page
            content as it streams, with no phantom "loading" announcements. */}
        <div
          id="sirini-splash"
          aria-hidden="true"
          className="splash-fade-in fixed inset-0 z-[9990] flex flex-col items-center justify-center gap-6 bg-background"
        >
          <BrandedLoader />
        </div>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
        {/* Resource hints — warm up the image CDN connection for a faster LCP.
            No crossOrigin: <img> requests to Cloudinary aren't CORS, so a plain
            preconnect is what gets reused. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <NextTopLoader color="#B76E79" height={3} showSpinner={false} crawl={true} />
        <ScrollReveal />
        <ScrollProgressBar />
        {/* Ambient gold edge-warmth that deepens as the page scrolls (CSS scroll-timeline) */}
        <div className="scroll-warmth" aria-hidden="true" />
        <WebSiteJsonLd />
        <LocalBusinessJsonLd />
        <AuthProvider>
          <NavbarWrapper messages={ribbonMessages} />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <FooterWrapper business={business} />
          <WhatsAppWrapper whatsapp={business.whatsapp} />
          <Toaster />
          <CartDrawer />
          <AbandonedCartNudge />
          <LeadCapturePopup />
          <MobileBottomNav />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID} />
        )}
        <Analytics />
      </body>
    </html>
  );
}
