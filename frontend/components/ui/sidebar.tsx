"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link, { type LinkProps } from "next/link";
import React, { useState } from "react";

export const Sidebar = ({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}) => {
  return (
    <>
      <DesktopSidebar open={open} setOpen={setOpen}>
        {children}
      </DesktopSidebar>

      <MobileSidebar open={open} setOpen={setOpen}>
        {children}
      </MobileSidebar>
    </>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <motion.div
      className={cn(
        "flex h-full flex-col overflow-hidden border-r border-neutral-200 bg-white py-4 dark:border-neutral-800 dark:bg-neutral-950",
      )}
      {...props}
    />
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: {
    label: string;
    href: string;
    icon: React.ReactNode;
  };
  className?: string;
} & Omit<LinkProps, "href">) => {
  return (
    <Link
      href={link.href}
      className={cn(
        "group/sidebar flex items-center justify-start gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white",
        className,
      )}
      {...props}
    >
      {link.icon}

      <span className="whitespace-pre text-sm transition duration-150 group-hover/sidebar:translate-x-0.5">
        {link.label}
      </span>
    </Link>
  );
};

const DesktopSidebar = ({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      className={cn(
        "relative hidden h-screen shrink-0 md:flex md:flex-col",
        "border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
      )}
      animate={{
        width: open ? "280px" : "72px",
      }}
      transition={{
        duration: 0.25,
        ease: "easeInOut",
      }}
    >
      <div className="flex h-full w-full flex-col">{children}</div>
    </motion.div>
  );
};

const MobileSidebar = ({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}) => {
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          aria-label={open ? "Close sidebar" : "Open sidebar"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              duration: 0.25,
              ease: "easeInOut",
            }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex h-full flex-col">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Logo = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className="flex w-full items-center gap-3 px-3 py-3 text-left"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] font-bold text-[var(--on-primary)]">
        C
      </div>

      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden whitespace-nowrap text-lg font-semibold text-neutral-900 dark:text-white"
          >
            CampusVita
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export const SidebarContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const SidebarFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("mt-auto px-3 pt-3", className)}>{children}</div>
  );
};