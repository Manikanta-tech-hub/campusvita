import {
    LayoutDashboard,
    type LucideIcon,
  } from "lucide-react";

  export type VendorNavigationItem = {
    label: string;
    href: string;
    icon: LucideIcon;
  };

  export const vendorNavigation: VendorNavigationItem[] = [
    {
      label: "Dashboard",
      href: "/vendor/dashboard",
      icon: LayoutDashboard,
    },
  ];