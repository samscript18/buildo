import Home from "@/components/home";
import { pageMetadata, jsonLd, siteUrl, siteDescription } from "@/lib/seo";
export const metadata = pageMetadata({
  title: "Imagine it. Build it. Explore it.",
  path: "/",
});
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Buildo",
            url: siteUrl().toString(),
            description: siteDescription,
            inLanguage: "en",
          }),
        }}
      />
      <Home />
    </>
  );
}
