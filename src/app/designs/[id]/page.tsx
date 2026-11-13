import { DesignDetail } from "@/components/community";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { publicDesign } from "@/server/seo";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await publicDesign(id);
  if (result.state !== "found")
    return pageMetadata({
      title: "Design unavailable",
      path: `/designs/${id}`,
      noindex: true,
    });
  return pageMetadata({
    title: result.design.title,
    description:
      result.design.description?.slice(0, 180) ||
      `Explore ${result.design.title}, a ${result.design.category} by ${result.design.creatorName}.`,
    path: `/designs/${id}`,
    image: result.design.cover,
  });
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const result = await publicDesign(id);
  if (result.state === "missing") notFound();
  return <DesignDetail id={id} />;
}
