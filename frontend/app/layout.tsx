import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { Inter } from "next/font/google";

import { Toaster } from "react-hot-toast";

import { CartProvider } from "../context/CartContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusVita",
  description: "Smart Campus Food Ordering System",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
    lang="en"
    suppressHydrationWarning
  >
      <body className={inter.className}>
      <ThemeProvider>
        <CartProvider>

          <Toaster
            position="top-center"
            reverseOrder={false}
          />

          {children}

        </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}