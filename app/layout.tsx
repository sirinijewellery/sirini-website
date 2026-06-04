import { EB_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";
import { WhatsAppWrapper } from "@/components/WhatsAppWrapper";
import { GoogleAnalytics } from "@next/third-parties/google";
import { baseMetadata } from "@/lib/seo";
import { WebSiteJsonLd } from "@/components/WebSiteJsonLd";
import { CartDrawer } from "@/components/CartDrawer";
import NextTopLoader from "nextjs-toploader";
import { MobileBottomNav } from "@/components/MobileBottomNav";

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
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ebGaramond.variable} ${dmSans.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <NextTopLoader color="#B76E79" height={3} showSpinner={false} crawl={true} />
        <WebSiteJsonLd />
        <AuthProvider>
          <NavbarWrapper />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <FooterWrapper />
          <WhatsAppWrapper />
          <Toaster />
          <CartDrawer />
          <MobileBottomNav />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
