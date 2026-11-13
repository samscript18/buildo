"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  FolderOpen,
  Box,
  Trophy,
  Search,
  SlidersHorizontal,
  Sparkles,
  Clock3,
  Check,
  RefreshCw,
  AlertCircle,
  PanelsTopLeft,
  ChevronRight,
  Upload,
  Leaf,
} from "lucide-react";
import { api } from "@/lib/api";
import { categories, type ProjectView, type AssetView } from "@/lib/scene";
import { RoomArt } from "@/components/room-art";
import { Private, QueryError } from "@/components/ui";
type Job = {
  id: string;
  state: string;
  prompt: string;
  projectId: string;
  safeError?: string;
  updatedAt: string;
};
type Overview = {
  counts: {
    projects: number;
    assets: number;
    publications: number;
    activeGenerations: number;
    attentionGenerations: number;
  };
  recentProject: ProjectView | null;
  jobs: Job[];
};
const activeStates = ["queued", "generating", "transferring"];
const jobLabels: Record<string, string> = {
  queued: "Queued",
  generating: "Generating",
  transferring: "Saving asset",
  ready: "Ready to place",
  unknown: "Needs review",
  timed_out: "Taking longer",
  transfer_failed: "Transfer interrupted",
  failed: "Generation failed",
};
function savedDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
function ProjectCard({ project: p }: { project: ProjectView }) {
  return (
    <Link href={`/studio/${p.id}`} className="dashboard-project-card">
      <div
        className={`dashboard-project-art tone-${categories.indexOf(p.category as (typeof categories)[number]) % 3}`}
      >
        <div className="project-category">
          <span />
          {p.category}
        </div>
        <RoomArt scene={p.scene} />
        <span className="project-dimensions">
          {p.scene.room.width} × {p.scene.room.depth} m
        </span>
        <span className="project-open-icon">
          <ArrowUpRight size={17} />
        </span>
      </div>
      <div className="dashboard-project-info">
        <h3>{p.title}</h3>
        <div>
          <span>
            <Clock3 size={12} />
            Saved {savedDate(p.updatedAt)}
          </span>
          <span>
            {p.scene.objects.length}{" "}
            {p.scene.objects.length === 1 ? "object" : "objects"}
          </span>
        </div>
        {p.challengeId && (
          <small className="project-challenge">
            <Trophy size={11} />
            Challenge space
          </small>
        )}
      </div>
    </Link>
  );
}
function DashboardContent() {
  const cache = useQueryClient();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ name: string }>("me"),
  });
  const overview = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Overview>("dashboard"),
    refetchInterval: 30000,
  });
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [debouncedSearch, setDebouncedSearch] = useState(""),
    [category, setCategory] = useState(""),
    [sort, setSort] = useState("recent");
  const [refreshing, setRefreshing] = useState(false),
    [refreshError, setRefreshError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const params = new URLSearchParams({
    page: String(page),
    limit: "6",
    sort,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category ? { category } : {}),
  });
  const projects = useQuery({
    queryKey: ["projects", "dashboard", page, debouncedSearch, category, sort],
    queryFn: () =>
      api<{ items: ProjectView[]; total: number; hasNext: boolean }>(
        `projects?${params}`,
      ),
  });
  const assets = useQuery({
    queryKey: ["assets", "dashboard"],
    queryFn: () => api<{ items: AssetView[] }>("assets?limit=3"),
  });
  const counts = overview.data?.counts;
  const recent = overview.data?.recentProject;
  const name = me.data?.name.trim().split(/\s+/)[0];
  async function refreshJobs() {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshError("");
    try {
      for (const job of overview.data?.jobs || [])
        if (activeStates.includes(job.state) || job.state === "transfer_failed")
          await api(`generations/${job.id}`);
      await Promise.all([
        overview.refetch(),
        cache.invalidateQueries({ queryKey: ["assets"] }),
      ]);
    } catch (e) {
      setRefreshError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }
  return (
    <div className="dashboard-main">
      <div className="dashboard-breadcrumb">
        <span>My workspace</span>
        <ChevronRight size={12} />
        <span>Overview</span>
      </div>
      <header className="dashboard-heading">
        <div>
          <div className="eyebrow">
            {name ? `HELLO, ${name}` : "YOUR CREATIVE CORNER"}
          </div>
          <h1>
            A little room for <em>big ideas.</em>
          </h1>
          <p>
            All your spaces, objects, and possibilities. Right where you left
            them.
          </p>
        </div>
        <Link className="button" href="/projects/new">
          <Plus size={17} />
          Create a space
        </Link>
      </header>
      {overview.error && (
        <QueryError error={overview.error} retry={overview.refetch} />
      )}
      <div className="dashboard-stats" aria-label="Workspace totals">
        {[
          {
            label: "Your spaces",
            value: counts?.projects,
            icon: FolderOpen,
            detail: "Private projects",
          },
          {
            label: "Objects collected",
            value: counts?.assets,
            icon: Box,
            detail: "Ready in your library",
          },
          {
            label: "Published designs",
            value: counts?.publications,
            icon: PanelsTopLeft,
            detail: "Shared snapshots",
          },
        ].map((stat) => (
          <div className="dashboard-stat" key={stat.label}>
            <span className="stat-icon">
              <stat.icon size={20} strokeWidth={1.5} />
            </span>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value ?? "—"}</strong>
              <small>{stat.detail}</small>
            </div>
          </div>
        ))}
      </div>
      {overview.isPending ? (
        <section
          className="dashboard-resume dashboard-resume-loading"
          role="status"
        >
          <span>Finding your latest space…</span>
        </section>
      ) : overview.data ? (
        <section className="dashboard-resume">
          <div className="resume-copy">
            <span className="resume-kicker">
              <Sparkles size={13} />
              {recent ? "A GOOD IDEA IS WAITING" : "YOUR NEXT IDEA STARTS HERE"}
            </span>
            <h2>
              {recent
                ? "Pick up where you left off."
                : "An empty room. Endless possibility."}
            </h2>
            <p>
              {recent
                ? "A new perspective might be one small change away. Open your latest space and make it a little more yours."
                : "Give an idea somewhere to grow. Start with a simple room, then bring it to life one object at a time."}
            </p>
            <Link
              href={recent ? `/studio/${recent.id}` : "/projects/new"}
              className="button"
            >
              {recent ? "Continue designing" : "Create your first space"}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="resume-room">
            <RoomArt scene={recent?.scene} />
            <div className="resume-room-label">
              <span>{recent?.title || "Your next starting point"}</span>
              <small>
                {recent
                  ? `${recent.scene.room.width} × ${recent.scene.room.depth} m · ${recent.scene.objects.length} objects`
                  : "Choose your room dimensions"}
              </small>
            </div>
            <span className="resume-plan-label">
              {recent ? "ROOM PLAN" : "A BLANK CANVAS"}
            </span>
          </div>
        </section>
      ) : null}
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section id="dashboard-projects" className="dashboard-projects">
            <div className="dashboard-section-heading">
              <div>
                <h2>
                  Your spaces <span>{projects.data?.total ?? "—"}</span>
                </h2>
                <p>A work in progress is a space full of potential.</p>
              </div>
              <Link className="text-button" href="/projects/new">
                <Plus size={14} />
                New space
              </Link>
            </div>
            <div className="dashboard-project-tools">
              <label className="dashboard-search">
                <Search size={16} />
                <span className="sr-only">Search your spaces</span>
                <input
                  value={search}
                  maxLength={80}
                  placeholder="Find a space…"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <label className="dashboard-filter">
                <span className="sr-only">Filter by category</span>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-sort">
                <SlidersHorizontal size={14} />
                <span className="sr-only">Sort spaces</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="recent">Recently edited</option>
                  <option value="oldest">Oldest edited</option>
                  <option value="title">Name A–Z</option>
                </select>
              </label>
            </div>
            {projects.isPending ? (
              <div
                className="dashboard-project-grid"
                role="status"
                aria-label="Loading spaces"
              >
                {[1, 2, 3].map((i) => (
                  <div className="dashboard-skeleton" key={i}>
                    <span />
                    <i />
                    <i />
                  </div>
                ))}
              </div>
            ) : projects.error ? (
              <QueryError error={projects.error} retry={projects.refetch} />
            ) : projects.data.items.length ? (
              <div className="dashboard-project-grid">
                {projects.data.items.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <span>
                  <FolderOpen size={27} strokeWidth={1.2} />
                </span>
                <h3>
                  {debouncedSearch || category
                    ? "No spaces found."
                    : "Your first space belongs here."}
                </h3>
                <p>
                  {debouncedSearch || category
                    ? "Try a different name or category to find what you’re looking for."
                    : "Create a room, collect a few objects, and see where the idea takes you."}
                </p>
                {debouncedSearch || category ? (
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSearch("");
                      setDebouncedSearch("");
                      setCategory("");
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </button>
                ) : (
                  <Link className="button" href="/projects/new">
                    Create your first space
                    <ArrowUpRight size={15} />
                  </Link>
                )}
              </div>
            )}
            {(page > 1 || projects.data?.hasNext) && (
              <div className="dashboard-pagination">
                <span>
                  Page {page}
                  {projects.data
                    ? ` · ${projects.data.total} ${projects.data.total === 1 ? "space" : "spaces"}`
                    : ""}
                </span>
                <div>
                  <button
                    className="button secondary"
                    disabled={page === 1 || projects.isFetching}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="button secondary"
                    disabled={!projects.data?.hasNext || projects.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
          <section className="dashboard-library">
            <div className="dashboard-section-heading">
              <div>
                <h2>A few things to build with</h2>
                <p>Your latest objects, ready for their next space.</p>
              </div>
              <Link className="text-button" href="/assets">
                View library
                <ArrowUpRight size={14} />
              </Link>
            </div>
            {assets.isPending ? (
              <div className="dashboard-inline-loading" role="status">
                Opening your library…
              </div>
            ) : assets.error ? (
              <QueryError error={assets.error} retry={assets.refetch} />
            ) : assets.data.items.length ? (
              <div className="dashboard-asset-list">
                {assets.data.items.map((a) => (
                  <Link href="/assets" className="dashboard-asset" key={a.id}>
                    <span className="asset-box">
                      <Box size={24} strokeWidth={1.15} />
                    </span>
                    <div>
                      <h3>{a.name}</h3>
                      <small>
                        {a.allowReuse ? "Reuse permitted" : "Personal use"} ·
                        GLB asset
                      </small>
                    </div>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="dashboard-library-empty">
                <span>
                  <Box size={23} strokeWidth={1.3} />
                </span>
                <div>
                  <h3>Good spaces start with great objects.</h3>
                  <p>
                    Import a Lux3D export, or generate an object inside your
                    studio.
                  </p>
                </div>
                <Link className="button secondary" href="/assets">
                  <Upload size={14} />
                  Import an object
                </Link>
              </div>
            )}
          </section>
        </div>
        <aside className="dashboard-secondary">
          <section className="dashboard-generation">
            <div className="dashboard-section-heading">
              <h2>
                <Sparkles size={16} />
                Object activity
              </h2>
              <button
                type="button"
                className="dashboard-refresh"
                aria-label="Refresh generation status"
                onClick={() => void refreshJobs()}
                disabled={refreshing || overview.isPending || !!overview.error}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "is-spinning" : ""}
                />
              </button>
            </div>
            {refreshError && (
              <p className="dashboard-job-error" role="alert">
                {refreshError}
              </p>
            )}
            {overview.isPending ? (
              <p className="dashboard-inline-loading" role="status">
                Loading generation activity…
              </p>
            ) : overview.error ? (
              <p className="dashboard-inline-loading">
                Activity is unavailable. Retry the workspace summary above.
              </p>
            ) : overview.data.jobs.length ? (
              <>
                <div className="job-summary">
                  <span className="activity-dot" />
                  {counts?.activeGenerations || 0} in progress
                  {counts?.attentionGenerations
                    ? ` · ${counts.attentionGenerations} need attention`
                    : ""}
                </div>
                <div className="dashboard-job-list">
                  {overview.data.jobs.map((job) => (
                    <div className="dashboard-job" key={job.id}>
                      <span
                        className={`job-icon ${job.state === "ready" ? "ready" : activeStates.includes(job.state) ? "working" : "attention"}`}
                      >
                        {job.state === "ready" ? (
                          <Check size={14} />
                        ) : activeStates.includes(job.state) ? (
                          <Clock3 size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                      </span>
                      <div>
                        <h3>{job.prompt}</h3>
                        <span
                          className={`job-status ${job.state === "ready" ? "ready" : ""}`}
                        >
                          {jobLabels[job.state] || "Status unavailable"}
                        </span>
                        {job.safeError && <p>{job.safeError}</p>}
                        <Link
                          href={
                            job.state === "ready"
                              ? "/assets"
                              : `/studio/${job.projectId}`
                          }
                        >
                          {job.state === "ready"
                            ? "Open asset library"
                            : "Open studio"}
                          <ArrowUpRight size={11} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="generation-note">
                  Refresh checks existing jobs. It never submits a new
                  generation.
                </p>
              </>
            ) : (
              <div className="dashboard-no-jobs">
                <span>
                  <Sparkles size={23} strokeWidth={1.25} />
                </span>
                <h3>A prompt. A new possibility.</h3>
                <p>
                  Describe an object inside the studio. Its progress will appear
                  here.
                </p>
                <Link href={recent ? `/studio/${recent.id}` : "/projects/new"}>
                  Open your studio
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </section>
          <section className="dashboard-challenge-card">
            <span className="challenge-mini-icon">
              <Trophy size={23} strokeWidth={1.25} />
            </span>
            <span className="mini-eyebrow">A DIFFERENT PERSPECTIVE</span>
            <h2>
              Same room.
              <br />
              <em>Your imagination.</em>
            </h2>
            <p>
              Discover a creative brief and make a shared starting point your
              own.
            </p>
            <Link href="/challenges">
              Explore challenges
              <ArrowUpRight size={15} />
            </Link>
          </section>
          <div className="dashboard-journey">
            <span className="mini-eyebrow">FROM IDEA TO SOMETHING REAL</span>
            <ol>
              <li>
                <span>01</span>
                <div>
                  Make a little room<small>Choose your starting space.</small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  Find your kind of right
                  <small>Generate, import, and arrange.</small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  Open a new perspective
                  <small>Preview, publish, and share.</small>
                </div>
              </li>
            </ol>
          </div>
        </aside>
      </div>
      <div className="dashboard-endnote">
        <Leaf size={13} />
        <span>Imagine it. Build it. Explore it.</span>
        <a href="#main">Back to top ↑</a>
      </div>
    </div>
  );
}
export function Dashboard() {
  return (
    <Private>
      <DashboardContent />
    </Private>
  );
}
