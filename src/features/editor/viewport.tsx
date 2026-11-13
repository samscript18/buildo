"use client";
/* Three.js cameras are mutable scene objects driven outside React renders. */
/* eslint-disable react-hooks/immutability */
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Grid,
  useGLTF,
} from "@react-three/drei";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  Texture,
  Vector3,
} from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Scene, SceneObject, AssetView } from "@/lib/scene";
import { useEditor } from "./store";
import { RoomShell } from "./room-shell";
import { ShowcaseRoom } from "./showcase-room";
import { useTheme } from "@/components/theme";
class ModelBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  componentDidCatch() {
    this.props.onError();
  }
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <mesh>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshBasicMaterial color="#ee6038" wireframe />
      </mesh>
    ) : (
      this.props.children
    );
  }
}
class CanvasBoundary extends Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="loading">
        The 3D view could not start. Use a browser with WebGL enabled, then
        reload.
      </div>
    ) : (
      this.props.children
    );
  }
}
const resources = new Map<
  string,
  { refs: number; timer?: ReturnType<typeof setTimeout> }
>();
function retain(url: string, source: Group) {
  const entry = resources.get(url) || { refs: 0 };
  if (entry.timer) clearTimeout(entry.timer);
  entry.refs++;
  resources.set(url, entry);
  return () => {
    entry.refs--;
    if (entry.refs === 0)
      entry.timer = setTimeout(() => {
        if (entry.refs) return;
        const textures = new Set<Texture>();
        source.traverse((child) => {
          if (child instanceof Mesh) {
            child.geometry.dispose();
            for (const material of Array.isArray(child.material)
              ? child.material
              : [child.material]) {
              for (const value of Object.values(material))
                if (value instanceof Texture) textures.add(value);
              material.dispose();
            }
          }
        });
        for (const texture of textures) texture.dispose();
        useGLTF.clear(url);
        resources.delete(url);
      }, 100);
  };
}
function Model({ asset, color }: { asset: AssetView; color?: string }) {
  const { scene } = useGLTF(asset.secureUrl);
  useEffect(() => retain(asset.secureUrl, scene), [asset.secureUrl, scene]);
  const copy = useMemo(() => {
    const object = clone(scene);
    object.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone();
        if (color) {
          for (const m of Array.isArray(child.material)
            ? child.material
            : [child.material])
            if (m instanceof MeshStandardMaterial) m.color.set(color);
        }
      }
    });
    return object;
  }, [scene, color]);
  useEffect(
    () => () => {
      copy.traverse((child) => {
        if (child instanceof Mesh)
          for (const m of Array.isArray(child.material)
            ? child.material
            : [child.material])
            m.dispose();
      });
    },
    [copy],
  );
  return (
    <group scale={asset.normalization.scale}>
      <group position={asset.normalization.offset}>
        <primitive object={copy} dispose={null} />
      </group>
    </group>
  );
}
function Item({
  object,
  asset,
  editable,
  setDragging,
  onError,
}: {
  object: SceneObject;
  asset?: AssetView;
  editable: boolean;
  setDragging: (b: boolean) => void;
  onError: () => void;
}) {
  const ref = useRef<Group>(null);
  const selected = useEditor((s) => s.selected);
  const mode = useEditor((s) => s.mode);
  const snap = useEditor((s) => s.snap);
  const active = editable && selected === object.instanceId;
  const content = (
    <group
      ref={ref}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onClick={(e) => {
        if (editable) {
          e.stopPropagation();
          useEditor.getState().select(object.instanceId);
        }
      }}
    >
      {asset ? (
        <ModelBoundary onError={onError}>
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshBasicMaterial color="#859177" wireframe />
              </mesh>
            }
          >
            <Model asset={asset} color={object.color} />
          </Suspense>
        </ModelBoundary>
      ) : (
        <mesh>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshBasicMaterial wireframe color="#ee6038" />
        </mesh>
      )}
    </group>
  );
  return active ? (
    <>
      <TransformControls
        mode={mode}
        translationSnap={snap ? 0.25 : null}
        rotationSnap={snap ? Math.PI / 12 : null}
        scaleSnap={snap ? 0.1 : null}
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => {
          setDragging(false);
          const g = ref.current;
          if (!g) return;
          g.updateWorldMatrix(true, true);
          const bounds = new Box3().setFromObject(g);
          if (bounds.min.y < 0) g.position.y -= bounds.min.y;
          const scale = g.scale
            .toArray()
            .map((v) => Math.max(0.01, Math.min(20, v))) as [
            number,
            number,
            number,
          ];
          useEditor.getState().object(object.instanceId, {
            position: g.position
              .toArray()
              .map((v) => Math.max(-100, Math.min(100, v))) as [
              number,
              number,
              number,
            ],
            rotation: [g.rotation.x, g.rotation.y, g.rotation.z],
            scale,
          });
        }}
      >
        {content}
      </TransformControls>
      <mesh
        position={[object.position[0], 0.008, object.position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.55, 0.57, 48]} />
        <meshBasicMaterial color="#ee6038" />
      </mesh>
    </>
  ) : (
    content
  );
}
function Camera({
  scene,
  reset,
  walk,
}: {
  scene: Scene;
  reset: number;
  walk: boolean;
}) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  useEffect(() => {
    camera.position.fromArray(scene.camera.position);
    camera.lookAt(...scene.camera.target);
  }, [camera, reset, scene.camera.position, scene.camera.target]);
  useEffect(() => {
    const pressed = keys.current;
    const down = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          "input,textarea,select,[contenteditable=true]",
        )
      )
        return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.code)
      ) {
        e.preventDefault();
        pressed.add(e.code);
      }
    };
    const up = (e: KeyboardEvent) => pressed.delete(e.code);
    const blur = () => pressed.clear();
    if (walk) {
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      window.addEventListener("blur", blur);
    }
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      pressed.clear();
    };
  }, [walk]);
  useFrame((_, dt) => {
    if (!walk) return;
    const k = keys.current;
    const direction = new Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    if (k.has("KeyW") || k.has("ArrowUp"))
      camera.position.addScaledVector(direction, Math.min(dt, 0.05) * 2);
    if (k.has("KeyS") || k.has("ArrowDown"))
      camera.position.addScaledVector(direction, -Math.min(dt, 0.05) * 2);
    if (k.has("ArrowLeft")) camera.rotation.y += dt;
    if (k.has("ArrowRight")) camera.rotation.y -= dt;
    if (k.has("KeyA"))
      camera.position.addScaledVector(
        new Vector3().crossVectors(camera.up, direction),
        dt * 2,
      );
    if (k.has("KeyD"))
      camera.position.addScaledVector(
        new Vector3().crossVectors(direction, camera.up),
        dt * 2,
      );
  });
  return null;
}
function Capture({
  token,
  onCapture,
}: {
  token: number;
  onCapture?: (data: string) => void;
}) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!token || !onCapture) return;
    gl.render(scene, camera);
    const output = document.createElement("canvas");
    output.width = 640;
    output.height = 400;
    output.getContext("2d")!.drawImage(gl.domElement, 0, 0, 640, 400);
    onCapture(output.toDataURL("image/png"));
  }, [token, gl, scene, camera, onCapture]);
  return null;
}
function RenderedFrame() {
  const { gl } = useThree();
  useFrame(() => {
    if (gl.info.render.calls > 0) gl.domElement.dataset.rendered = "true";
  });
  return null;
}
export default function Viewport({
  scene,
  assets,
  editable = false,
  reset = 0,
  walk = false,
  capture = 0,
  onCapture,
  showcase = false,
}: {
  scene: Scene;
  assets: AssetView[];
  showcase?: boolean;
  editable?: boolean;
  reset?: number;
  walk?: boolean;
  capture?: number;
  onCapture?: (data: string) => void;
}) {
  const { dark } = useTheme();
  const [dragging, setDragging] = useState(false);
  const [lost, setLost] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    const c = document.createElement("canvas");
    setSupported(!!c.getContext("webgl2"));
  }, []);
  if (!supported || lost)
    return (
      <div className="loading">
        <div>
          <p>
            {lost
              ? "The graphics context was lost. Your edits remain in this tab."
              : "WebGL 2 is unavailable. Enable hardware acceleration or use a compatible browser."}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setLost(false);
              setSupported(true);
            }}
          >
            Retry 3D view
          </button>
        </div>
      </div>
    );
  const r = scene.room;
  return (
    <CanvasBoundary>
      {loadError && (
        <div
          className="notice error"
          role="alert"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 60,
            zIndex: 3,
          }}
        >
          A model is unavailable. Check your connection, then reload to retry.
          Your saved layout is preserved.
        </div>
      )}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: scene.camera.position,
          fov: 45,
          near: 0.05,
          far: 150,
        }}
        onPointerMissed={() => editable && useEditor.getState().select(null)}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setLost(true);
          });
        }}
        fallback={<div className="loading">WebGL is not available.</div>}
      >
        <color attach="background" args={[dark ? "#171d1a" : "#edece5"]} />
        <ambientLight intensity={scene.lighting === "evening" ? 0.5 : 1.8} />
        <directionalLight
          castShadow
          position={[3, 7, 4]}
          shadow-bias={-0.0003}
          shadow-normalBias={0.025}
          intensity={scene.lighting === "warm" ? 2 : 2.5}
          color={scene.lighting === "warm" ? "#ffe1b5" : "#ffffff"}
          shadow-mapSize={[1024, 1024]}
        />
        <RoomShell room={r} />
        {showcase && <ShowcaseRoom />}
        {editable && (
          <Grid
            args={[r.width, r.depth]}
            position={[0, 0.003, 0]}
            cellSize={0.5}
            cellThickness={0.4}
            sectionSize={1}
            sectionColor="#89947c"
            fadeDistance={25}
            infiniteGrid={false}
          />
        )}
        <Suspense fallback={null}>
          {scene.objects.map((o) => (
            <Item
              key={o.instanceId}
              object={o}
              asset={assets.find((a) => a.id === o.assetId)}
              editable={editable}
              setDragging={setDragging}
              onError={() => setLoadError(true)}
            />
          ))}
        </Suspense>
        <OrbitControls
          key={reset}
          makeDefault
          enabled={!dragging && !walk}
          target={scene.camera.target}
          maxPolarAngle={Math.PI * 0.49}
          minDistance={1}
          maxDistance={40}
        />
        <Camera scene={scene} reset={reset} walk={walk} />
        <Capture token={capture} onCapture={onCapture} />
        <RenderedFrame />
      </Canvas>
    </CanvasBoundary>
  );
}
