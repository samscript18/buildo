import { Creator } from "@/components/community";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { publicCreator } from "@/server/seo";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await publicCreator(id);
  if (result.state !== "found")
    return pageMetadata({
      title: "Creator unavailable",
      path: `/creators/${id}`,
      noindex: true,
    });
  return pageMetadata({
    title: `${result.name} — Creator`,
    description: `Explore 3D spaces published by ${result.name} on Buildo.`,
    path: `/creators/${id}`,
  });
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const result = await publicCreator(id);
  if (result.state === "missing") notFound();
  return <Creator id={id} />;
}
