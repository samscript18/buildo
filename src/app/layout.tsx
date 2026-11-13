import {
  siteUrl,
  siteDescription,
  indexableSite,
  privateRobots,
} from "@/lib/seo";
import type { Metadata } from "next";
import "./globals.css";
import "./design.css";
import { Providers } from "@/components/providers";
import { SiteFrame } from "@/components/site-frame";
import "./dashboard/dashboard.css";
import "./workspace-shell.css";
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  applicationName: "Buildo",
  category: "design",
  robots: indexableSite() ? { index: true, follow: true } : privateRobots,
  referrer: "strict-origin-when-cross-origin",
  openGraph: {
    type: "website",
    siteName: "Buildo",
    title: "Buildo — Imagine it. Build it. Explore it.",
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Buildo — Imagine it. Build it. Explore it.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buildo — Imagine it. Build it. Explore it.",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  title: {
    default: "Buildo — Imagine it. Build it. Explore it.",
    template: "%s · Buildo",
  },
  description:
    "Turn an idea into a space you can explore. Create and share interactive 3D rooms.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteFrame>{children}</SiteFrame>
        </Providers>
      </body>
    </html>
  );
}
