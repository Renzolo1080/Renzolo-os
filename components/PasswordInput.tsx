"use client";
import { useState } from "react";

/** A password box with a Show / Hide button, so founders can check what
 * they typed before submitting. */
export function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  minLength,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        className="w-full rounded border px-3 py-2 pr-20"
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={minLength}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-teal"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
