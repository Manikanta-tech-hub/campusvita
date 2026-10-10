import React from "react";
import Link from "next/link";
import { Bookmark, Clock, Star } from "lucide-react";

export interface StallCardProps {
  _id: string;
  name: string;
  image?: string;
  description?: string;
  cuisine?: string;
  rating?: number;
  preparationTime?: string | number;
  priceMin?: number;
  priceMax?: number;
  isOpen?: boolean;
}

export default function StallCard({
  _id, name, image, description, cuisine, rating, preparationTime, priceMin, priceMax, isOpen,
}: StallCardProps) {
  const priceText = () => {
    if (priceMin !== undefined && priceMax !== undefined && priceMin !== priceMax) {
      return `₹${priceMin}–₹${priceMax}`;
    }
    if (priceMin !== undefined) return `₹${priceMin}`;
    if (priceMax !== undefined) return `₹${priceMax}`;
    return "Menu available";
  };

  return (
    <Link
      href={`/stall/${_id}`}
      className="group block overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-secondary)]">
        <img
          src={image || "/images/tiles/biryani.jpg"}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/tiles/biryani.jpg"; }}
        />

        {/* Bookmark */}
        <button
          onClick={(e) => { e.preventDefault(); }}
          aria-label="Bookmark"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--text-primary)] shadow-md transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        >
          <Bookmark size={16} strokeWidth={2} />
        </button>

        {/* Rating badge */}
        {rating !== undefined && rating !== null && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-[#168447] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            <Star size={10} className="fill-white text-white" strokeWidth={2.5} /> {rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-snug tracking-[-0.02em] text-[var(--text-primary)] line-clamp-1">{name}</h3>
        </div>

        {description && (
          <p className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)] line-clamp-2">{description}</p>
        )}

        {cuisine && (
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{cuisine}</p>
        )}

        {/* Divider */}
        <div className="mt-3 border-t border-[var(--border)]" />

        {/* Bottom metadata */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
            <Clock size={13} strokeWidth={2} />
            <span>
              {preparationTime !== undefined && preparationTime !== null
                ? `${preparationTime} min`
                : "Prep time —"}
            </span>
          </div>

          <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">{priceText()}</span>
        </div>

        {/* Availability */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-400"}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-muted)]"}`}>
            {isOpen ? "Open now" : "Closed"}
          </span>
        </div>
      </div>
    </Link>
  );
}
