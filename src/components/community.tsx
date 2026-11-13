"use client";
/* eslint-disable @next/next/no-img-element */
import {
  CommunityGate,
  PreviewLabel,
  useCommunityViewer,
} from "./community-access";
import { RoomArt } from "./room-art";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, post } from "@/lib/api";
import { type Scene, type AssetView, type ProjectView } from "@/lib/scene";
import { LazyViewport } from "@/features/editor/lazy-viewport";
import { PageHeading, Empty, Notice, QueryError } from "./ui";
type Design = {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  ownerId: string;
  allowRemix: boolean;
  cover?: string;
  category: string;
  publishedAt: string;
  scene: Scene;
  originalId?: string;
  rootId?: string;
};
export function DesignCards({ items }: { items: Design[] }) {
  return (
    <div className="grid">
      {items.map((d) => (
        <Link href={`/designs/${d.id}`} className="card" key={d.id}>
          <div className="card-preview">
            {d.cover ? (
              <img src={d.cover} alt={`${d.title} viewport cover`} />
            ) : (
              <RoomArt />
            )}
          </div>
          <div className="card-body">
            <div className="card-meta">
              <span>{d.category}</span>
              <span>
                {d.allowRemix ? "Open for remix" : "Visit this space"}
              </span>
            </div>
            <h3>{d.title}</h3>
            <p>By {d.creatorName}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
export function Explore() {
  const { viewer } = useCommunityViewer();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["designs", viewer, page],
    queryFn: () =>
      api<{ items: Design[]; preview: boolean; hasNext: boolean }>(
        `designs?page=${page}`,
      ),
  });
  return (
    <div className="container">
      {q.data?.preview && <PreviewLabel />}
      <PageHeading
        eyebrow="The community gallery"
        title="A world of perspectives."
      >
        Step into a space. Discover an idea. Imagine what you’d do next.
      </PageHeading>
      {q.isPending ? (
        <Notice>Opening the gallery…</Notice>
      ) : q.error ? (
        <QueryError error={q.error} retry={q.refetch} />
      ) : q.data.items.length ? (
        <DesignCards items={q.data.items} />
      ) : (
        <Empty
          title="Be the first to open a door."
          href="/projects/new"
          label="Create a space"
        >
          No designs have been published yet. Your space could be the beginning
          of something.
        </Empty>
      )}
      {q.data?.preview ? (
        <CommunityGate next="/explore" />
      ) : (
        <div className="actions results">
          <button
            className="button secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="subtle">Page {page}</span>
          <button
            className="button secondary"
            disabled={!q.data?.hasNext}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
export function DesignDetail({ id }: { id: string }) {
  const { viewer } = useCommunityViewer();
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reset, setReset] = useState(0),
    [walk, setWalk] = useState(false);
  const q = useQuery({
    queryKey: ["design", viewer, id],
    queryFn: () =>
      api<
        | { preview: true; design: Omit<Design, "scene">; assets: [] }
        | { preview: false; design: Design; assets: AssetView[] }
      >(`designs/${id}`),
  });
  if (q.isPending)
    return (
      <div className="container">
        <Notice>Opening this space…</Notice>
      </div>
    );
  if (q.error)
    return (
      <div className="container">
        <QueryError error={q.error} retry={q.refetch} />
      </div>
    );
  if (q.data.preview) {
    const preview = q.data.design;
    return (
      <div className="container">
        <PreviewLabel />
        <PageHeading
          eyebrow={`${preview.category} / A first look`}
          title={preview.title}
        >
          By {preview.creatorName}
        </PageHeading>
        <div className="community-cover-preview">
          {preview.cover ? (
            <img src={preview.cover} alt={`${preview.title} cover preview`} />
          ) : (
            <RoomArt />
          )}
          <span>
            <PreviewLabel />
          </span>
        </div>
        <p className="community-preview-description">{preview.description}</p>
        <CommunityGate next={`/designs/${id}`} title="Step inside this space.">
          Sign in to open the interactive room, explore every angle, and remix
          it when the creator permits.
        </CommunityGate>
      </div>
    );
  }
  const d = q.data.design;
  return (
    <div className="container">
      <PageHeading
        eyebrow={`${d.category} / Published space`}
        title={d.title}
        action={
          <div className="actions">
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setError("Share link copied.");
                } catch {
                  setError("Copy the page URL from your browser to share.");
                }
              }}
            >
              Copy share link
            </button>
            {d.allowRemix && (
              <button
                className="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const p = await post<ProjectView>(
                      `designs/${id}/remix`,
                      {},
                    );
                    router.push(`/studio/${p.id}`);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Creating your copy…" : "Remix this space ↗"}
              </button>
            )}
          </div>
        }
      >
        Created by{" "}
        <Link className="text-button" href={`/creators/${d.ownerId}`}>
          {d.creatorName}
        </Link>
      </PageHeading>
      {error && <Notice>{error}</Notice>}
      <div className="viewport-wrap viewer">
        <div className="viewport-toolbar">
          <button
            className={`tool ${walk ? "active" : ""}`}
            onClick={() => setWalk(!walk)}
          >
            {walk ? "Return to orbit" : "Walkthrough"}
          </button>
          <button className="tool" onClick={() => setReset((v) => v + 1)}>
            Reset view
          </button>
          {walk && (
            <>
              <button
                className="tool"
                onPointerDown={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { code: "KeyW" }),
                  )
                }
                onPointerUp={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keyup", { code: "KeyW" }),
                  )
                }
                onPointerLeave={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keyup", { code: "KeyW" }),
                  )
                }
              >
                Forward
              </button>
              <button
                className="tool"
                onPointerDown={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { code: "ArrowLeft" }),
                  )
                }
                onPointerUp={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keyup", { code: "ArrowLeft" }),
                  )
                }
                onPointerLeave={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keyup", { code: "ArrowLeft" }),
                  )
                }
              >
                Turn left
              </button>
              <button
                className="tool"
                onPointerDown={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { code: "ArrowRight" }),
                  )
                }
                onPointerUp={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keyup", { code: "ArrowRight" }),
                  )
                }
                onPointerLeave={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keyup", { code: "ArrowRight" }),
                  )
                }
              >
                Turn right
              </button>
            </>
          )}
        </div>
        <LazyViewport
          scene={d.scene}
          assets={q.data.assets}
          reset={reset}
          walk={walk}
        />
        <div className="viewport-help">
          {walk
            ? "WASD / arrows to move and turn · No collision detection"
            : "Drag to orbit · Pinch or scroll to zoom"}
        </div>
      </div>
      <section className="two-col results">
        <div>
          <h2>A little about this space</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {d.description ||
              "The creator is letting the space speak for itself."}
          </p>
          {d.originalId && (
            <p>
              Remixed from{" "}
              <Link className="text-button" href={`/designs/${d.originalId}`}>
                this original design
              </Link>
              .
            </p>
          )}
        </div>
        <div className="form-card">
          <h3>The details</h3>
          <p>
            {d.scene.room.width} × {d.scene.room.depth} m ·{" "}
            {d.scene.objects.length} objects
            <br />
            {d.allowRemix
              ? "Remixing permitted with attribution."
              : "This design is available to explore."}
            <br />
            Published {new Date(d.publishedAt).toLocaleDateString()}
          </p>
          <small>
            Procedural room shell with imported/generated mesh assets.
          </small>
        </div>
      </section>
    </div>
  );
}
export function Creator({ id }: { id: string }) {
  const { viewer } = useCommunityViewer();
  const q = useQuery({
    queryKey: ["creator", viewer, id],
    queryFn: () =>
      api<{ name: string; items: Design[]; preview: boolean }>(
        `creators/${id}`,
      ),
  });
  return (
    <div className="container">
      {q.isPending ? (
        <Notice>Loading creator…</Notice>
      ) : q.error ? (
        <QueryError error={q.error} retry={q.refetch} />
      ) : (
        <>
          {q.data.preview && <PreviewLabel />}
          <PageHeading eyebrow="Creator profile" title={q.data.name}>
            Spaces shared with the community.
          </PageHeading>
          {q.data.items.length ? (
            <DesignCards items={q.data.items} />
          ) : (
            <Empty title="More to imagine.">
              This creator hasn’t published a space yet.
            </Empty>
          )}
          {q.data.preview && <CommunityGate next={`/creators/${id}`} />}
        </>
      )}
    </div>
  );
}
