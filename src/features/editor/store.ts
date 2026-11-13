import { create } from "zustand";
import {
  defaultScene,
  type Scene,
  type SceneObject,
  type AssetView,
} from "@/lib/scene";
type State = {
  scene: Scene;
  past: Scene[];
  future: Scene[];
  selected: string | null;
  dirty: boolean;
  version: number;
  mode: "translate" | "rotate" | "scale";
  snap: boolean;
  preview: boolean;
  assets: AssetView[];
  load: (scene: Scene, assets: AssetView[]) => void;
  edit: (scene: Scene) => void;
  object: (id: string, change: Partial<SceneObject>) => void;
  select: (id: string | null) => void;
  add: (asset: AssetView) => void;
  remove: () => void;
  duplicate: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: (version: number) => void;
};
export const useEditor = create<State>((set, get) => ({
  scene: structuredClone(defaultScene),
  past: [],
  future: [],
  selected: null,
  dirty: false,
  version: 0,
  mode: "translate",
  snap: false,
  preview: false,
  assets: [],
  load: (scene, assets) =>
    set({
      scene: structuredClone(scene),
      assets,
      past: [],
      future: [],
      selected: null,
      dirty: false,
      version: 0,
      preview: false,
    }),
  edit: (scene) =>
    set((s) => ({
      scene,
      past: [...s.past.slice(-39), structuredClone(s.scene)],
      future: [],
      dirty: true,
      version: s.version + 1,
    })),
  object: (id, change) => {
    const s = get();
    s.edit({
      ...s.scene,
      objects: s.scene.objects.map((o) =>
        o.instanceId === id ? { ...o, ...change } : o,
      ),
    });
  },
  select: (selected) => set({ selected }),
  add: (asset) => {
    const s = get();
    if (s.scene.objects.length >= 80) return;
    s.edit({
      ...s.scene,
      objects: [
        ...s.scene.objects,
        {
          instanceId: crypto.randomUUID(),
          assetId: asset.id,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      ],
    });
    set({
      assets: s.assets.some((a) => a.id === asset.id)
        ? s.assets
        : [...s.assets, asset],
      selected: get().scene.objects.at(-1)!.instanceId,
    });
  },
  remove: () => {
    const s = get();
    if (!s.selected) return;
    s.edit({
      ...s.scene,
      objects: s.scene.objects.filter((o) => o.instanceId !== s.selected),
    });
    set({ selected: null });
  },
  duplicate: () => {
    const s = get(),
      o = s.scene.objects.find((o) => o.instanceId === s.selected);
    if (!o || s.scene.objects.length >= 80) return;
    const instanceId = crypto.randomUUID();
    s.edit({
      ...s.scene,
      objects: [
        ...s.scene.objects,
        {
          ...structuredClone(o),
          instanceId,
          position: [
            Math.min(o.position[0] + 0.3, 100),
            o.position[1],
            o.position[2],
          ],
        },
      ],
    });
    set({ selected: instanceId });
  },
  undo: () => {
    const s = get();
    if (!s.past.length) return;
    set({
      scene: s.past.at(-1)!,
      past: s.past.slice(0, -1),
      future: [s.scene, ...s.future],
      dirty: true,
      version: s.version + 1,
    });
  },
  redo: () => {
    const s = get();
    if (!s.future.length) return;
    set({
      scene: s.future[0],
      past: [...s.past, s.scene],
      future: s.future.slice(1),
      dirty: true,
      version: s.version + 1,
    });
  },
  markSaved: (version) => {
    if (get().version === version) set({ dirty: false });
  },
}));
