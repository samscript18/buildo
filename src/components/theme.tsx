"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";
const key = "buildo-theme";
const event = "buildo-theme-change";
const media = "(prefers-color-scheme: dark)";
let temporary: Theme | undefined;

function preference(): Theme {
  if (temporary) return temporary;
  try {
    const value = localStorage.getItem(key);
    if (value === "light" || value === "dark") return value;
  } catch {}
  return "system";
}
function snapshot() {
  const value = preference();
  const dark =
    value === "dark" || (value === "system" && matchMedia(media).matches);
  return `${value}:${dark ? "dark" : "light"}`;
}
function subscribe(listener: () => void) {
  const query = matchMedia(media);
  window.addEventListener("storage", listener);
  window.addEventListener(event, listener);
  query.addEventListener("change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(event, listener);
    query.removeEventListener("change", listener);
  };
}
function applyTheme() {
  document.documentElement.dataset.theme = snapshot().split(":")[1];
}
function chooseTheme(value: Theme) {
  try {
    localStorage.setItem(key, value);
    temporary = undefined;
  } catch {
    temporary = value;
  }
  applyTheme();
  window.dispatchEvent(new Event(event));
}
export function useTheme() {
  const value = useSyncExternalStore(subscribe, snapshot, () => "system:light");
  return {
    preference: value.split(":")[0] as Theme,
    dark: value.endsWith(":dark"),
  };
}
export function ThemeSync() {
  useEffect(() => {
    applyTheme();
    return subscribe(applyTheme);
  }, []);
  return null;
}
export function ThemeToggle() {
  const { dark } = useTheme();
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => chooseTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
      <span className="theme-toggle-label">
        {dark ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
export function ThemeSettings() {
  const { preference: selected } = useTheme();
  return (
    <section
      className="theme-settings form-card"
      aria-labelledby="appearance-title"
    >
      <div>
        <span className="eyebrow">Make yourself comfortable</span>
        <h2 id="appearance-title">Appearance</h2>
        <p>
          Choose your look, or follow your device. Your preference is saved in
          this browser.
        </p>
      </div>
      <div className="theme-options" role="group" aria-label="Colour theme">
        {(
          [
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            type="button"
            key={value}
            aria-pressed={selected === value}
            onClick={() => chooseTheme(value)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
