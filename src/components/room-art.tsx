import { useId } from "react";
import type { Scene } from "@/lib/scene";
export function RoomArt({ scene }: { scene?: Scene }) {
  const gradientId = useId();
  return (
    <svg
      className="room-art"
      viewBox="0 0 320 200"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="60"
          y1="90"
          x2="250"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e3d4bf" />
          <stop offset="1" stopColor="#f4e9d8" />
        </linearGradient>
      </defs>
      <ellipse cx="161" cy="165" rx="94" ry="17" fill="#303c2c" opacity=".05" />
      <path
        d="M63 116 160 70 257 116 160 165Z"
        fill={`url(#${gradientId})`}
        stroke="#c3b49f"
      />
      <path
        d="M63 116V46L160 8V70M160 8 257 46V116"
        stroke="#8d9984"
        strokeWidth="1.2"
      />
      <path
        d="M63 46 160 91 257 46M160 91V165"
        stroke="#9ca68e"
        strokeWidth="1.2"
      />
      <path d="M102 65V94L136 109V81Z" stroke="#c0c8b5" />
      <path
        d="m82 125 97-46m-77 56 97-46m-77 56 97-46m-77 56 97-46"
        stroke="#fffefa"
        strokeOpacity=".55"
      />
      {scene?.objects.slice(0, 10).map((o, i) => (
        <circle
          key={o.instanceId}
          cx={160 + o.position[0] * 12 - o.position[2] * 11}
          cy={118 + o.position[0] * 6 + o.position[2] * 6}
          r={Math.max(3, Math.min(10, o.scale[0] * 5))}
          fill="#ee6038"
          fillOpacity={0.8 - i * 0.035}
        />
      ))}
      <circle cx="257" cy="46" r="4" fill="#ee6038" />
      <circle cx="257" cy="46" r="10" stroke="#ee6038" strokeOpacity=".2" />
    </svg>
  );
}
