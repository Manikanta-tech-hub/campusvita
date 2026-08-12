"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";

type Props = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

export default function SidebarItem({
  label,
  href,
  icon: Icon,
  active,
}: Props) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300",
        active
          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      )}
    >
      <Icon
        size={20}
        className={clsx(
          "transition-transform duration-300 group-hover:scale-110",
          active ? "text-white" : "text-zinc-400"
        )}
      />

      <span className="font-medium">{label}</span>
    </Link>
  );
}