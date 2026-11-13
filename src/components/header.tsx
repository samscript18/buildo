"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Box, ArrowUpRight, LayoutGrid } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
export function Header() {
  const path = usePathname();
  const cache = useQueryClient();
  const router = useRouter();
  const { data } = authClient.useSession();
  return (
    <header className="header">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <Box size={21} />
        </span>
        buildo<span className="brand-dot">.</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link
          aria-current={path === "/explore" ? "page" : undefined}
          href="/explore"
        >
          Explore
        </Link>
        <Link
          aria-current={path.startsWith("/challenges") ? "page" : undefined}
          href="/challenges"
        >
          Challenges
        </Link>
        {data && (
          <Link
            href="/dashboard"
            aria-current={path === "/dashboard" ? "page" : undefined}
          >
            Workspace
          </Link>
        )}
      </nav>
      <div className="header-actions">
        {data && (
          <Link
            className="mobile-workspace"
            href="/dashboard"
            aria-label="Your workspace"
          >
            <LayoutGrid size={16} />
          </Link>
        )}
        {data ? (
          <button
            className="text-button"
            onClick={async () => {
              const result = await authClient.signOut();
              if (result.error) return;
              cache.clear();
              router.push("/");
              router.refresh();
            }}
          >
            Sign out
          </button>
        ) : (
          <Link className="text-button" href="/login">
            Log in
          </Link>
        )}
        <Link className="button small" href="/projects/new">
          Create a space <ArrowUpRight size={15} />
        </Link>
      </div>
    </header>
  );
}
