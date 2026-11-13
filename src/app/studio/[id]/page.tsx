import { Studio } from "@/features/editor/studio";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Studio id={(await params).id} />;
}
