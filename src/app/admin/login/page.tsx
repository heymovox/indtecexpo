import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login | INDTEC EXPO",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <section className="grid min-h-[78vh] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex xl:p-14">
        <div className="grid-surface-dark pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brand/logo-light.svg"
            alt="INDTEC EXPO"
            className="h-10 w-auto"
          />
        </div>
        <div className="relative max-w-md">
          <span className="eyebrow eyebrow-light mb-4">Internal Access</span>
          <h1 className="display text-[clamp(2.2rem,3.4vw,3.2rem)] text-white">
            INDTEC EXPO Control Room
          </h1>
          <p className="mt-4 text-base leading-relaxed text-steel-300">
            Lead pipeline, stall bookings, visitor registrations and event
            overrides for the 2026–2027 three-city expo series.
          </p>
        </div>
        <p className="relative text-xs uppercase tracking-[0.18em] text-steel-500">
          Authorised administrators only · Sessions expire after 8 hours
        </p>
      </div>

      <div className="flex items-center justify-center bg-steel-50 px-5 py-14 sm:px-8">
        <div className="w-full max-w-md">
          <div className="card bg-white p-6 sm:p-8">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/brand/logo.svg"
                alt="INDTEC EXPO"
                className="h-9 w-auto"
              />
            </div>
            <span className="eyebrow mb-3">Admin</span>
            <h2 className="display-sm text-2xl text-navy-900">Sign in</h2>
            <p className="mt-2 text-sm text-steel-600">
              Use your administrator credentials to access the dashboard.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
