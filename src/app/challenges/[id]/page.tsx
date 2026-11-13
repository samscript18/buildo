import { ChallengeDetail } from "@/components/challenge-pages";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { publicChallenge } from "@/server/seo";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await publicChallenge(id);
  if (result.state !== "found")
    return pageMetadata({
      title: "Challenge unavailable",
      path: `/challenges/${id}`,
      noindex: true,
    });
  return pageMetadata({
    title: result.challenge.title,
    description: result.challenge.theme,
    path: `/challenges/${id}`,
  });
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const result = await publicChallenge(id);
  if (result.state === "missing") notFound();
  return <ChallengeDetail id={id} />;
}
