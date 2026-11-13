"use client";
import { safeReturnPath, signInPath } from "@/lib/return-path";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PasswordChecklist } from "./password-checklist";
import { passwordChecklist } from "@/lib/password";
import { PasswordInput } from "./password-input";
import { Notice } from "./ui";
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const cache = useQueryClient();
  const [returnPath, setReturnPath] = useState("/dashboard");
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => api<{ googleAuth: boolean }>("config"),
  });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const ready = passwordChecklist(password, confirmation).every(
    (check) => check.met,
  );
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setReturnPath(
      safeReturnPath(new URLSearchParams(window.location.search).get("next")),
    );
    if (new URLSearchParams(window.location.search).get("error") === "google")
      setError(
        "Google sign-in was not completed. Please try again or continue with email.",
      );
  }, []);
  return (
    <div className="container">
      <div
        className={`auth-card form-card ${register ? "registration-card" : ""}`}
      >
        <div className="eyebrow">Your next space</div>
        <h1>{register ? "Make yourself at home." : "Welcome back."}</h1>
        <p>
          {register
            ? "Create your account to start building."
            : "Your ideas are right where you left them."}
        </p>
        <button
          type="button"
          className="button secondary google-button"
          disabled={busy || googleBusy || !config.data?.googleAuth}
          onClick={async () => {
            setError("");
            setGoogleBusy(true);
            try {
              const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: returnPath,
                errorCallbackURL: signInPath(returnPath) + "&error=google",
              });
              if (result.error) {
                setError(
                  result.error.message ||
                    "Google sign-in could not be started. Please try again.",
                );
                setGoogleBusy(false);
              }
            } catch {
              setError(
                "Google sign-in is unavailable. Please try again or use email.",
              );
              setGoogleBusy(false);
            }
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.1H3.07v2.59A10 10 0 0 0 12 22Z"
            />
            <path
              fill="#FBBC05"
              d="M6.41 13.94A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.94V7.47H3.07A10 10 0 0 0 2 12c0 1.61.38 3.14 1.07 4.53l3.34-2.59Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.96c1.47 0 2.79.5 3.83 1.5L18.7 4.6A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.47l3.34 2.59A5.99 5.99 0 0 1 12 5.96Z"
            />
          </svg>
          {googleBusy ? "Connecting to Google…" : "Continue with Google"}
        </button>
        {config.isPending ? (
          <p className="auth-provider-note" role="status">
            Checking sign-in options…
          </p>
        ) : (
          !config.data?.googleAuth && (
            <p className="auth-provider-note">
              Google sign-in is not available yet. You can continue with email.
            </p>
          )
        )}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>
        {error && <Notice error>{error}</Notice>}
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            if (register && !ready) {
              setError(
                "Complete all six password checks before creating your account.",
              );
              return;
            }
            setBusy(true);
            const f = new FormData(e.currentTarget);
            try {
              const credentials = {
                email: String(f.get("email")),
                password: String(f.get("password")),
              };
              const result = register
                ? await authClient.signUp.email({
                    ...credentials,
                    name: String(f.get("name")),
                  })
                : await authClient.signIn.email(credentials);
              if (result.error) {
                setError(result.error.message || "Could not sign in.");
                return;
              }
              cache.clear();
              router.push(returnPath);
              router.refresh();
            } catch {
              setError(
                "Account services are currently unavailable. Please try again later.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {register && (
            <label>
              Display name
              <input name="name" required maxLength={80} autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label htmlFor="account-password">Password</label>
          <PasswordInput
            id="account-password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            aria-describedby={register ? "password-checklist-title" : undefined}
            required
            minLength={10}
            maxLength={128}
            autoComplete={register ? "new-password" : "current-password"}
          />
          {register && (
            <>
              <label htmlFor="account-confirm-password">Confirm password</label>
              <PasswordInput
                id="account-confirm-password"
                name="confirmPassword"
                visibilityLabel="confirm password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.currentTarget.value)}
                required
                maxLength={128}
                autoComplete="new-password"
                aria-describedby="password-checklist-title"
                aria-invalid={
                  confirmation.length > 0 && confirmation !== password
                }
              />
              <PasswordChecklist
                password={password}
                confirmation={confirmation}
              />
            </>
          )}

          <button
            disabled={busy || googleBusy || (register && !ready)}
            className="button"
          >
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}{" "}
            <span>↗</span>
          </button>
          <p className="subtle">
            {register ? "Already have an account?" : "New to Buildo?"}{" "}
            <Link
              className="text-button"
              href={signInPath(returnPath, !register)}
            >
              {register ? "Sign in" : "Create account"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
