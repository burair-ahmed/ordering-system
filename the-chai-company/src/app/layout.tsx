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
import { Toaster } from "@/components/ui/sonner";
import RestaurantStatusPopup from "./components/RestaurantStatusPopup";

const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-Black.ttf", weight: "900", style: "normal" },
    { path: "./fonts/Poppins-BlackItalic.ttf", weight: "900", style: "italic" },
    { path: "./fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Poppins-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "./fonts/Poppins-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/Poppins-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
    { path: "./fonts/Poppins-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/Poppins-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "./fonts/Poppins-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/Poppins-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Poppins-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "./fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "./fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "./fonts/Poppins-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/Poppins-ThinItalic.ttf", weight: "100", style: "italic" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Chai Company Ordering System",
  description: "Authentic Chai and Snacks by The Chai Company",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <html lang="en" suppressHydrationWarning>
  <body className={`${poppins.variable} antialiased`}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TableProvider>
        <CartProvider>
        <OrderProvider>
          <RestaurantStatusPopup/>
          <Header />
          {children}
          <Footer />
        </OrderProvider>
        </CartProvider>
      </TableProvider>
      <Toaster richColors/>
    </ThemeProvider>
  </body>
</html>

  );
}
