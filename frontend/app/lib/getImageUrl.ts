export function getImageUrl(image: string) {
  if (!image) {
    return "";
  }

  // Already an absolute URL
  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  // Local public path (served by Next.js directly)
  const normalizedPath = image.startsWith("/") ? image : `/${image}`;
  return normalizedPath;
}