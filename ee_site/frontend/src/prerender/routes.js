import { products } from "../data/products";
import { services } from "../data/services";
import { cases } from "../data/cases";

// One registry drives static HTML, sitemap and nginx's public route allowlist.
// Text/metadata are rendered from the real pages, never copied into this list.
export const publicRoutes = [
  "/", "/about", "/solutions",
  ...products.map((item) => item.url),
  "/services", ...services.map((item) => item.url),
  "/cases", ...cases.filter((item) => item.hasDetailPage).map((item) => item.url),
  "/privacy",
];
