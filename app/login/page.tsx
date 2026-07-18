"use client";

import React, { useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "That login link is missing a token.",
  invalid_or_expired: "That login link is invalid or has expired. Request a new one below.",
  no_account: "We couldn't find an account for that link.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ exists: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const error =
    typeof window !== "undefined"
      ? ERROR_MESSAGES[new URLSearchParams(window.location.search).get("error") ?? ""]
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) {
        setResult({ exists: false, message: body.error ?? "Something went wrong. Please try again." });
      } else {
        setResult({ exists: body.exists, message: body.message });
      }
    } catch {
      setResult({ exists: false, message: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-black/5 p-8">
        <h1 className="font-[var(--font-aeonik)] text-2xl leading-tight tracking-tight mb-2">
          Access your purchases
        </h1>
        <p className="text-sm text-black/60 mb-6 leading-relaxed">
          Enter the email you used at checkout — we&apos;ll send you a login link.
        </p>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        {result && (
          <p
            className={
              result.exists
                ? "text-sm text-[#1a1a1a] bg-[#F4F3EA] border border-black/10 rounded-xl px-4 py-3 mb-4"
                : "text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4"
            }
          >
            {result.message}
          </p>
        )}

        {result?.exists ? null : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-black/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-black text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-300 border border-white/10 hover:border-white/20 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send login link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
