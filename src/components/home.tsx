"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  MousePointer2,
  Sparkles,
  Move3D,
  ScanEye,
  Box,
  Plus,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { LazyViewport } from "@/features/editor/lazy-viewport";
import { defaultScene, type Scene } from "@/lib/scene";
import {
  LandingPossibilities,
  LandingFeatures,
  LandingFaq,
  LandingInvitation,
} from "@/components/landing-sections";
import { RoomArt } from "@/components/room-art";
const finishes = [
  { name: "Warm oak", floor: "#c5ab85", wall: "#eae4d6", chip: "#c5ab85" },
  { name: "Soft sage", floor: "#c3c6ac", wall: "#e1e7d9", chip: "#a7b59a" },
  { name: "Terracotta", floor: "#c68f74", wall: "#f0e4d7", chip: "#c68f74" },
];
export default function Home() {
  const [finish, setFinish] = useState(0);
  const [furnished, setFurnished] = useState(true);
  const reducedMotion = useReducedMotion();
  const scene = useMemo<Scene>(
    () => ({
      ...defaultScene,
      camera: { position: [6.7, 5.3, 7], target: [0, 0.8, 0] },
      room: {
        ...defaultScene.room,
        floor: finishes[finish].floor,
        wall: finishes[finish].wall,
      },
    }),
    [finish],
  );
  return (
    <>
      <section className="hero">
        <motion.div
          className="hero-copy"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="hero-kicker">
            <span className="kicker-symbol">
              <Sparkles size={13} />
            </span>
            BIG IDEAS. MEET YOUR NEW PLAYGROUND.
          </div>
          <h1>
            Your ideas.
            <br />
            Your space.
            <br />
            <em>Built by you.</em>
          </h1>
          <p>
            A quiet corner. A bold new world. Turn your imagination into a space
            you can step inside, and make every detail your own.
          </p>
          <div className="actions">
            <Link className="button" href="/projects/new">
              Create a space <ArrowUpRight size={17} />
            </Link>
            <Link className="button secondary" href="/explore">
              Explore designs <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="tiny-cube">
              <Box size={15} />
            </span>
            <span>From a little “what if” to a world of your own.</span>
          </div>
        </motion.div>
        <div className="hero-stage">
          <div className="hero-preview">
            <div className="preview-label">
              <span className="canvas-badge">
                <span className="status-dot" /> INTERACTIVE ROOM STUDY
              </span>
              <span className="preview-index">SPACE / 001</span>
            </div>
            <LazyViewport scene={scene} assets={[]} showcase={furnished} />
            <div className="study-toggle" aria-label="Room preview style">
              <button
                aria-pressed={furnished}
                onClick={() => setFurnished(true)}
              >
                Room study
              </button>
              <button
                aria-pressed={!furnished}
                onClick={() => setFurnished(false)}
              >
                Blank canvas
              </button>
            </div>
            <div className="preview-dimension">
              <span>5.0 m</span>
              <i />
              <span>4.0 m</span>
            </div>
            <div className="preview-bottom">
              <span>
                <MousePointer2 size={12} /> Drag to explore
              </span>
              <span>
                YOURS TO REIMAGINE <ArrowUpRight size={12} />
              </span>
            </div>
          </div>
          <div className="canvas-caption">
            <div>
              <span className="caption-eyebrow">
                EVERY GREAT SPACE STARTS SOMEWHERE
              </span>
              <h2>
                A quiet kind of possibility<span>.</span>
              </h2>
              <p>
                Built-in room study. Room and furniture are procedural geometry.
              </p>
            </div>
            <div className="finish-picker" aria-label="Preview room finish">
              {finishes.map((f, i) => (
                <button
                  key={f.name}
                  className={`finish-option ${finish === i ? "selected" : ""}`}
                  aria-label={`Preview ${f.name} finish`}
                  aria-pressed={finish === i}
                  title={f.name}
                  onClick={() => setFinish(i)}
                >
                  <span style={{ background: f.chip }} />
                </button>
              ))}
              <span>{finishes[finish].name}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section process-section">
        <div className="section-top">
          <div>
            <div className="eyebrow">A little imagination goes a long way</div>
            <h2>
              Make something <em>only you</em> could.
            </h2>
          </div>
          <span className="section-aside">
            No perfect plan needed.
            <br />
            Just a place to start.
          </span>
        </div>
        <div className="steps">
          {[
            {
              number: "01",
              label: "IMAGINE IT",
              icon: Sparkles,
              title: "A spark is all it takes.",
              text: "Start with a room and an idea. Describe an object, or bring your own Lux3D creation into the picture.",
            },
            {
              number: "02",
              label: "BUILD IT",
              icon: Move3D,
              title: "Find your kind of right.",
              text: "Move things around. Try a different angle. Adjust the mood until every corner feels a little more like you.",
            },
            {
              number: "03",
              label: "EXPLORE IT",
              icon: ScanEye,
              title: "Open the door to more.",
              text: "Step inside your space. Share a new perspective, or take someone else’s idea in a whole new direction.",
            },
          ].map((step) => (
            <div className="step" key={step.number}>
              <div className="step-top">
                <span>
                  {step.number} / {step.label}
                </span>
                <div className="step-icon">
                  <step.icon size={23} strokeWidth={1.35} />
                </div>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <div className="step-rule" />
            </div>
          ))}
        </div>
      </section>
      <LandingPossibilities />
      <LandingFeatures />
      <section className="section community-section">
        <div className="section-top">
          <div>
            <div className="eyebrow">A different way to see things</div>
            <h2>Good spaces start with curiosity.</h2>
          </div>
          <Link className="text-button link-arrow" href="/explore">
            Visit the gallery <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="challenge-banner">
          <div className="challenge-art">
            <RoomArt />
          </div>
          <div className="challenge-copy">
            <span className="challenge-label">
              <Plus size={12} /> A SHARED START. AN ORIGINAL PERSPECTIVE.
            </span>
            <h2>
              Small space.
              <br />
              <em>Big possibilities.</em>
            </h2>
            <p>
              One room can hold a thousand different ideas. Take on a creative
              brief and show everyone what you see.
            </p>
            <Link className="button" href="/challenges">
              Find a challenge <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="challenge-side-note">
            SAME ROOM.
            <br />
            YOUR RULES.
            <br />
            <span>LET’S SEE WHAT YOU MAKE.</span>
          </div>
        </div>
      </section>
      <LandingFaq />
      <LandingInvitation />
    </>
  );
}
