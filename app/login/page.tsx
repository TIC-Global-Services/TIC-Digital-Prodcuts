"use client";

import React, { useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "That login link is missing a token.",
  invalid_or_expired: "That login link is invalid or has expired. Request a new one below.",
  no_account: "We couldn't find an account for that link.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const error =
    typeof window !== "undefined"
      ? ERROR_MESSAGES[new URLSearchParams(window.location.search).get("error") ?? ""]
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">Access your purchases</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Enter the email you used at checkout — we&apos;ll send you a login link.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {submitted ? (
          <p className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">
            If that email has any purchases, a login link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-black text-white text-sm font-medium px-4 py-2 hover:bg-zinc-800 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send login link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
