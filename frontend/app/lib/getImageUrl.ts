export function getImageUrl(image: string) {
    if (!image) {
      return "/placeholder-food.png";
    }
  
    if (image.startsWith("http")) {
      return image;
    }
  
    return `http://127.0.0.1:8000${image}`;
  }