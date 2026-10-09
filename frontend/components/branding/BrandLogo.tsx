// ============================================================
// SHARED BRAND LOGO
//
// The single source of truth for the CampusVita wordmark:
// public/branding/logo.png (transparent PNG, ~421x119).
//
// The artwork itself is dark (near-black "Campus", purple
// "Vita" + mark), so on the dark photographic auth heroes it
// must be rendered on a light plate (`plate`) to stay
// readable. The PNG carries its own transparent padding, so
// the plate needs no extra padding - the transparent margins
// become the visual gutter.
// ============================================================

type BrandLogoProps = {
  /**
   * Sizing utilities applied to the image itself.
   * Height utilities are preferred: width follows the
   * asset's intrinsic aspect ratio automatically.
   */
  className?: string;

  /**
   * Wrap the wordmark in a light rounded plate so the dark
   * artwork keeps contrast over dark backgrounds.
   */
  plate?: boolean;
};

export default function BrandLogo({
  className = "",
  plate = false,
}: BrandLogoProps) {
  const image = (
    <img
      src="/branding/logo.png"
      alt="CampusVita"
      className={`block w-auto object-contain ${className}`}
      decoding="async"
    />
  );

  if (!plate) {
    return image;
  }

  return (
    <span
      className="
        inline-flex
        items-center
        rounded-2xl
        bg-white
        shadow-[0_10px_28px_rgba(0,0,0,0.18)]
      "
    >
      {image}
    </span>
  );
}
