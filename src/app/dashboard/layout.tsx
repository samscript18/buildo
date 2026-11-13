import type { Metadata } from "next";
import { privateRobots } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Your workspace",
  robots: privateRobots,
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
