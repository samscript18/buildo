"use client";
import dynamic from "next/dynamic";
export const LazyViewport = dynamic(() => import("./viewport"), {
  ssr: false,
  loading: () => <div className="loading">Opening the 3D view…</div>,
});
