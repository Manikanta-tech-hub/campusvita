"use client";

import { useEffect } from "react";
import BurgerScroll from "@/components/home/BurgerScroll";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import FindYourCraving from "@/components/home/FindYourCraving";
import Footer from "@/components/home/Footer";
import CampusVitaFooterHero from "@/components/home/CampusVitaFooterHero";
import HomeNavbar from "@/components/layout/HomeNavbar";
import StallDiscoverySection from "@/components/stalls/StallDiscoverySection";
import { listenNotifications, requestNotificationPermission } from "./notifications";

export default function Home() {
  useEffect(() => {
    let cancelled = false;
    void requestNotificationPermission().then(() => {
      if (!cancelled) void listenNotifications();
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--background)] text-[var(--text-primary)]">
      <HomeNavbar />
      <BurgerScroll />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <FindYourCraving />
        <FeaturedCollection />
      </div>
      <StallDiscoverySection />
      <CampusVitaFooterHero />
      <Footer />
    </main>
  );
}
