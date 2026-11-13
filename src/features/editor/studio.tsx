"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  Move,
  Rotate3D,
  Scaling,
  Undo2,
  Redo2,
  Save,
  Eye,
  Share2,
  Magnet,
  Focus,
} from "lucide-react";
import { api, post, ApiError } from "@/lib/api";
import { type ProjectView, type AssetView } from "@/lib/scene";
import { useEditor } from "./store";
import { LazyViewport } from "./lazy-viewport";
import { Notice, Private, QueryError, Pagination } from "@/components/ui";
import { ImportForm } from "@/components/workspace";
type Job = {
  id: string;
  state: string;
  prompt: string;
  safeError?: string;
  assetId?: string;
};
function Generation({
  projectId,
  onReady,
}: {
  projectId: string;
  onReady: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [key, setKey] = useState(crypto.randomUUID());
  const cache = useQueryClient();
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => api<{ generation: boolean }>("config"),
  });
  const q = useQuery({
    queryKey: ["generations"],
    queryFn: () => api<{ items: Job[] }>("generations"),
  });
  const running = useMemo(
    () =>
      q.data?.items.filter((j) =>
        ["queued", "generating", "transferring", "transfer_failed"].includes(
          j.state,
        ),
      ) || [],
    [q.data],
  );
  const { refetch } = q;
  useEffect(() => {
    if (!running.length) return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        for (const j of running) {
          const updated = await api<Job>(`generations/${j.id}`);
          if (updated.state === "ready") {
            await cache.invalidateQueries({ queryKey: ["assets"] });
            onReady();
          }
        }
        if (!stopped) await refetch();
      } catch {}
    }, 15000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [running, cache, onReady, refetch]);
  return (
    <>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = e.currentTarget;
          try {
            await post("generations", {
              projectId,
              prompt: new FormData(form).get("prompt"),
              requestKey: key,
              style: "photorealistic",
              allowReuse: new FormData(form).get("allowReuse") === "on",
            });
            setKey(crypto.randomUUID());
            form.reset();
            await q.refetch();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Imagine an object
          <textarea
            name="prompt"
            placeholder="A low oak reading chair with soft linen cushions…"
            required
            minLength={5}
            maxLength={1200}
          />
        </label>
        <small>
          Creates one Lux3D object. Provider credits may be used. New
          generations are never retried automatically.
        </small>
        <label className="checkbox">
          <input type="checkbox" name="allowReuse" />I have reuse rights and
          allow this object in shared remixes.
        </label>
        {!config.data?.generation && (
          <Notice>
            Object generation is not available yet. You can import a Lux3D
            export when uploads are available.
          </Notice>
        )}
        <button
          className="button"
          disabled={busy || !!running.length || !config.data?.generation}
        >
          {busy ? "Submitting…" : "Generate object ↗"}
        </button>
        {error && <Notice error>{error}</Notice>}
      </form>
      {q.data?.items
        .filter((j) => !["ready"].includes(j.state))
        .slice(0, 4)
        .map((j) => (
          <div key={j.id} className="notice">
            <strong>{j.state.replace("_", " ")}</strong>
            <p className="subtle">{j.prompt}</p>
            {j.safeError && <p>{j.safeError}</p>}
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api(`generations/${j.id}`);
                  await q.refetch();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Refresh status
            </button>
          </div>
        ))}
    </>
  );
}
function Properties() {
  const s = useEditor();
  const selected = s.scene.objects.find((o) => o.instanceId === s.selected);
  function transform(
    key: "position" | "rotation" | "scale",
    i: number,
    value: number,
  ) {
    if (!selected || !Number.isFinite(value)) return;
    const array = [...selected[key]] as [number, number, number];
    if (key === "scale") {
      const ratio = value / selected.scale[i];
      s.object(selected.instanceId, {
        scale: selected.scale.map((v) =>
          Math.max(0.01, Math.min(20, v * ratio)),
        ) as [number, number, number],
      });
      return;
    }
    array[i] =
      key === "position"
        ? Math.max(i === 1 ? 0 : -100, Math.min(100, value))
        : (value * Math.PI) / 180;
    s.object(selected.instanceId, { [key]: array });
  }
  return (
    <aside className="panel properties">
      <h2>{selected ? "Object properties" : "Your room"}</h2>
      {selected ? (
        <div className="form">
          <p className="subtle">
            {s.assets.find((a) => a.id === selected.assetId)?.name}
          </p>
          {(["position", "rotation", "scale"] as const).map((key) => (
            <div key={key}>
              <h3>
                {key === "rotation"
                  ? "Rotation (degrees)"
                  : key === "position"
                    ? "Position (meters)"
                    : "Scale · proportions linked"}
              </h3>
              <div className="numeric-grid">
                {["X", "Y", "Z"].map((axis, i) => (
                  <label key={axis}>
                    {axis}
                    <input
                      type="number"
                      step={key === "rotation" ? 5 : 0.1}
                      value={Number(
                        (key === "rotation"
                          ? (selected[key][i] * 180) / Math.PI
                          : selected[key][i]
                        ).toFixed(3),
                      )}
                      onChange={(e) =>
                        transform(key, i, e.currentTarget.valueAsNumber)
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <label>
            Material tint
            <input
              type="color"
              value={selected.color || "#ffffff"}
              onChange={(e) =>
                s.object(selected.instanceId, { color: e.target.value })
              }
            />
          </label>
          <small>
            Tints standard PBR materials. Original texture remains visible.
          </small>
          {selected.color && (
            <button
              className="text-button"
              onClick={() => {
                const updated = { ...selected };
                delete updated.color;
                s.edit({
                  ...s.scene,
                  objects: s.scene.objects.map((o) =>
                    o.instanceId === selected.instanceId ? updated : o,
                  ),
                });
              }}
            >
              Reset material tint
            </button>
          )}
          <button className="button secondary" onClick={s.duplicate}>
            Duplicate
          </button>
          <button className="button secondary" onClick={s.remove}>
            Delete object
          </button>
        </div>
      ) : (
        <p className="subtle">
          Select an object to move, rotate, or resize it.
        </p>
      )}
      <h3>Room dimensions</h3>
      <div className="form">
        {(["width", "depth", "height"] as const).map((key) => (
          <label key={key}>
            {key} (m)
            <input
              type="number"
              min="2"
              max={key === "height" ? 8 : 30}
              step=".1"
              value={s.scene.room[key]}
              onChange={(e) => {
                const value = e.currentTarget.valueAsNumber;
                if (
                  Number.isFinite(value) &&
                  value >= 2 &&
                  value <= (key === "height" ? 8 : 30)
                )
                  s.edit({
                    ...s.scene,
                    room: { ...s.scene.room, [key]: value },
                  });
              }}
            />
          </label>
        ))}
        {(["floor", "wall"] as const).map((key) => (
          <label key={key}>
            {key} color
            <input
              type="color"
              value={s.scene.room[key]}
              onChange={(e) =>
                s.edit({
                  ...s.scene,
                  room: { ...s.scene.room, [key]: e.target.value },
                })
              }
            />
          </label>
        ))}
        <label>
          Wallpaper pattern
          <select
            value={s.scene.room.wallpaper || "none"}
            onChange={(e) =>
              s.edit({
                ...s.scene,
                room: {
                  ...s.scene.room,
                  wallpaper: e.target.value as typeof s.scene.room.wallpaper,
                },
              })
            }
          >
            <option value="none">Paint only</option>
            <option value="linen">Woven linen</option>
            <option value="stripes">Quiet stripes</option>
            <option value="arches">Soft arches</option>
          </select>
        </label>
        {s.scene.room.wallpaper && s.scene.room.wallpaper !== "none" && (
          <>
            <label>
              Wallpaper placement
              <select
                value={s.scene.room.wallpaperWall || "back"}
                onChange={(e) =>
                  s.edit({
                    ...s.scene,
                    room: {
                      ...s.scene.room,
                      wallpaperWall: e.target
                        .value as typeof s.scene.room.wallpaperWall,
                    },
                  })
                }
              >
                <option value="back">Back wall</option>
                <option value="left">Left wall</option>
                <option value="both">Both walls</option>
              </select>
            </label>
            <label>
              Wallpaper accent
              <input
                type="color"
                value={s.scene.room.wallpaperColor || "#8b9a7a"}
                onChange={(e) =>
                  s.edit({
                    ...s.scene,
                    room: { ...s.scene.room, wallpaperColor: e.target.value },
                  })
                }
              />
            </label>
            <small>
              Built-in wallpaper pattern. Wall colour supplies the base; no AI
              generation credits are used.
            </small>
          </>
        )}
        <label>
          Lighting
          <select
            value={s.scene.lighting}
            onChange={(e) =>
              s.edit({
                ...s.scene,
                lighting: e.target.value as typeof s.scene.lighting,
              })
            }
          >
            <option value="daylight">Daylight</option>
            <option value="warm">Warm</option>
            <option value="evening">Evening</option>
          </select>
        </label>
      </div>
    </aside>
  );
}
function StudioContent({ id }: { id: string }) {
  const [assetPage, setAssetPage] = useState(1);
  const q = useQuery({
    queryKey: ["project", id],
    queryFn: () =>
      api<{ project: ProjectView; assets: AssetView[] }>(`projects/${id}`),
  });
  const library = useQuery({
    queryKey: ["assets", assetPage],
    queryFn: () => api<{ items: AssetView[] }>(`assets?page=${assetPage}`),
  });
  const s = useEditor();
  const loaded = useRef("");
  const saving = useRef(false);
  const revision = useRef(0);
  const [saveState, setSaveState] = useState(""),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(false);
  const [reset, setReset] = useState(0),
    [walk, setWalk] = useState(false),
    [capture, setCapture] = useState(0),
    [cover, setCover] = useState<string>();
  const [publishOpen, setPublishOpen] = useState(false),
    [published, setPublished] = useState(""),
    [publishing, setPublishing] = useState(false);
  useEffect(() => {
    if (q.data && loaded.current !== id) {
      useEditor.getState().load(q.data.project.scene, q.data.assets);
      revision.current = q.data.project.revision;
      loaded.current = id;
      setSaveState(
        `Saved ${new Date(q.data.project.updatedAt).toLocaleTimeString()}`,
      );
    }
  }, [q.data, id]);
  const save = useCallback(async () => {
    if (saving.current || conflict || loaded.current !== id) return false;
    const state = useEditor.getState();
    if (!state.dirty) return true;
    saving.current = true;
    setError("");
    setSaveState("Saving…");
    try {
      const p = await post<ProjectView>(
        `projects/${id}`,
        { revision: revision.current, scene: state.scene },
        "PATCH",
      );
      revision.current = p.revision;
      useEditor.getState().markSaved(state.version);
      setSaveState(`Saved ${new Date().toLocaleTimeString()}`);
      return true;
    } catch (e) {
      setError((e as Error).message);
      setSaveState("Save needs attention");
      if (e instanceof ApiError && e.code === "REVISION_CONFLICT")
        setConflict(true);
      return false;
    } finally {
      saving.current = false;
    }
  }, [id, conflict]);
  useEffect(() => {
    if (!s.dirty || conflict || error) return;
    const timer = setTimeout(() => void save(), 1600);
    return () => clearTimeout(timer);
  }, [s.version, s.dirty, save, conflict, error]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          "input,textarea,select,[contenteditable=true]",
        )
      )
        return;
      const state = useEditor.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
      if (state.preview) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        state.duplicate();
      }
      if (["Delete", "Backspace"].includes(e.key)) {
        e.preventDefault();
        state.remove();
      }
      if (e.key === "Escape") state.select(null);
    };
    const before = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", before);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", before);
    };
  }, [save]);
  const captured = useCallback((data: string) => setCover(data), []);
  const ready = useCallback(() => {}, []);
  if (q.isPending) return <Notice>Opening your studio…</Notice>;
  if (q.error) return <QueryError error={q.error} retry={q.refetch} />;
  const p = q.data.project;
  return (
    <>
      <div className="studio-top">
        <div className="studio-title">
          <div className="eyebrow">
            <Link href="/dashboard">Workspace</Link> / Studio
          </div>
          <h1>{p.title}</h1>
          <small>
            {s.dirty ? "● Unsaved changes · " : ""}
            {saveState}
          </small>
        </div>
        <div className="actions">
          <button
            className="button secondary"
            onClick={() => void save()}
            disabled={conflict}
          >
            <Save size={13} /> Save
          </button>
          <button
            className={`button ${s.preview ? "dark" : "secondary"}`}
            onClick={() => {
              useEditor.setState({ preview: !s.preview, selected: null });
              setWalk(false);
            }}
          >
            <Eye size={13} />
            {s.preview ? "Back to edit" : "Preview"}
          </button>
          <button
            className="button"
            onClick={async () => {
              if (await save()) {
                setPublishOpen(true);
                useEditor.setState({ preview: true, selected: null });
              }
            }}
          >
            <Share2 size={13} />
            Share / Publish ↗
          </button>
        </div>
      </div>
      {error && (
        <Notice error>
          {error}
          {conflict && (
            <div className="actions">
              <button
                className="text-button"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob(
                      [JSON.stringify(useEditor.getState().scene, null, 2)],
                      { type: "application/json" },
                    ),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "buildo-unsaved-scene.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download my edits
              </button>
              <button
                className="text-button"
                onClick={() => window.location.reload()}
              >
                Reload latest version
              </button>
            </div>
          )}
        </Notice>
      )}
      {p.challengeId && (
        <Notice>
          This project uses a challenge starting room. Keep its original
          dimensions to submit.
        </Notice>
      )}
      <div className="studio-layout">
        <aside className="panel library">
          <h2>
            Your objects{" "}
            <span className="subtle">({s.scene.objects.length}/80)</span>
          </h2>
          <p className="subtle">Choose an asset to place in your room.</p>
          {library.error ? (
            <QueryError error={library.error} retry={library.refetch} />
          ) : !library.data?.items.length ? (
            <Notice>
              Your library is empty. Generate or import an object below.
            </Notice>
          ) : (
            library.data.items.map((a) => (
              <button
                className="asset-button"
                key={a.id}
                disabled={s.preview || s.scene.objects.length >= 80}
                onClick={() => s.add(a)}
              >
                <span>+</span>
                {a.name}
              </button>
            ))
          )}
          <Pagination
            page={assetPage}
            onChange={setAssetPage}
            hasNext={(library.data?.items.length || 0) === 18}
          />
          <details>
            <summary>Import a Lux3D export</summary>
            <ImportForm />
          </details>
          {p.brief && (
            <details>
              <summary>Your starting idea</summary>
              <p className="subtle">{p.brief}</p>
            </details>
          )}
          <h3>Generate an object</h3>
          <Generation projectId={id} onReady={ready} />
        </aside>
        <div className="viewport-wrap">
          <div className="viewport-toolbar">
            {!s.preview ? (
              <>
                {(["translate", "rotate", "scale"] as const).map((mode) => (
                  <button
                    className={`tool ${s.mode === mode ? "active" : ""}`}
                    aria-pressed={s.mode === mode}
                    title={
                      s.selected
                        ? "Drag the selected object's coloured handles"
                        : "Select an object, then drag its coloured handles"
                    }
                    key={mode}
                    onClick={() => useEditor.setState({ mode })}
                  >
                    {mode === "translate" ? (
                      <Move size={12} />
                    ) : mode === "rotate" ? (
                      <Rotate3D size={12} />
                    ) : (
                      <Scaling size={12} />
                    )}
                    {mode === "translate"
                      ? "Move"
                      : mode === "rotate"
                        ? "Rotate"
                        : "Resize"}
                  </button>
                ))}
                <button
                  className="tool"
                  disabled={!s.past.length}
                  onClick={s.undo}
                >
                  <Undo2 size={12} /> Undo
                </button>
                <button
                  className="tool"
                  disabled={!s.future.length}
                  onClick={s.redo}
                >
                  <Redo2 size={12} /> Redo
                </button>
                <button
                  className={`tool ${s.snap ? "active" : ""}`}
                  aria-pressed={s.snap}
                  title="Snap dragging to 0.25 m, 15 degrees and 0.1 scale steps"
                  onClick={() => useEditor.setState({ snap: !s.snap })}
                >
                  <Magnet size={12} /> Snap
                </button>
              </>
            ) : (
              <button
                className={`tool ${walk ? "active" : ""}`}
                onClick={() => setWalk(!walk)}
              >
                {walk ? "Orbit view" : "Walkthrough"}
              </button>
            )}
            <button className="tool" onClick={() => setReset((v) => v + 1)}>
              <Focus size={12} /> Reset view
            </button>
          </div>
          {!s.preview && (
            <div className="studio-selection-hint" role="status">
              {s.selected
                ? `${s.mode === "translate" ? "Move" : s.mode === "rotate" ? "Rotate" : "Resize"}: drag a coloured handle${s.snap ? " · snapping on" : ""}`
                : "Select an object to move, rotate or resize it"}
            </div>
          )}
          <LazyViewport
            scene={s.scene}
            assets={s.assets}
            editable={!s.preview}
            reset={reset}
            walk={walk}
            capture={capture}
            onCapture={captured}
          />
          <div className="viewport-help">
            {walk
              ? "WASD / ↑ ↓ move · ← → turn · No collision detection"
              : "Drag to orbit · Scroll to zoom · Right drag to pan · Units: meters"}
          </div>
        </div>
        {!s.preview ? (
          <Properties />
        ) : (
          <aside className="panel properties">
            <h2>Explore your room</h2>
            <p className="subtle">
              Orbit with drag, pan with right drag, and zoom with scroll or
              pinch. Walkthrough uses WASD and arrow keys without collision
              detection.
            </p>
          </aside>
        )}
      </div>
      {publishOpen && (
        <section className="form-card results">
          <h2>Let someone step inside.</h2>
          <p>
            Publishing creates a fixed snapshot with a shareable link. Future
            studio edits stay private.
          </p>
          <button
            className="button secondary"
            onClick={() => setCapture((v) => v + 1)}
          >
            Capture current view as cover
          </button>
          {cover && (
            <figure>
              <Image
                src={cover}
                alt="Captured room cover"
                width={320}
                height={200}
                unoptimized
              />
              <figcaption className="subtle">
                Viewport cover captured. It will be stored when you publish.
              </figcaption>
            </figure>
          )}
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              setPublishing(true);
              setError("");
              const f = new FormData(e.currentTarget);
              try {
                if (!(await save())) return;
                const result = await post<{ id: string }>(
                  `projects/${id}/publish`,
                  {
                    description: f.get("description"),
                    allowRemix: f.get("allowRemix") === "on",
                    revision: revision.current,
                    cover,
                  },
                );
                setPublished(result.id);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setPublishing(false);
              }
            }}
          >
            <label>
              Tell the story of your space
              <textarea name="description" maxLength={1500} />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="allowRemix" />
              Allow others to remix this design. Every asset must permit reuse.
            </label>
            <div className="actions">
              <button className="button" disabled={publishing}>
                {publishing ? "Publishing…" : "Publish snapshot"}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setPublishOpen(false)}
              >
                Close
              </button>
            </div>
          </form>
          {published && (
            <Notice>
              Your design is published.{" "}
              <Link className="text-button" href={`/designs/${published}`}>
                Open shareable design ↗
              </Link>
            </Notice>
          )}
        </section>
      )}
    </>
  );
}
export function Studio({ id }: { id: string }) {
  return (
    <div className="studio">
      <Private>
        <StudioContent key={id} id={id} />
      </Private>
    </div>
  );
}
