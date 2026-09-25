import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";
import { TableProvider } from "./context/TableContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import Footer from "./components/Footer";
// import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ClarityProvider } from "./providers/ClarityProvider";
import { MetaPixelProvider } from "./providers/MetaPixelProvider";
import dynamic from "next/dynamic";
import RestaurantStatusPopup from "./components/RestaurantStatusPopup";
import WhatsAppButton from "./components/WhatsAppButton";
import OrderSourceCapture from "./components/OrderSourceCapture";
import TableForm from "./components/TableForm";
import RestaurantJsonLd from "./components/RestaurantJsonLd";

const MaintenanceScreen = dynamic(() => import("./components/MaintenanceScreen"));

const IS_MAINTENANCE_MODE = false;

const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cafelittlekarachi.com'
).replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Title ──────────────────────────────────────────────────────────────────
  title: {
    default: "Little Karachi Express | Authentic Karachi Food & Fast Delivery",
    template: "%s | Little Karachi Express",
  },

  // ── Description ────────────────────────────────────────────────────────────
  description:
    "Order authentic Karachi Biryani, gourmet platters, Karahi, BBQ, and fast food online. Premium dine-in, takeaway, and express delivery across Karachi. Open daily from 6:30 PM.",

  // ── Keywords ───────────────────────────────────────────────────────────────
  keywords: [
    "Karachi Biryani",
    "White Biryani Karachi",
    "Little Karachi Express",
    "Cafe Little Karachi",
    "Karachi Food Delivery",
    "Online Food Ordering Karachi",
    "Handi Biryani Karachi",
    "Gourmet Platters Karachi",
    "Pakistani Food Delivery",
    "Dine In Karachi",
    "Late Night Food Karachi",
    "Karahi Delivery Karachi",
    "BBQ Restaurant Karachi",
    "Express Food Delivery Karachi",
  ],

  // ── Authors & Publisher ─────────────────────────────────────────────────────
  authors: [{ name: "Little Karachi Express", url: BASE_URL }],
  creator: "Little Karachi Express",
  publisher: "Little Karachi Express",

  // ── Canonical & Alternates ──────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-PK": BASE_URL,
    },
  },

  // ── OpenGraph ──────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_PK",
    alternateLocale: ["ur_PK"],
    url: BASE_URL,
    siteName: "Little Karachi Express",
    title: "Little Karachi Express | Authentic Karachi Food & Fast Delivery",
    description:
      "Order authentic Karachi Biryani, gourmet platters, Karahi, BBQ, and fast food online. Premium dine-in, takeaway, and express delivery across Karachi.",
    images: [
      {
        url: `${BASE_URL}/og-banner.jpg`,
        width: 1200,
        height: 630,
        alt: "Little Karachi Express — Authentic Karachi Food & Fast Delivery",
        type: "image/jpeg",
      },
      {
        url: `${BASE_URL}/hd-logo.webp`,
        width: 512,
        height: 512,
        alt: "Little Karachi Express Logo",
        type: "image/webp",
      },
    ],
  },

  // ── Twitter Card ───────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@LKExpressKarachi",
    creator: "@LKExpressKarachi",
    title: "Little Karachi Express | Authentic Karachi Food & Fast Delivery",
    description:
      "Order authentic Karachi Biryani, gourmet platters, Karahi, BBQ, and fast food online. Premium dine-in, takeaway, and express delivery across Karachi.",
    images: [`${BASE_URL}/og-banner.jpg`],
  },

  // ── Robots ─────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": 160,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  // ── Icons ──────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/hd-logo.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/hd-logo.ico",
    apple: [
      { url: "/hd-logo.ico" },
      { url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // ── Web App Manifest ───────────────────────────────────────────────────────
  manifest: "/manifest.webmanifest",

  // ── Verification ───────────────────────────────────────────────────────────
  // verification: {
  //   google: "YOUR_GOOGLE_SEARCH_CONSOLE_TOKEN",
  //   yandex: "YOUR_YANDEX_TOKEN",
  // },

  // ── Custom / Geo Meta Tags (via Next.js 'other') ────────────────────────────
  other: {
    // Geo-targeting for Karachi, Pakistan
    "geo.region": "PK-SD",
    "geo.placename": "Karachi, Sindh, Pakistan",
    "geo.position": "24.8607;67.0011",
    "ICBM": "24.8607, 67.0011",
    // Apple PWA
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "LK Express",
    // Mobile theme color (brand plum)
    "theme-color": "#741052",
    // Bing / Microsoft
    "msapplication-TileColor": "#741052",
    // Format detection
    "format-detection": "telephone=yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PK" suppressHydrationWarning>
      <head>
        {/* Restaurant + WebSite + BreadcrumbList JSON-LD — injected globally */}
        <RestaurantJsonLd />
      </head>
      <body className={`${poppins.variable} antialiased`} suppressHydrationWarning>
        {IS_MAINTENANCE_MODE ? (
           <MaintenanceScreen />
        ) : (
          <div className="flex flex-col min-h-screen">
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <TableProvider>
                <OrderProvider>
                  <CartProvider>
                    <RestaurantStatusPopup />
                    <TableForm />
                    <Header />
                    <main className="flex-grow">
                      {children}
                    </main>
                    <Footer />
                    <WhatsAppButton />
                  </CartProvider>
                </OrderProvider>
              </TableProvider>
              <Toaster richColors />
            </ThemeProvider>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ""} />
          <ClarityProvider />
          <MetaPixelProvider />
          <OrderSourceCapture />
          </div>
        )}
      </body>
    </html>
  );
}
