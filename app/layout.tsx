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
import NextTopLoader from "nextjs-toploader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { CountdownBanner } from "@/components/CountdownBanner";
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
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});
const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});
const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
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
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
};

// In Next.js, theme-color belongs in a separate `viewport` export, not in
// `metadata` (it was moved out of metadata to avoid blocking dynamic rendering).
export const viewport: Viewport = {
  themeColor: "#5C1A24",
};

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
  return (
    <html lang="en">
      {/* Google Tag Manager — lets the owner inject any checkout/conversion
          scripts (Meta Pixel, Google Ads, etc.) from the GTM dashboard without
          code. Set NEXT_PUBLIC_GTM_ID in Vercel to activate. */}
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      {/* Owner theme overrides — colours + font pairing. Rendered only when the
          owner has customized something; otherwise this is empty and the site
          uses the defaults from globals.css. Values are sanitized in
          lib/queries/theme.ts so this inlined CSS is always safe. */}
      {themeOverrideCss && (
        <style id="theme-overrides" dangerouslySetInnerHTML={{ __html: themeOverrideCss }} />
      )}
      <body
        className={`${fontVariables} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        {/* Resource hints — warm up the image CDN connection for a faster LCP.
            No crossOrigin: <img> requests to Cloudinary aren't CORS, so a plain
            preconnect is what gets reused. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <CountdownBanner />
        <NextTopLoader color="#B76E79" height={3} showSpinner={false} crawl={true} />
        <ScrollReveal />
        <ScrollProgressBar />
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
