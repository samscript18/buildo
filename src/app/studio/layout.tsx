import type { Metadata } from "next";
import { privateRobots } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Room studio",
  robots: privateRobots,
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
