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
import { CSPostHogProvider } from './providers/PostHogProvider';
import { GoogleAnalytics } from "@next/third-parties/google";
import { ClarityProvider } from "./providers/ClarityProvider";
import dynamic from "next/dynamic";
import RestaurantStatusPopup from "./components/RestaurantStatusPopup";
import WhatsAppButton from "./components/WhatsAppButton";

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

export const metadata: Metadata = {
  title: "CLK Ordering System",
  description: "Little Karachi Express Ordering System",
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
          <CSPostHogProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <TableProvider>
                <CartProvider>
                  <OrderProvider>
                    <RestaurantStatusPopup />
                    <Header />
                    <main className="flex-grow">
                      {children}
                    </main>
                    <Footer />
                    <WhatsAppButton />
                  </OrderProvider>
                </CartProvider>
              </TableProvider>
              <Toaster richColors />
            </ThemeProvider>
          </CSPostHogProvider>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ""} />
          <ClarityProvider />
          </div>
        )}
      </body>
    </html>
  );
}
