import type { APIRoute } from "astro";
import { source, enSource } from "@/lib/source";
import { siteUrl } from "@/lib/site";

export const GET: APIRoute = () => {
  const routes = ["/", "/en", ...source.getPages().map((page) => page.url), ...enSource.getPages().map((page) => page.url)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${siteUrl}${route}</loc></url>`).join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
