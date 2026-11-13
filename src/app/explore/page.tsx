import { pageMetadata } from "@/lib/seo";
import { Explore } from "@/components/community";
export default function Page() {
  return <Explore />;
}

export const metadata = pageMetadata({
  title: "Explore 3D spaces",
  description:
    "Explore published interactive 3D rooms. Discover different perspectives and remix designs when their creators permit it.",
  path: "/explore",
});
