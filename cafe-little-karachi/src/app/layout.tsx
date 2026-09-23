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
  title: "Little Karachi Express",
  description: "Little Karachi Express Ordering System",
  icons: {
    icon: "/hd-logo.ico",
    shortcut: "/hd-logo.ico",
    apple: "/hd-logo.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
