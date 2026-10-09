"use client";

import * as React from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface TelegramHeaderProps {
  avatar: string;
  name: string;
  phone: string;
  username: string;
  actionButton?: {
    text: string;
    onClick: () => void;
    backgroundColor?: string;
  };
}

export function TelegramHeader({
  avatar,
  name,
  phone,
  username,
  actionButton = {
    text: "Edit",
    onClick: () => {},
    backgroundColor: "rgb(249, 115, 22)",
  },
}: TelegramHeaderProps) {
  const [expand, setExpand] = React.useState(false);
  const [imageFailed, setImageFailed] = React.useState(false);

  // Use the supplied image URL directly.
  const imageSrc = avatar?.trim() || "";
  const showAvatarImage = Boolean(imageSrc) && !imageFailed;

  // Reset image fallback when the image URL changes.
  React.useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

  const initial = name.trim().charAt(0).toUpperCase() || "V";

  const handleImageError = () => {
    setImageFailed(true);
  };

  const avatarFallback = (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        "bg-orange-100 font-semibold text-orange-600",
        "dark:bg-orange-950 dark:text-orange-300",
      )}
      aria-label={`${name || "Vendor"} profile avatar`}
    >
      {initial}
    </div>
  );

  return (
    <MotionConfig
      transition={{
        duration: 0.4,
        type: "spring",
        bounce: 0.2,
      }}
    >
      {/* Header action button */}
      <motion.button
        type="button"
        className={cn(
          "absolute z-30 cursor-pointer rounded-full px-2",
          "text-blue-500",
        )}
        initial={{ right: 0 }}
        animate={{
          right: expand ? 16 : 0,
          backgroundColor: expand
            ? actionButton.backgroundColor || "rgb(249, 115, 22)"
            : "rgba(0, 0, 0, 0)",
          color: expand ? "#ffffff" : "rgb(59, 130, 246)",
        }}
        onClick={actionButton.onClick}
      >
        {actionButton.text}
      </motion.button>

      <motion.header
        layout
        style={{
          aspectRatio: expand ? "1 / 1" : undefined,
        }}
        className={cn(
          "relative isolate flex flex-col overflow-hidden",
          expand
            ? "mt-0 min-h-[360px] items-start justify-end p-5"
            : "mt-4 items-center justify-center pb-5",
        )}
      >
        {/* Compact profile avatar */}
        <motion.button
          type="button"
          layoutId="user-avatar"
          className={cn(
            "relative flex aspect-square w-20 shrink-0",
            "items-center justify-center overflow-hidden",
          )}
          onClick={() => setExpand((previous) => !previous)}
          style={{
            borderRadius: 34,
          }}
          aria-label={expand ? "Collapse profile" : "Expand profile"}
        >
          {showAvatarImage ? (
            <img
              src={imageSrc}
              alt={`${name || "Vendor"} profile photo`}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              onError={handleImageError}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full">{avatarFallback}</div>
          )}
        </motion.button>

        {/* Vendor name and contact information */}
        <motion.div
          className={cn(
            "relative z-20 flex flex-col",
            expand ? "items-start" : "items-center",
          )}
        >
          <motion.h2
            layout
            className="inline-block text-xl font-semibold"
            animate={{
              color: expand ? "#ffffff" : "var(--foreground)",
            }}
          >
            {name || "Vendor"}
          </motion.h2>

          <motion.div
            layout
            className="flex items-center gap-1 text-xs"
            animate={{
              color: expand ? "#d4d4d8" : "#8C8C93",
            }}
          >
            <p className="tracking-tight">
              {phone || "Phone not provided"}
            </p>

            <span aria-hidden="true">•</span>

            <p>{username || "Username not provided"}</p>
          </motion.div>
        </motion.div>

        {/* Expanded profile image */}
        <AnimatePresence>
          {expand && (
            <motion.button
              type="button"
              layoutId="user-avatar"
              className={cn(
                "absolute inset-0 -z-10",
                "aspect-square overflow-hidden",
              )}
              style={{
                borderRadius: 0,
              }}
              onClick={() => setExpand(false)}
              aria-label="Collapse profile"
            >
              {showAvatarImage ? (
                <img
                  src={imageSrc}
                  alt={`${name || "Vendor"} profile photo`}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full text-8xl">
                  {avatarFallback}
                </div>
              )}

              {/* Image overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.header>
    </MotionConfig>
  );
}