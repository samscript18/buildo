"use client";
import { Check, KeyRound } from "lucide-react";
import { passwordChecklist } from "@/lib/password";
export function PasswordChecklist({
  password,
  confirmation,
}: {
  password: string;
  confirmation: string;
}) {
  const checks = passwordChecklist(password, confirmation);
  const passed = checks.filter((c) => c.met).length;
  return (
    <section
      className="password-checklist"
      aria-labelledby="password-checklist-title"
    >
      <div className="password-checklist-body">
        <div className="password-checklist-heading">
          <span className="password-key" aria-hidden="true">
            <KeyRound size={24} strokeWidth={1.5} />
          </span>
          <div>
            <h2 id="password-checklist-title">Your password checklist</h2>
            <p>A clear checklist for your new password.</p>
          </div>
          <span
            className={`password-check-count ${passed === 6 ? "complete" : ""}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${passed} of 6 password checks passed`}
          >
            {passed}/6
          </span>
        </div>
        <div className="password-check-progress" aria-hidden="true">
          {checks.map((check, index) => (
            <span key={check.id} className={index < passed ? "complete" : ""} />
          ))}
        </div>
        <ul className="password-check-items">
          {checks.map((check) => (
            <li key={check.id} className={check.met ? "complete" : ""}>
              <span className="password-check-indicator" aria-hidden="true">
                {check.met ? <Check size={13} strokeWidth={2.5} /> : <span />}
              </span>
              <span>
                {check.label}
                <span className="sr-only">
                  : {check.met ? "met" : "not met"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="password-checklist-footer">
        Each check updates automatically as you type.
      </p>
    </section>
  );
}
