"use client";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutGrid,
  UserRound,
  SunMoon,
  KeyRound,
  ShieldCheck,
  ArrowUpRight,
  Monitor,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { validNewPassword } from "@/lib/password";
import { Private, PageHeading, QueryError, Notice } from "./ui";
import { ThemeSettings } from "./theme";
import { PasswordInput } from "./password-input";
import { PasswordChecklist } from "./password-checklist";

const links = [
  { section: "", label: "Overview", icon: LayoutGrid },
  { section: "profile", label: "Your profile", icon: UserRound },
  { section: "appearance", label: "Appearance", icon: SunMoon },
  { section: "account", label: "Password & sessions", icon: KeyRound },
  { section: "privacy", label: "Privacy", icon: ShieldCheck },
];
type Details = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  providers: string[];
  sessions: { createdAt: string; expiresAt: string }[];
};
export function SettingsPage({ section = "" }: { section?: string }) {
  const cache = useQueryClient();
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Details>("settings"),
  });
  const { data: session } = authClient.useSession();
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");
  const me = q.data;
  async function action(
    run: () => Promise<{ error?: { message?: string } | null }>,
    success: string,
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await run();
      if (result.error)
        throw new Error(result.error.message || "Please try again.");
      setMessage(success);
      await cache.invalidateQueries({ queryKey: ["settings"] });
      await cache.invalidateQueries({ queryKey: ["me"] });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container settings-page">
      <Private>
        <PageHeading
          eyebrow="YOUR WORKSPACE, YOUR WAY"
          title={
            section === ""
              ? "A place of your own."
              : section === "profile"
                ? "The person behind the spaces."
                : section === "appearance"
                  ? "Set the atmosphere."
                  : section === "account"
                    ? "Keep access in your hands."
                    : "Your spaces. Your choice."
          }
        >
          <span className="settings-private">
            <ShieldCheck size={15} />
            Your private workspace
          </span>
        </PageHeading>
        <nav className="settings-dock" aria-label="Settings navigation">
          {links.map(({ section: tab, label, icon: Icon }) => (
            <Link
              key={tab}
              href={`/settings${tab ? `/${tab}` : ""}`}
              aria-current={section === tab ? "page" : undefined}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        {q.error && <QueryError error={q.error} retry={q.refetch} />}
        {error && <Notice error>{error}</Notice>}
        {message && (
          <div className="notice" role="status">
            <Check size={15} /> {message}
          </div>
        )}
        {section === "" && (
          <>
            <Link className="settings-profile-feature" href="/settings/profile">
              <span className="settings-avatar">
                {(me?.name || session?.user.name || "B")
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
              <div>
                <span className="eyebrow">THE PERSON BEHIND THE IDEAS</span>
                <h2>{me?.name || session?.user.name || "Your profile"}</h2>
                <p>
                  Make yourself at home. Manage your profile, appearance and
                  account in one place.
                </p>
              </div>
              <ArrowUpRight size={22} />
            </Link>
            <div className="settings-directory">
              {links.slice(2).map(({ section: tab, label, icon: Icon }) => (
                <Link href={`/settings/${tab}`} key={tab}>
                  <span className="settings-card-top">
                    <Icon size={22} />
                    <ArrowUpRight size={17} />
                  </span>
                  <h2>{label}</h2>
                  <p>
                    {tab === "appearance"
                      ? "Light, dark or in tune with your device."
                      : tab === "account"
                        ? "Manage your password and signed-in sessions."
                        : "Understand what stays private and what you share."}
                  </p>
                </Link>
              ))}
            </div>
            <ThemeSettings />
          </>
        )}
        {section === "appearance" && <ThemeSettings />}
        {section === "profile" && (
          <section className="settings-panel">
            <div>
              <span className="settings-section-icon">
                <UserRound size={23} />
              </span>
              <span className="eyebrow">YOUR CREATOR IDENTITY</span>
              <h2>A name for your ideas.</h2>
              <p>
                Your display name appears on designs you publish. Your email
                stays private.
              </p>
            </div>
            <form
              className="form"
              aria-label="Profile details"
              onSubmit={(e) => {
                e.preventDefault();
                const values = new FormData(e.currentTarget);
                void action(
                  () =>
                    authClient.updateUser({
                      name: String(values.get("name")).trim(),
                    }),
                  "Profile saved.",
                );
              }}
            >
              <label>
                Display name
                <input
                  name="name"
                  key={me?.name}
                  defaultValue={me?.name}
                  required
                  maxLength={80}
                />
              </label>
              <label>
                Email address
                <input value={me?.email || ""} readOnly type="email" />
              </label>
              <small>
                Email changes require email verification, which is not
                configured yet.
              </small>
              <button className="button" disabled={busy || !me}>
                {busy ? "Saving…" : "Save profile"}
              </button>
            </form>
          </section>
        )}
        {section === "account" && (
          <>
            <section className="settings-panel">
              <div>
                <span className="settings-section-icon">
                  <KeyRound size={23} />
                </span>
                <span className="eyebrow">ACCOUNT ACCESS</span>
                <h2>Your sign-in methods.</h2>
                <p>
                  {me?.providers.includes("google")
                    ? "Google is connected to your account."
                    : "Your email and password keep your workspace accessible."}
                </p>
              </div>
              {me?.providers.includes("credential") ? (
                <form
                  className="form"
                  aria-label="Change password"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void action(
                      () =>
                        authClient.changePassword({
                          currentPassword: String(f.get("currentPassword")),
                          newPassword: password,
                          revokeOtherSessions: true,
                        }),
                      "Password changed. Other sessions have been signed out.",
                    ).then((saved) => {
                      if (!saved) return;
                      setPassword("");
                      setConfirmation("");
                    });
                  }}
                >
                  <label>
                    Current password
                    <PasswordInput
                      name="currentPassword"
                      autoComplete="current-password"
                      required
                      visibilityLabel="current password"
                    />
                  </label>
                  <label>
                    New password
                    <PasswordInput
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      visibilityLabel="new password"
                    />
                  </label>
                  <label>
                    Confirm new password
                    <PasswordInput
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      autoComplete="new-password"
                      required
                      visibilityLabel="confirm new password"
                    />
                  </label>
                  <PasswordChecklist
                    password={password}
                    confirmation={confirmation}
                  />
                  <button
                    className="button"
                    disabled={
                      busy ||
                      !validNewPassword(password) ||
                      password !== confirmation
                    }
                  >
                    Change password
                  </button>
                </form>
              ) : (
                <div className="settings-info">
                  <ShieldCheck size={25} />
                  <h3>Connected through Google</h3>
                  <p>
                    Manage your Google password through your Google account.
                    Adding a Buildo password requires the email recovery flow,
                    which is not configured yet.
                  </p>
                  <a
                    className="button secondary"
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google account security <ArrowUpRight size={15} />
                  </a>
                </div>
              )}
            </section>
            <section className="settings-panel">
              <div>
                <span className="settings-section-icon">
                  <Monitor size={23} />
                </span>
                <span className="eyebrow">SIGNED-IN SESSIONS</span>
                <h2>A little peace of mind.</h2>
                <p>Keep this browser signed in and end your other sessions.</p>
              </div>
              <div>
                <div className="settings-session-list">
                  {me?.sessions.map((s, i) => (
                    <div key={`${s.createdAt}-${i}`}>
                      <Monitor size={18} />
                      <span>
                        Session started{" "}
                        {new Date(s.createdAt).toLocaleDateString()}
                        <small>
                          Expires {new Date(s.expiresAt).toLocaleDateString()}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className="button secondary"
                  disabled={busy || !me || me.sessions.length < 2}
                  onClick={() =>
                    void action(
                      () => authClient.revokeOtherSessions(),
                      "Other sessions signed out.",
                    )
                  }
                >
                  Sign out other sessions
                </button>
              </div>
            </section>
          </>
        )}
        {section === "privacy" && (
          <section className="settings-panel">
            <div>
              <span className="settings-section-icon">
                <ShieldCheck size={23} />
              </span>
              <span className="eyebrow">PRIVATE UNTIL YOU SHARE</span>
              <h2>Build at your own pace.</h2>
              <p>
                Your unpublished rooms and asset library are visible only to
                you.
              </p>
            </div>
            <div className="settings-privacy-copy">
              <h3>Publishing is a deliberate step</h3>
              <p>
                Share / Publish creates a fixed snapshot. Later edits stay
                private until you publish another version.
              </p>
              <h3>Remixing is your choice</h3>
              <p>
                Allow remixing only when every asset permits it. Copies retain
                attribution to the original design.
              </p>
              <h3>Your account information</h3>
              <p>
                Your email and sign-in details are never included in public
                creator profiles or designs. Account deletion and data export
                are not available in this build.
              </p>
              <Link className="button secondary" href="/dashboard">
                Manage your spaces <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>
        )}
        <p className="settings-footnote">
          <ShieldCheck size={14} /> Profile and account settings stay private.
        </p>
      </Private>
    </div>
  );
}
