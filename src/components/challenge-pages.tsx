"use client";
import {
  CommunityGate,
  PreviewLabel,
  useCommunityViewer,
} from "./community-access";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { api, post } from "@/lib/api";
import { defaultScene, type Scene } from "@/lib/scene";
import {
  Empty,
  Notice,
  PageHeading,
  Private,
  QueryError,
  Pagination,
} from "./ui";
type Challenge = {
  id: string;
  title: string;
  theme: string;
  rules: string;
  phase: string;
  status: string;
  room: Scene["room"];
  templateVersion: string;
  opensAt: string;
  submissionsCloseAt: string;
  votingCloseAt: string;
};
type Entry = {
  id: string;
  rank: number;
  ownerId: string;
  votes: number;
  voted: boolean;
  publication: { id: string; title: string; creatorName: string };
  submittedAt: string;
};
function date(value: string) {
  return new Date(value).toLocaleString();
}
export function Challenges() {
  const { viewer } = useCommunityViewer();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["challenges", viewer, page],
    queryFn: () =>
      api<{ items: Challenge[]; preview: boolean; hasNext: boolean }>(
        `challenges?page=${page}`,
      ),
  });
  return (
    <div className="container">
      {q.data?.preview && <PreviewLabel />}
      <PageHeading
        eyebrow="A creative challenge"
        title="Same room. New possibilities."
      >
        A shared starting point is just the beginning. Show everyone what you
        see.
      </PageHeading>
      {q.isPending ? (
        <Notice>Loading challenges…</Notice>
      ) : q.error ? (
        <QueryError error={q.error} retry={q.refetch} />
      ) : q.data.items.length ? (
        <div className="grid">
          {q.data.items.map((c) => (
            <Link
              className="card card-body"
              href={`/challenges/${c.id}`}
              key={c.id}
            >
              <span className="pill">{c.phase}</span>
              <h2 style={{ marginTop: 24 }}>{c.title}</h2>
              <p>{c.theme}</p>
              <small>Submissions close {date(c.submissionsCloseAt)}</small>
              <p className="text-button">Explore the brief ↗</p>
            </Link>
          ))}
        </div>
      ) : (
        <Empty title="The next brief is taking shape.">
          There are no public challenges yet. An administrator will open the
          first real challenge when it’s ready.
        </Empty>
      )}
      {q.data?.preview ? (
        <CommunityGate
          next="/challenges"
          title="Find your next creative challenge."
        >
          Sign in to read the full brief, explore entries, and join in during
          the challenge windows.
        </CommunityGate>
      ) : (
        <Pagination
          page={page}
          onChange={setPage}
          hasNext={q.data?.hasNext || false}
        />
      )}
    </div>
  );
}
export function ChallengeDetail({ id }: { id: string }) {
  const { viewer } = useCommunityViewer();
  const [entryPage, setEntryPage] = useState(1);
  const [error, setError] = useState("");
  const [publicationId, setPublicationId] = useState("");
  const q = useQuery({
    queryKey: ["challenge", viewer, id],
    queryFn: () => api<Challenge & { preview: boolean }>(`challenges/${id}`),
    refetchInterval: 60000,
  });
  const entries = useQuery({
    queryKey: ["entries", viewer, id, entryPage],
    enabled: q.data?.preview === false,
    queryFn: () =>
      api<{ items: Entry[]; resultsFinal: boolean }>(
        `challenges/${id}/submissions?page=${entryPage}`,
      ),
  });
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ id: string }>("me"),
    retry: false,
  });
  if (q.isPending)
    return (
      <div className="container">
        <Notice>Opening the brief…</Notice>
      </div>
    );
  if (q.error)
    return (
      <div className="container">
        <QueryError error={q.error} retry={q.refetch} />
      </div>
    );
  const c = q.data;
  if (c.preview)
    return (
      <div className="container">
        <PreviewLabel />
        <PageHeading eyebrow={`Challenge / ${c.phase}`} title={c.title}>
          {c.theme}
        </PageHeading>
        <div className="challenge-preview-card">
          <div>
            <Trophy size={30} strokeWidth={1.2} />
            <h2>
              A shared starting point.
              <br />
              Your own perspective.
            </h2>
            <p>Submissions close {date(c.submissionsCloseAt)}.</p>
          </div>
          <CommunityGate
            next={`/challenges/${id}`}
            title="See the whole challenge."
          >
            Sign in for the full rules, starting room, community entries, and
            voting.
          </CommunityGate>
        </div>
      </div>
    );
  return (
    <div className="container">
      <PageHeading
        eyebrow={`Challenge / ${c.phase}`}
        title={c.title}
        action={
          c.phase === "open" ? (
            <Link className="button" href={`/projects/new?challenge=${id}`}>
              Start with this room ↗
            </Link>
          ) : undefined
        }
      >
        {c.theme}
      </PageHeading>
      <div className="two-col">
        <div>
          <h2>The brief</h2>
          <p className="rules">{c.rules}</p>
          <Notice>
            Everyone begins with a {c.room.width} × {c.room.depth} ×{" "}
            {c.room.height} m room. The starting dimensions are pinned for this
            challenge.
          </Notice>
        </div>
        <div className="form-card">
          <h3>Your timeline</h3>
          <p>
            Opens: {date(c.opensAt)}
            <br />
            Submissions close: {date(c.submissionsCloseAt)}
            <br />
            Voting closes: {date(c.votingCloseAt)}
          </p>
          <small>
            Times shown in your local timezone. One immutable entry per account.
            One vote per account per entry; no self-votes. Ties go to the
            earlier submission.
          </small>
        </div>
      </div>
      {c.phase === "open" && (
        <section className="form-card results">
          <h2>Ready to enter?</h2>
          <p>
            Publish your challenge project from its studio. Paste the published
            design ID from its share URL below. Your submitted snapshot stays
            fixed.
          </p>
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await post(`challenges/${id}/submissions`, { publicationId });
                setError("Your entry has been submitted.");
                await entries.refetch();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label>
              Published design ID
              <input
                required
                pattern="[a-fA-F0-9]{24}"
                value={publicationId}
                onChange={(e) => setPublicationId(e.target.value)}
                placeholder="The ID after /designs/ in your share link"
              />
            </label>
            <button className="button">Submit this snapshot</button>
          </form>
        </section>
      )}
      {error && <Notice>{error}</Notice>}
      <section className="results">
        <h2>{c.phase === "closed" ? "Final results" : "Community entries"}</h2>
        {entries.error ? (
          <QueryError error={entries.error} retry={entries.refetch} />
        ) : !entries.data?.items.length ? (
          <Empty title="A blank canvas for the community.">
            Submitted designs will appear here. There are no entries yet.
          </Empty>
        ) : (
          entries.data.items.map((s) => (
            <div className="entry" key={s.id}>
              <span className="pill">#{s.rank}</span>
              <div>
                <Link href={`/designs/${s.publication.id}`}>
                  <h3>{s.publication.title}</h3>
                </Link>
                <small>
                  By {s.publication.creatorName} · {s.votes}{" "}
                  {s.votes === 1 ? "vote" : "votes"}
                </small>
              </div>
              <div className="actions">
                <Link
                  className="button secondary"
                  href={`/designs/${s.publication.id}`}
                >
                  Visit space ↗
                </Link>
                {c.phase === "voting" && s.ownerId !== me.data?.id && (
                  <button
                    className="button"
                    onClick={async () => {
                      try {
                        await post(
                          `challenges/${id}/votes`,
                          { submissionId: s.id },
                          s.voted ? "DELETE" : "POST",
                        );
                        await entries.refetch();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    {s.voted ? "Withdraw vote" : "Vote"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <Pagination
          page={entryPage}
          onChange={setEntryPage}
          hasNext={(entries.data?.items.length || 0) === 18}
        />
      </section>
    </div>
  );
}
export function AdminChallenges() {
  const [error, setError] = useState("");
  const q = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: () => api<{ items: Challenge[] }>("challenges?admin=true"),
  });
  return (
    <div className="container">
      <Private admin>
        <PageHeading eyebrow="Administration" title="Open a new possibility.">
          Create a real challenge. Activating freezes its starting room and
          schedule.
        </PageHeading>
        <div className="two-col">
          <form
            className="form form-card"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              try {
                await post("challenges", {
                  title: f.get("title"),
                  theme: f.get("theme"),
                  rules: f.get("rules"),
                  room: defaultScene.room,
                  opensAt: new Date(String(f.get("opensAt"))).toISOString(),
                  submissionsCloseAt: new Date(
                    String(f.get("submissionsCloseAt")),
                  ).toISOString(),
                  votingCloseAt: new Date(
                    String(f.get("votingCloseAt")),
                  ).toISOString(),
                  status: f.get("status"),
                });
                form.reset();
                setError("Challenge created.");
                await q.refetch();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label>
              Title
              <input
                name="title"
                required
                minLength={3}
                maxLength={100}
                placeholder="Small Space, Big Ideas"
              />
            </label>
            <label>
              Theme
              <input name="theme" required minLength={3} maxLength={300} />
            </label>
            <label>
              Rules
              <textarea name="rules" required minLength={10} maxLength={3000} />
            </label>
            {[
              ["opensAt", "Submissions open"],
              ["submissionsCloseAt", "Submissions close / voting opens"],
              ["votingCloseAt", "Voting closes"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input name={name} type="datetime-local" required />
              </label>
            ))}
            <label>
              Status
              <select name="status">
                <option value="draft">Draft</option>
                <option value="active">Activate</option>
              </select>
            </label>
            <small>
              Starting template: 5 × 4 × 2.8 m procedural room. Local times
              convert to UTC on submission.
            </small>
            <button className="button">Create challenge</button>
            {error && <Notice>{error}</Notice>}
          </form>
          <div>
            {q.error ? (
              <QueryError error={q.error} retry={q.refetch} />
            ) : (
              q.data?.items.map((c) => (
                <div className="card card-body" key={c.id}>
                  <h3>{c.title}</h3>
                  <p>{c.phase}</p>
                  {c.status === "draft" ? (
                    <button
                      className="button secondary"
                      onClick={async () => {
                        try {
                          await post(
                            `challenges/${c.id}`,
                            {
                              title: c.title,
                              theme: c.theme,
                              rules: c.rules,
                              room: c.room,
                              opensAt: c.opensAt,
                              submissionsCloseAt: c.submissionsCloseAt,
                              votingCloseAt: c.votingCloseAt,
                              status: "active",
                            },
                            "PATCH",
                          );
                          await q.refetch();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Activate pinned challenge
                    </button>
                  ) : (
                    <Link className="text-button" href={`/challenges/${c.id}`}>
                      View challenge ↗
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Private>
    </div>
  );
}
