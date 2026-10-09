import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import ThemeProvider from "@/components/providers/ThemeProvider";
import { CartProvider } from "../context/CartContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CampusVita",
    template: "%s | CampusVita",
  },
  description: "Smart campus food ordering system",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#e6e7eb",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#303746",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <ThemeProvider>
          <CartProvider>
            <Toaster
              position="top-center"
              reverseOrder={false}
              toastOptions={{
                duration: 3000,
              }}
            />

            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}