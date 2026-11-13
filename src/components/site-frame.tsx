"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "./header";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { Private } from "./ui";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { isWorkspaceRoute, isCommunityRoute } from "@/lib/routes";
function WorkspaceFrame({
  children,
  path,
}: {
  children: React.ReactNode;
  path: string;
}) {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ id: string }>("me"),
    retry: false,
  });
  if (!me.data)
    return (
      <main id="main" className="container workspace-access">
        <Private>{null}</Private>
      </main>
    );
  return (
    <div
      className={`dashboard-shell workspace-shell ${path.startsWith("/studio/") ? "workspace-studio" : ""}`}
    >
      <WorkspaceSidebar compact={path.startsWith("/studio/")} />
      <main
        id="main"
        className={`workspace-content ${path === "/dashboard" ? "workspace-overview" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const session = authClient.useSession();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {isWorkspaceRoute(path) || (isCommunityRoute(path) && !!session.data) ? (
        <WorkspaceFrame path={path}>{children}</WorkspaceFrame>
      ) : (
        <>
          <Header />
          <main id="main">{children}</main>
          <footer>
            <Link className="brand" href="/">
              buildo.
            </Link>
            <span>Imagine it. Build it. Explore it.</span>
            <nav className="footer-links" aria-label="Footer navigation">
              <Link href="/explore">Explore</Link>
              <Link href="/challenges">Challenges</Link>
              <Link href="/#faq">FAQs</Link>
              <Link href="/projects/new">Start creating ↗</Link>
            </nav>
          </footer>
        </>
      )}
    </>
  );
}
