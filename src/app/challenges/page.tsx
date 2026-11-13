import { pageMetadata } from "@/lib/seo";
import { Challenges } from "@/components/challenge-pages";
export default function Page() {
  return <Challenges />;
}

export const metadata = pageMetadata({
  title: "Creative room challenges",
  description:
    "Explore Buildo design challenges. Start with a shared room, publish your perspective and vote during configured events.",
  path: "/challenges",
});
