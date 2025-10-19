import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price to hide .00 decimals
export function formatPrice(price: string): string {
  if (!price) return "";
  
  // Remove .00 from prices
  return price.replace(/\.00(\s|$)/, "$1");
}

// Extract numeric price for calculations
export function extractNumericPrice(price: string): number | null {
  if (!price) return null;
  
  const match = price.match(/[\d,]+\.?\d*/);
  if (!match) return null;
  
  return parseFloat(match[0].replace(/,/g, ""));
}

// Calculate price change percentage
export function calculatePriceChange(oldPrice: string, newPrice: string): number | null {
  const oldNum = extractNumericPrice(oldPrice);
  const newNum = extractNumericPrice(newPrice);
  
  if (oldNum === null || newNum === null || oldNum === 0) return null;
  
  return ((newNum - oldNum) / oldNum) * 100;
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}

// Get icon for category
export function getCategoryIcon(categoryName: string): string {
  const name = categoryName.toLowerCase();
  
  if (name.includes("dress")) return "shirt";
  if (name.includes("skirt")) return "shirt";
  if (name.includes("top") || name.includes("shirt") || name.includes("blouse")) return "shirt";
  if (name.includes("makeup") || name.includes("beauty") || name.includes("cosmetic")) return "sparkles";
  if (name.includes("perfume") || name.includes("fragrance")) return "spray-can";
  if (name.includes("shoe") || name.includes("boot") || name.includes("sneaker")) return "footprints";
  if (name.includes("bag") || name.includes("purse") || name.includes("wallet")) return "shopping-bag";
  if (name.includes("jewelry") || name.includes("accessory") || name.includes("watch")) return "gem";
  if (name.includes("electronic") || name.includes("tech") || name.includes("gadget")) return "smartphone";
  if (name.includes("home") || name.includes("decor")) return "home";
  if (name.includes("book")) return "book";
  if (name.includes("toy") || name.includes("game")) return "gamepad-2";
  
  return "shopping-bag";
}
