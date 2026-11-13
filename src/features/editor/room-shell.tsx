"use client";
import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { Scene } from "@/lib/scene";
export function RoomShell({ room: r }: { room: Scene["room"] }) {
  const floorMap = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f3eee4";
    ctx.fillRect(0, 0, 512, 512);
    for (let plank = 0; plank < 8; plank++) {
      const y = plank * 64;
      ctx.fillStyle =
        plank % 3 === 0 ? "#ebe5d8" : plank % 3 === 1 ? "#f5f0e6" : "#efe9dd";
      ctx.fillRect(0, y, 512, 64);
      ctx.strokeStyle = "#b7ac97";
      ctx.globalAlpha = 0.23;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(512, y + 0.5);
      ctx.stroke();
      const joint = plank % 2 === 0 ? 190 : 410;
      ctx.beginPath();
      ctx.moveTo(joint, y);
      ctx.lineTo(joint, y + 64);
      ctx.stroke();
      ctx.globalAlpha = 0.09;
      ctx.strokeStyle = "#9c8a6f";
      for (let grain = 0; grain < 5; grain++) {
        ctx.beginPath();
        ctx.moveTo(0, y + 8 + grain * 10);
        ctx.bezierCurveTo(
          140,
          y + 4 + grain * 10,
          300,
          y + 12 + grain * 10,
          512,
          y + 7 + grain * 10,
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(r.width / 3, r.depth / 3);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, [r.width, r.depth]);
  useEffect(() => () => floorMap.dispose(), [floorMap]);
  const wallpaper = useMemo(() => {
    if (!r.wallpaper || r.wallpaper === "none") return null;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = r.wall;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = r.wallpaperColor || "#8b9a7a";
    ctx.fillStyle = r.wallpaperColor || "#8b9a7a";
    if (r.wallpaper === "stripes") {
      ctx.globalAlpha = 0.4;
      ctx.fillRect(0, 0, 50, 256);
      ctx.fillRect(128, 0, 50, 256);
    } else if (r.wallpaper === "arches") {
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 4;
      for (const x of [0, 128, 256]) {
        ctx.beginPath();
        ctx.arc(x, 128, 55, Math.PI, 0);
        ctx.lineTo(x + 55, 256);
        ctx.moveTo(x - 55, 128);
        ctx.lineTo(x - 55, 256);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      for (let i = 0; i < 256; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
      }
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [r.wallpaper, r.wallpaperColor, r.wall]);
  useEffect(() => () => wallpaper?.dispose(), [wallpaper]);
  const surfaces = r.wallpaperWall || "back";
  return (
    <group>
      <mesh receiveShadow castShadow position={[0, -0.07, 0]}>
        <boxGeometry args={[r.width + 0.09, 0.14, r.depth + 0.09]} />
        <meshStandardMaterial color="#b6a48b" roughness={0.8} />
      </mesh>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.003, 0]}
      >
        <planeGeometry args={[r.width, r.depth]} />
        <meshStandardMaterial color={r.floor} map={floorMap} roughness={0.78} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, r.height / 2, -r.depth / 2]}>
        <boxGeometry args={[r.width, r.height, 0.09]} />
        <meshStandardMaterial color={r.wall} roughness={0.9} />
      </mesh>
      <mesh receiveShadow castShadow position={[-r.width / 2, r.height / 2, 0]}>
        <boxGeometry args={[0.09, r.height, r.depth]} />
        <meshStandardMaterial color={r.wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.06, -r.depth / 2 + 0.055]}>
        <boxGeometry args={[r.width, 0.12, 0.025]} />
        <meshStandardMaterial color="#f7f4ec" roughness={0.65} />
      </mesh>
      {wallpaper && (surfaces === "back" || surfaces === "both") && (
        <mesh position={[0, r.height / 2, -r.depth / 2 + 0.046]} receiveShadow>
          <planeGeometry args={[r.width, r.height]} />
          <meshStandardMaterial map={wallpaper} roughness={0.94} />
        </mesh>
      )}
      {wallpaper && (surfaces === "left" || surfaces === "both") && (
        <mesh
          position={[-r.width / 2 + 0.046, r.height / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
          receiveShadow
        >
          <planeGeometry args={[r.depth, r.height]} />
          <meshStandardMaterial map={wallpaper} roughness={0.94} />
        </mesh>
      )}
      <mesh position={[-r.width / 2 + 0.055, 0.06, 0]}>
        <boxGeometry args={[0.025, 0.12, r.depth]} />
        <meshStandardMaterial color="#f7f4ec" roughness={0.65} />
      </mesh>
      <mesh position={[0, r.height + 0.018, -r.depth / 2]}>
        <boxGeometry args={[r.width + 0.08, 0.035, 0.11]} />
        <meshStandardMaterial color="#f7f4ec" />
      </mesh>
      <mesh position={[-r.width / 2, r.height + 0.018, 0]}>
        <boxGeometry args={[0.11, 0.035, r.depth + 0.08]} />
        <meshStandardMaterial color="#f7f4ec" />
      </mesh>
    </group>
  );
}
