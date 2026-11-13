import type { Metadata } from "next";
export const siteName = "Buildo";
export const siteDescription =
  "Imagine, furnish and explore your own interactive 3D spaces. Create with Lux3D objects, share a room, and discover a new perspective.";
export function siteUrl() {
  const candidate =
    process.env.SITE_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";
  const url = new URL(candidate);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("SITE_URL must be an HTTP(S) application origin.");
  return new URL(url.origin);
}
export function indexableSite() {
  const url = siteUrl();
  return (
    url.protocol === "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}
export const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
};
export function pageMetadata({
  title,
  description = siteDescription,
  path,
  image,
  noindex = false,
}: {
  title: string;
  description?: string;
  path: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const canonical = new URL(path, siteUrl()).toString();
  const shareImage = image || new URL("/opengraph-image", siteUrl()).toString();
  return {
    title,
    description,
    alternates: { canonical },
    robots:
      noindex || !indexableSite()
        ? privateRobots
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName,
      title: `${title} · Buildo`,
      description,
      url: canonical,
      locale: "en_US",
      images: [
        {
          url: shareImage,
          alt: image ? title : "Buildo — Imagine it. Build it. Explore it.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Buildo`,
      description,
      images: [shareImage],
    },
  };
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
