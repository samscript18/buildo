"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Box,
  Layers3,
  LayoutGrid,
  FolderOpen,
  Plus,
  Compass,
  Trophy,
  Settings,
  Shield,
  ChevronRight,
  Leaf,
  ArrowRight,
  ArrowUpRight,
  LogOut,
  Menu,
} from "lucide-react";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
export function WorkspaceSidebar({ compact = false }: { compact?: boolean }) {
  const path = usePathname(),
    router = useRouter(),
    cache = useQueryClient();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ id: string; name: string; role: string }>("me"),
  });
  const [signingOut, setSigningOut] = useState(false),
    [error, setError] = useState("");
  const workspace = [
    { href: "/dashboard", label: "Overview", icon: LayoutGrid },
    {
      href: "/dashboard#dashboard-projects",
      label: "My spaces",
      icon: FolderOpen,
    },
    { href: "/assets", label: "Asset library", icon: Box },
    { href: "/projects/new", label: "New space", icon: Plus },
  ];
  const discover = [
    { href: "/explore", label: "Explore designs", icon: Compass },
    { href: "/challenges", label: "Challenges", icon: Trophy },
  ];
  const account = [
    ...(me.data?.role === "admin"
      ? [{ href: "/admin/challenges", label: "Administration", icon: Shield }]
      : []),
    { href: "/settings", label: "Account settings", icon: Settings },
  ];
  function active(href: string) {
    if (href === "/explore")
      return (
        path === "/explore" ||
        path.startsWith("/designs/") ||
        path.startsWith("/creators/")
      );
    return href === "/dashboard"
      ? path === "/dashboard"
      : !href.includes("#") && (path === href || path.startsWith(href + "/"));
  }
  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error)
        throw new Error("Could not sign out. Please try again.");
      router.replace("/");
      cache.clear();
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }
  function links(items: typeof workspace, mobile = false) {
    return items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={active(item.href) ? "selected" : undefined}
        aria-current={active(item.href) ? "page" : undefined}
        aria-label={compact && !mobile ? item.label : undefined}
        title={compact && !mobile ? item.label : undefined}
        onClick={(event) => {
          const details = event.currentTarget.closest("details");
          if (details) details.open = false;
        }}
      >
        <item.icon size={17} />
        <span className="workspace-nav-text">{item.label}</span>
        {active(item.href) && <span className="nav-selected-dot" />}
      </Link>
    ));
  }
  return (
    <aside
      className={`dashboard-sidebar workspace-sidebar ${compact ? "workspace-sidebar-compact" : ""}`}
      aria-label="Workspace sidebar"
    >
      <div className="workspace-sidebar-top">
        <Link
          className="brand workspace-brand"
          href="/"
          aria-label="Buildo home"
        >
          <span className="brand-mark">
            <Box size={21} />
          </span>
          <span className="workspace-brand-name">
            buildo<span className="brand-dot">.</span>
          </span>
        </Link>
        <details className="workspace-mobile-menu">
          <summary aria-label="Open workspace menu">
            <Menu size={19} />
            <span>Menu</span>
          </summary>
          <nav aria-label="Mobile workspace menu">
            {links([...workspace, ...discover, ...account], true)}
            <button onClick={() => void signOut()} disabled={signingOut}>
              <LogOut size={16} />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
            {error && <p role="alert">{error}</p>}
          </nav>
        </details>
      </div>
      <div className="workspace-label">
        <span>
          <Layers3 size={18} />
        </span>
        <div>
          Personal workspace<small>Room for your imagination</small>
        </div>
      </div>
      <div className="dashboard-nav-label">YOUR WORKSPACE</div>
      <nav className="dashboard-nav" aria-label="Workspace navigation">
        {links(workspace)}
      </nav>
      <div className="dashboard-nav-label">DISCOVER</div>
      <nav className="dashboard-nav" aria-label="Discover">
        {links(discover)}
      </nav>
      <div className="sidebar-note">
        <span>
          <Leaf size={18} />
        </span>
        <h3>A little idea goes a long way.</h3>
        <p>
          Try a new layout. Follow a possibility. Make room for something you
          love.
        </p>
        <Link href="/projects/new">
          Start something new
          <ArrowRight size={14} />
        </Link>
      </div>
      <nav
        className="dashboard-nav sidebar-settings"
        aria-label="Account navigation"
      >
        {links(account)}
        <button
          className="workspace-signout"
          onClick={() => void signOut()}
          disabled={signingOut}
          aria-label={signingOut ? "Signing out…" : "Sign out"}
          title="Sign out"
        >
          <LogOut size={17} />
          <span className="workspace-nav-text">
            {signingOut ? "Signing out…" : "Sign out"}
          </span>
        </button>
      </nav>
      {error && (
        <p className="workspace-signout-error" role="alert">
          {error}
        </p>
      )}
      <Link
        href="/settings"
        className="sidebar-profile"
        aria-label="Your account settings"
        title="Your account settings"
      >
        <span>{me.data?.name?.charAt(0).toUpperCase() || "B"}</span>
        <div>
          {me.data?.name || "Your account"}
          <small>Your personal workspace</small>
        </div>
        <ChevronRight size={15} />
      </Link>
      {compact && (
        <Link
          className="studio-back-link"
          href="/dashboard"
          aria-label="Back to workspace"
          title="Back to workspace"
        >
          <ArrowUpRight size={18} />
        </Link>
      )}
    </aside>
  );
}
