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
      className="cv-glass-card cv-lift group block overflow-hidden rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
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
          aria-label={`Bookmark ${name}`}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[var(--text-primary)] shadow-sm backdrop-blur-md transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[var(--primary)] dark:bg-black/60 dark:text-white"
        >
          <Bookmark size={15} strokeWidth={2} />
        </button>

        {/* Rating badge */}
        {rating !== undefined && rating !== null && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[rgba(17,17,17,0.78)] px-2.5 py-1 text-[11px] font-semibold text-[#fff] backdrop-blur-md">
            <Star size={10} className="fill-[#fff] text-[#fff]" strokeWidth={2.5} /> {rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-snug tracking-[-0.02em] text-[var(--text-primary)] line-clamp-1">{name}</h3>
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
            <span className="cv-tnum">
              {preparationTime !== undefined && preparationTime !== null
                ? `${preparationTime} min`
                : "Prep time —"}
            </span>
          </div>

          <span className="cv-tnum text-sm font-semibold tracking-tight text-[var(--text-primary)]">{priceText()}</span>
        </div>

        {/* Availability */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOpen ? "bg-[var(--success)]" : "bg-[var(--text-subtle)]"}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isOpen ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}>
            {isOpen ? "Open now" : "Closed"}
          </span>
        </div>
      </div>
    </Link>
  );
}
