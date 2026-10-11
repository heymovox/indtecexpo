"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? <span className="ml-1 text-signal-500">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <span className="mt-1 block text-xs text-steel-500">{hint}</span>
      ) : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function Input({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn("field", className)}
      {...props}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn("field min-h-[120px] resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn("field", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function CheckboxGroup({
  legend,
  name,
  options,
  selected,
  onToggle,
  error,
  columns = 2,
}: {
  legend: string;
  name: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  error?: string;
  columns?: 1 | 2 | 3;
}) {
  const grid =
    columns === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : columns === 1
        ? "grid-cols-1"
        : "sm:grid-cols-2";
  return (
    <fieldset aria-invalid={error ? true : undefined}>
      <legend className="field-label">
        {legend}
        <span className="ml-1 text-signal-500">*</span>
      </legend>
      <div className={cn("grid gap-2", grid)}>
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 border px-3 py-2.5 text-sm transition",
                checked
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-steel-200 bg-white text-steel-700 hover:border-steel-300",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={option}
                checked={checked}
                onChange={() => onToggle(option)}
                className="h-5 w-5 shrink-0 accent-[#0f5fbf]"
              />
              <span className="leading-snug">{option}</span>
            </label>
          );
        })}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </fieldset>
  );
}

export function FormAlert({
  type,
  children,
}: {
  type: "success" | "error";
  children: ReactNode;
}) {
  if (!children) return null;
  return (
    <div
      role={type === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-3 border px-4 py-3.5 text-sm",
        type === "success"
          ? "border-success-500/35 bg-success-50 text-success-500"
          : "border-signal-100 bg-signal-50 text-signal-700",
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0"
        aria-hidden
      >
        {type === "success" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m7.5 12.5 3 3 6-6" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16h.01" />
          </>
        )}
      </svg>
      <div className="flex-1">{children}</div>
    </div>
  );
}
