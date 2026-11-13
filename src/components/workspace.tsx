"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LazyViewport } from "@/features/editor/lazy-viewport";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, post } from "@/lib/api";
import {
  categories,
  defaultScene,
  type ProjectView,
  type AssetView,
} from "@/lib/scene";
import {
  Empty,
  Notice,
  PageHeading,
  Private,
  QueryError,
  Pagination,
} from "./ui";
export function NewProject() {
  const router = useRouter();
  const params = useSearchParams();
  const challengeId = params.get("challenge") || undefined;
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dimensions, setDimensions] = useState(defaultScene.room);
  const challenge = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () =>
      api<{ title: string; room: typeof defaultScene.room }>(
        `challenges/${challengeId}`,
      ),
    enabled: !!challengeId,
  });
  const room = challenge.data?.room || dimensions;
  return (
    <div className="container">
      <Private>
        <PageHeading eyebrow="A fresh canvas" title="What will you build?">
          Every space starts with an idea. Let’s make room for yours.
        </PageHeading>
        <div className="new-project-layout">
          <form
            className="form form-card"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              try {
                const scene = { ...structuredClone(defaultScene), room };
                const p = await post<ProjectView>("projects", {
                  title: f.get("title"),
                  category: f.get("category"),
                  brief: f.get("brief"),
                  scene,
                  challengeId,
                });
                router.push(`/studio/${p.id}`);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="form-section-label">
              <span>01</span> THE IDEA
            </div>
            <label>
              Give your space a name
              <input
                name="title"
                placeholder="My little corner of the world"
                required
                maxLength={100}
              />
            </label>
            <label>
              Category
              <select name="category">
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Your starting idea <span className="optional">optional</span>
              <textarea
                name="brief"
                placeholder="A sunlit reading room, a quiet place to slow down…"
                maxLength={1500}
              />
            </label>
            <div className="form-section-label">
              <span>02</span> MAKE ROOM
            </div>
            {challengeId ? (
              <Notice>
                {challenge.data?.title || "Challenge room"} · {room.width} ×{" "}
                {room.depth} × {room.height} m. Starting dimensions are pinned.
              </Notice>
            ) : (
              <div className="row">
                {(["width", "depth", "height"] as const).map((key) => (
                  <label key={key}>
                    {key[0].toUpperCase() + key.slice(1)} (m)
                    <input
                      name={key}
                      type="number"
                      min="2"
                      max={key === "height" ? 8 : 30}
                      step=".1"
                      defaultValue={room[key]}
                      onChange={(e) => {
                        const value = e.currentTarget.valueAsNumber;
                        if (
                          Number.isFinite(value) &&
                          value >= 2 &&
                          value <= (key === "height" ? 8 : 30)
                        )
                          setDimensions((d) => ({ ...d, [key]: value }));
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
            {error && <Notice error>{error}</Notice>}
            <button className="button" disabled={busy || !!challenge.error}>
              {busy ? "Creating…" : "Open the studio ↗"}
            </button>
            <small>
              Your room is procedural. Generate or import individual Lux3D
              objects inside the studio.
            </small>
          </form>
          <aside className="new-project-preview">
            <div className="new-preview-top">
              <span className="canvas-badge">
                <span className="status-dot" />
                YOUR STARTING POINT
              </span>
              <span className="preview-index">
                {(room.width * room.depth).toFixed(1)} M²
              </span>
            </div>
            <div className="new-room-canvas">
              <LazyViewport scene={{ ...defaultScene, room }} assets={[]} />
            </div>
            <div className="new-preview-caption">
              <div className="eyebrow">
                A little room. A lot of possibility.
              </div>
              <h2>It’s yours from here.</h2>
              <p>
                Start simple. Try things. There’s no wrong way to imagine your
                next space.
              </p>
              <div className="room-specs">
                <span>
                  {room.width} m <small>WIDTH</small>
                </span>
                <span>
                  {room.depth} m <small>DEPTH</small>
                </span>
                <span>
                  {room.height} m <small>HEIGHT</small>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </Private>
    </div>
  );
}
export function ImportForm({ onDone }: { onDone?: () => void }) {
  const cache = useQueryClient();
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => api<{ storage: boolean }>("config"),
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        setError("");
        try {
          await api("assets", { method: "POST", body: new FormData(form) });
          form.reset();
          await cache.invalidateQueries({ queryKey: ["assets"] });
          onDone?.();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Asset name
        <input name="name" required maxLength={100} />
      </label>
      <label>
        Self-contained GLB
        <input
          className="file-input"
          name="file"
          type="file"
          accept=".glb,model/gltf-binary"
          required
        />
      </label>
      <small>
        Static GLB 2.0, up to 25MB. Embed textures, max 4096px. Convert ZIP
        exports to a self-contained GLB first.
      </small>
      <label>
        Lux3D task ID
        <input name="taskId" required maxLength={100} />
      </label>
      <label>
        Original Lux3D source / task URL
        <input name="sourceUrl" type="url" required placeholder="https://…" />
      </label>
      <label>
        Original prompt
        <textarea name="prompt" maxLength={1200} />
      </label>
      <label className="checkbox">
        <input type="checkbox" name="rightsConfirmed" value="true" required />
        This is a genuine Lux3D export and I have permission to upload and share
        it.
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="reuse"
          onChange={(e) => {
            const hidden = e.currentTarget.form?.elements.namedItem(
              "allowReuse",
            ) as HTMLInputElement;
            hidden.value = String(e.currentTarget.checked);
          }}
        />
        Allow this asset to be reused in permitted remixes.
      </label>
      <input type="hidden" name="allowReuse" defaultValue="false" />
      {error && <Notice error>{error}</Notice>}
      {!config.data?.storage && (
        <Notice>
          Asset uploads are not available yet. Your existing library remains
          available.
        </Notice>
      )}
      <button className="button" disabled={busy || !config.data?.storage}>
        {busy ? "Validating and uploading…" : "Import Lux3D asset"}
      </button>
    </form>
  );
}
export function AssetLibrary() {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["assets", page],
    queryFn: () => api<{ items: AssetView[] }>(`assets?page=${page}`),
  });
  return (
    <div className="container">
      <Private>
        <PageHeading
          eyebrow="Your collection"
          title="Objects with possibility."
        >
          Bring a genuine Lux3D object into your next room.
        </PageHeading>
        <div className="two-col">
          <div>
            {q.isPending ? (
              <Notice>Loading library…</Notice>
            ) : q.error ? (
              <QueryError error={q.error} retry={q.refetch} />
            ) : q.data.items.length ? (
              <div className="grid">
                {q.data.items.map((a) => (
                  <div className="card card-body" key={a.id}>
                    <h3>{a.name}</h3>
                    <p>{a.source}</p>
                    <small>
                      {a.allowReuse
                        ? "Remix reuse permitted"
                        : "Private reuse only"}
                    </small>
                    <p className="subtle">Task: {a.taskId}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="Your first object belongs here.">
                Import a Lux3D export, or generate an object in a project’s
                studio.
              </Empty>
            )}
            <Pagination
              page={page}
              onChange={setPage}
              hasNext={(q.data?.items.length || 0) === 18}
            />
          </div>
          <div className="form-card">
            <h2>Import an object</h2>
            <ImportForm />
          </div>
        </div>
      </Private>
    </div>
  );
}
