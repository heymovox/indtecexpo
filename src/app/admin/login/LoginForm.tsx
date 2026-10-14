"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input } from "@/components/ui/Form";
import { POST_LOGIN_URL } from "@/config/hosts";
import { Icon } from "@/components/ui/Icon";

interface LoginResponse {
  ok?: boolean;
  message?: string;
  /** Absolute URL of the dashboard, chosen by the server. */
  redirect?: string;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState?.("CapsLock") ?? false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => null)) as LoginResponse | null;

      if (!response.ok || !data?.ok) {
        setError(data?.message ?? "Unable to sign in. Please try again.");
        setPending(false);
        return;
      }

      // A full document navigation, not router.push: the session is issued on
      // the gateway host but the dashboard is on a different origin, and the
      // App Router cannot navigate across origins. `redirect` is a fixed
      // absolute URL chosen by the server, never anything from the browser.
      window.location.assign(data.redirect ?? POST_LOGIN_URL);
    } catch {
      setError("Unable to reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    // method="post" is a safety net: if React never hydrates, a native submit
    // would otherwise GET these credentials into the URL and server logs.
    <form onSubmit={handleSubmit} method="post" className="space-y-5" noValidate>
      {error ? <FormAlert type="error">{error}</FormAlert> : null}

      <Field label="Email address" htmlFor="admin-email" required>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={254}
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
          required
        />
      </Field>

      <Field label="Password" htmlFor="admin-password" required>
        <div className="relative">
          <Input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            maxLength={200}
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyUp={handlePasswordKey}
            onBlur={() => setCapsLockOn(false)}
            disabled={pending}
            required
            className="pr-24"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={pending}
            className="absolute inset-y-0 right-0 inline-flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500 transition hover:text-navy-900 disabled:opacity-50"
          >
            <Icon name="eye" size={15} aria-hidden />
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {capsLockOn ? (
          <p role="status" className="mt-2 text-xs font-medium text-signal-600">
            Caps Lock is on. Passwords are case-sensitive.
          </p>
        ) : (
          <p className="mt-2 text-xs text-steel-500">Passwords are case-sensitive.</p>
        )}
      </Field>

      <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Icon name="refresh" size={16} className="animate-spin" aria-hidden />
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
