import type { MetadataRoute } from "next";
import { indexableSite, siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return indexableSite()
    ? {
        rules: { userAgent: "*", allow: "/", disallow: "/api/" },
        sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
