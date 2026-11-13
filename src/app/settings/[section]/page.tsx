import { notFound } from "next/navigation";
import { SettingsPage } from "@/components/settings";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!["profile", "appearance", "account", "privacy"].includes(section))
    notFound();
  return <SettingsPage section={section} />;
}
