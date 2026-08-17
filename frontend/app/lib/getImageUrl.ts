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

  const API_URL = "http://127.0.0.1:8000";

  // Make sure there is exactly one /
  const normalizedPath = image.startsWith("/")
    ? image
    : `/${image}`;

  return `${API_URL}${normalizedPath}`;
}