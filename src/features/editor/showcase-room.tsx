"use client";

import { RoundedBox, ContactShadows } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type PieceProps = { size: [number, number, number]; color: string } & Omit<
  ThreeElements["group"],
  "args"
>;
function SoftPiece({ size, color, ...props }: PieceProps) {
  return (
    <group {...props}>
      <RoundedBox
        args={size}
        radius={0.07}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={0.95} />
      </RoundedBox>
    </group>
  );
}
function Plant() {
  return (
    <group position={[1.92, 0, -1.45]}>
      <mesh castShadow receiveShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.23, 0.16, 0.48, 28]} />
        <meshStandardMaterial color="#ac6348" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.025, 24]} />
        <meshStandardMaterial color="#594435" />
      </mesh>
      {[
        [-0.28, 1.05, 0.05, 0.55],
        [0.25, 1.25, 0.05, -0.5],
        [-0.08, 1.55, -0.05, 0.15],
        [0.3, 0.85, 0.17, -0.8],
        [-0.26, 0.75, 0.22, 0.9],
        [0.14, 1.6, 0.08, -0.35],
      ].map(([x, y, z, angle], i) => (
        <group key={i}>
          <mesh
            position={[x / 2, (y + 0.47) / 2, z / 2]}
            rotation={[0, 0, -Math.atan2(x, y - 0.47)]}
          >
            <cylinderGeometry
              args={[0.012, 0.012, Math.hypot(x, y - 0.47), 7]}
            />
            <meshStandardMaterial color="#5f7147" />
          </mesh>
          <mesh
            castShadow
            position={[x, y, z]}
            rotation={[0.3, i * 0.9, angle]}
            scale={[0.14, 0.34, 0.07]}
          >
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial
              color={i % 2 ? "#667a4b" : "#82945c"}
              roughness={0.85}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Original procedural illustration, used only by the landing preview. Never an asset, generation or community publication.
export function ShowcaseRoom() {
  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.15, 0.014, 0.25]}
      >
        <planeGeometry args={[3.05, 2.15]} />
        <meshStandardMaterial color="#e7dfcc" roughness={1} />
      </mesh>
      <group position={[-0.05, 0, -1.2]}>
        {[-1.12, 1.12].flatMap((x) =>
          [-0.34, 0.34].map((z) => (
            <mesh key={`${x}:${z}`} position={[x, 0.16, z]} castShadow>
              <cylinderGeometry args={[0.055, 0.045, 0.32, 12]} />
              <meshStandardMaterial color="#765b40" />
            </mesh>
          )),
        )}
        <SoftPiece
          size={[2.85, 0.36, 1.05]}
          position={[0, 0.44, 0]}
          color="#d4c9b2"
        />
        <SoftPiece
          size={[2.85, 0.69, 0.22]}
          position={[0, 0.88, -0.45]}
          color="#dcd3bf"
        />
        <SoftPiece
          size={[0.23, 0.53, 1.03]}
          position={[-1.35, 0.75, 0.02]}
          color="#e0d6c2"
        />
        <SoftPiece
          size={[0.23, 0.53, 1.03]}
          position={[1.35, 0.75, 0.02]}
          color="#e0d6c2"
        />
        {[-0.64, 0.64].map((x) => (
          <SoftPiece
            key={x}
            size={[1.2, 0.22, 0.79]}
            position={[x, 0.7, 0.08]}
            color="#eee6d5"
          />
        ))}
        <SoftPiece
          size={[0.48, 0.5, 0.17]}
          position={[-0.92, 0.99, -0.18]}
          rotation={[0.08, 0, 0.17]}
          color="#a3ab84"
        />
        <SoftPiece
          size={[0.45, 0.46, 0.17]}
          position={[0.85, 0.97, -0.18]}
          rotation={[0.08, 0, -0.18]}
          color="#b97250"
        />
      </group>
      <group position={[0.18, 0, 0.45]}>
        <mesh
          castShadow
          receiveShadow
          position={[0, 0.5, 0]}
          scale={[1, 1, 0.75]}
        >
          <cylinderGeometry args={[0.68, 0.68, 0.09, 48]} />
          <meshStandardMaterial color="#ab8053" roughness={0.6} />
        </mesh>
        {[-0.34, 0.34].map((x) => (
          <mesh key={x} position={[x, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.49, 20]} />
            <meshStandardMaterial color="#916b45" roughness={0.7} />
          </mesh>
        ))}
        <mesh
          position={[-0.15, 0.567, 0.04]}
          rotation={[0, 0.15, 0]}
          castShadow
        >
          <boxGeometry args={[0.34, 0.035, 0.25]} />
          <meshStandardMaterial color="#eee7d8" />
        </mesh>
        <mesh
          position={[-0.14, 0.59, 0.03]}
          rotation={[0, -0.12, 0]}
          castShadow
        >
          <boxGeometry args={[0.32, 0.025, 0.23]} />
          <meshStandardMaterial color="#737a5b" />
        </mesh>
        <mesh castShadow position={[0.29, 0.607, -0.06]}>
          <cylinderGeometry args={[0.065, 0.055, 0.12, 20]} />
          <meshStandardMaterial color="#f3e9d7" roughness={0.5} />
        </mesh>
        <mesh position={[0.29, 0.669, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 20]} />
          <meshStandardMaterial color="#644a35" />
        </mesh>
      </group>
      <group position={[-1.9, 0, -0.9]}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.29, 0.29, 0.07, 28]} />
          <meshStandardMaterial color="#af8158" />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.55, 20]} />
          <meshStandardMaterial color="#8d6644" />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.11, 20, 12]} />
          <meshStandardMaterial color="#c0805a" />
        </mesh>
      </group>
      <group position={[0.15, 1.98, -1.94]}>
        <mesh castShadow>
          <boxGeometry args={[1.05, 0.88, 0.055]} />
          <meshStandardMaterial color="#7d5e40" />
        </mesh>
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[0.94, 0.77]} />
          <meshStandardMaterial color="#ece4d2" />
        </mesh>
        <mesh position={[-0.12, 0.1, 0.037]}>
          <circleGeometry args={[0.22, 40]} />
          <meshStandardMaterial color="#ba7151" />
        </mesh>
        <mesh position={[0.17, -0.16, 0.04]}>
          <planeGeometry args={[0.29, 0.32]} />
          <meshStandardMaterial color="#8c9677" />
        </mesh>
      </group>
      <Plant />
      <ContactShadows
        frames={1}
        position={[0, 0.018, 0]}
        scale={8}
        opacity={0.28}
        blur={2.2}
        far={4}
        resolution={512}
        color="#726047"
      />
    </group>
  );
}
