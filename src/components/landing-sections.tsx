"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Layers3,
  Move3D,
  Eye,
  ShieldCheck,
  Plus,
  Armchair,
  LampDesk,
  Gamepad2,
  Utensils,
  Monitor,
  BedDouble,
} from "lucide-react";
import { RoomArt } from "./room-art";
const questions = [
  [
    "Do I need to know how to design in 3D?",
    "No. Start with a room, add an object, and move things around. You can use the on-screen handles or enter exact measurements. Undo and redo give you room to experiment.",
  ],
  [
    "How does AI fit into Buildo?",
    "Lux3D creates individual 3D objects from a description when generation is configured. You can also import a genuine Lux3D export. The starting room and the furnished example on this page use procedural geometry; they are not AI-generated outputs.",
  ],
  [
    "Can I bring my own Lux3D models?",
    "Yes. Import a static, self-contained GLB 2.0 export with its task ID, source link, prompt and permission to use it. Models can be up to 25MB, with embedded textures. ZIP files and models with external textures need to be converted before import.",
  ],
  [
    "Is my work public while I’m building?",
    "Your project stays private until you publish. Publishing creates a fixed snapshot with its own share link. Editing your private project afterward does not change that published version.",
  ],
  [
    "Can other people remix my space?",
    "Only when you allow it and every asset in the design permits reuse. A remix becomes a separate project and keeps attribution to the original creator.",
  ],
  [
    "How do challenges work?",
    "An administrator opens a brief with a shared starting room and a schedule. Start from that room, publish your design and submit its snapshot before the deadline. During voting, accounts can vote once per entry, withdraw a vote, and explore the designs. You cannot vote for your own entry.",
  ],
  [
    "Can I use Buildo on my phone?",
    "You can browse previews on your phone. Sign in to explore full rooms with touch gestures to orbit and zoom. The studio also adapts to smaller screens, though a laptop or desktop gives you more room for arranging objects. A browser with WebGL 2 is required.",
  ],
];
export function LandingPossibilities() {
  return (
    <section className="section possibilities-section">
      <div className="section-top">
        <div>
          <div className="eyebrow">Space for every side of you</div>
          <h2>
            What’s on your <em>mind?</em>
          </h2>
        </div>
        <p className="section-description">
          A place to focus. Somewhere to unwind.
          <br />
          Start with the space you wish existed.
        </p>
      </div>
      <div className="possibility-grid">
        {[
          {
            name: "A softer place to land",
            category: "Bedroom",
            icon: BedDouble,
            tone: "sand",
          },
          {
            name: "Room for good company",
            category: "Living room",
            icon: Armchair,
            tone: "sage",
          },
          {
            name: "Your next big idea",
            category: "Office",
            icon: Monitor,
            tone: "clay",
          },
          {
            name: "A table worth gathering around",
            category: "Restaurant",
            icon: Utensils,
            tone: "cream",
          },
          {
            name: "A world within your world",
            category: "Gaming room",
            icon: Gamepad2,
            tone: "moss",
          },
          {
            name: "Something entirely yours",
            category: "Custom indoor space",
            icon: LampDesk,
            tone: "blush",
          },
        ].map((item) => (
          <Link
            href="/projects/new"
            className={`possibility-card ${item.tone}`}
            key={item.category}
          >
            <div className="possibility-top">
              <item.icon size={29} strokeWidth={1.15} />
              <ArrowUpRight size={18} />
            </div>
            <div>
              <span>{item.category}</span>
              <h3>{item.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
export function LandingFeatures() {
  return (
    <section className="section features-section">
      <div className="feature-composition">
        <div className="feature-blueprint">
          <div className="feature-blueprint-label">
            <Layers3 size={15} /> A LITTLE MORE ROOM TO EXPERIMENT
          </div>
          <RoomArt />
          <div className="blueprint-stamp">
            YOUR SPACE
            <br />
            <strong>YOUR PERSPECTIVE.</strong>
          </div>
          <span className="blueprint-coordinate">X / Y / Z</span>
        </div>
        <div className="feature-story">
          <div className="eyebrow">An idea, with room to grow</div>
          <h2>
            Try it. Move it.
            <br />
            <em>Make it yours.</em>
          </h2>
          <p>
            You don’t have to get it right the first time. Buildo gives you the
            tools to find your own way there.
          </p>
          <div className="feature-list">
            {[
              {
                icon: Move3D,
                title: "Every detail in your hands",
                text: "Arrange, rotate and resize your objects. Use exact measurements when your idea calls for them.",
              },
              {
                icon: Eye,
                title: "A whole new point of view",
                text: "Orbit your space or walk through it. See what works from a different angle.",
              },
              {
                icon: ShieldCheck,
                title: "Your process stays yours",
                text: "Save a private draft, then share a fixed snapshot when you’re ready to open the door.",
              },
            ].map((f) => (
              <div className="feature-item" key={f.title}>
                <span>
                  <f.icon size={20} strokeWidth={1.4} />
                </span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/projects/new" className="text-button link-arrow">
            Find your starting point <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
export function LandingFaq() {
  return (
    <section className="section faq-section" id="faq">
      <div className="faq-intro">
        <div className="eyebrow">A little clarity before you create</div>
        <h2>
          Good questions.
          <br />
          <em>Clear answers.</em>
        </h2>
        <p>Here’s what to know about making a space of your own.</p>
        <span className="faq-art" aria-hidden="true">
          ?
        </span>
      </div>
      <div className="faq-list">
        {questions.map(([question, answer]) => (
          <details className="faq-item" key={question}>
            <summary>
              {question}
              <Plus size={18} aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export function LandingInvitation() {
  return (
    <section className="section invitation-section">
      <div className="invitation">
        <div className="eyebrow">Your imagination looks good in 3D</div>
        <h2>
          Make a little room
          <br />
          for <em>something new.</em>
        </h2>
        <p>Your next favorite space starts with an idea.</p>
        <Link href="/projects/new" className="button">
          Let’s build something <ArrowUpRight size={18} />
        </Link>
        <span className="invitation-orbit orbit-one" aria-hidden="true" />
        <span className="invitation-orbit orbit-two" aria-hidden="true" />
      </div>
    </section>
  );
}
