import { EB_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";
import { WhatsAppWrapper } from "@/components/WhatsAppWrapper";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { baseMetadata } from "@/lib/seo";
import { WebSiteJsonLd } from "@/components/WebSiteJsonLd";
import { CartDrawer } from "@/components/CartDrawer";
import { AbandonedCartNudge } from "@/components/AbandonedCartNudge";
import NextTopLoader from "nextjs-toploader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CountdownBanner } from "@/components/CountdownBanner";
import { LocalBusinessJsonLd } from "@/components/LocalBusinessJsonLd";
import { ShippingLocationBar } from "@/components/ShippingLocationBar";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Google Tag Manager — lets the owner inject any checkout/conversion
          scripts (Meta Pixel, Google Ads, etc.) from the GTM dashboard without
          code. Set NEXT_PUBLIC_GTM_ID in Vercel to activate. */}
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <body
        className={`${ebGaramond.variable} ${dmSans.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <ShippingLocationBar />
        <CountdownBanner />
        <NextTopLoader color="#B76E79" height={3} showSpinner={false} crawl={true} />
        <ScrollReveal />
        <WebSiteJsonLd />
        <LocalBusinessJsonLd />
        <AuthProvider>
          <NavbarWrapper />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <FooterWrapper />
          <WhatsAppWrapper />
          <Toaster />
          <CartDrawer />
          <AbandonedCartNudge />
          <MobileBottomNav />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
