"use client";
import Link from "next/link";
import { LockKeyhole, ArrowUpRight, Compass } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { signInPath } from "@/lib/return-path";
export function useCommunityViewer() {
  const { data, isPending } = authClient.useSession();
  return { viewer: data?.user.id || "visitor", pending: isPending };
}
export function CommunityGate({
  next,
  title = "There’s more to explore inside.",
  children,
}: {
  next: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="community-gate">
      <span className="community-gate-icon">
        <LockKeyhole size={22} strokeWidth={1.4} />
      </span>
      <div>
        <div className="eyebrow">A FIRST LOOK IS JUST THE BEGINNING</div>
        <h2>{title}</h2>
        <p>
          {children ||
            "Sign in to browse the full collection, explore interactive spaces, and make a new perspective your own."}
        </p>
      </div>
      <div className="community-gate-actions">
        <Link className="button" href={signInPath(next)}>
          Sign in to explore
          <ArrowUpRight size={15} />
        </Link>
        <Link className="text-button" href={signInPath(next, true)}>
          Create an account
        </Link>
      </div>
    </section>
  );
}
export function PreviewLabel() {
  return (
    <span className="community-preview-label">
      <Compass size={13} />
      Public preview
    </span>
  );
}
