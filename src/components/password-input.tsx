"use client";
import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordInput({
  id,
  visibilityLabel = "password",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { visibilityLabel?: string }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-field">
      <input {...props} id={inputId} type={visible ? "text" : "password"} />
      <button
        className="password-toggle"
        type="button"
        aria-label={`${visible ? "Hide" : "Show"} ${visibilityLabel}`}
        aria-controls={inputId}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <EyeOff size={18} aria-hidden="true" />
        ) : (
          <Eye size={18} aria-hidden="true" />
        )}
      </button>
    </span>
  );
}
