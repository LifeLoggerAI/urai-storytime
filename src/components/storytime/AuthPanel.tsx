"use client";

import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FormEvent, useEffect, useState } from "react";
import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

type AuthState =
  | { status: "blocked"; message: string }
  | { status: "checking"; message: string }
  | { status: "signedOut" }
  | { status: "signedIn"; email: string };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Authentication failed.";
}

export function AuthPanel() {
  const configured = isFirebaseClientConfigured();
  const [authState, setAuthState] = useState<AuthState>(() =>
    configured ? { status: "checking", message: "Checking account session..." } : { status: "blocked", message: "Firebase client config is required before sign-in can be enabled." }
  );
  const [mode, setMode] = useState<"signIn" | "create">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!configured) return undefined;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setAuthState(user?.email ? { status: "signedIn", email: user.email } : { status: "signedOut" });
    });
    return unsubscribe;
  }, [configured]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || password.length < 8) {
      setError("Enter an email and a password with at least 8 characters.");
      return;
    }
    setWorking(true);
    try {
      const auth = getFirebaseAuth();
      if (mode === "create") await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch (submitError) {
      setError(toMessage(submitError));
    } finally {
      setWorking(false);
    }
  }

  if (authState.status === "blocked" || authState.status === "checking") {
    return (
      <section className="storytime-card storytime-stack" aria-label="Storytime account">
        <p className="storytime-pill">Account</p>
        <h2>{authState.status === "blocked" ? "Sign-in gated" : "Checking account"}</h2>
        <p>{authState.message}</p>
      </section>
    );
  }

  if (authState.status === "signedIn") {
    return (
      <section className="storytime-card storytime-stack" aria-label="Storytime account">
        <p className="storytime-pill">Account</p>
        <h2>Signed in</h2>
        <p>{authState.email}</p>
        <button className="storytime-button secondary" type="button" onClick={() => signOut(getFirebaseAuth())}>Sign out</button>
      </section>
    );
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Storytime account">
      <p className="storytime-pill">Account</p>
      <h2>{mode === "create" ? "Create account" : "Sign in"}</h2>
      <p className="storytime-helper">Cloud Storytime sessions require Firebase Auth. Demo mode remains available without an account.</p>
      <form className="storytime-stack" onSubmit={handleSubmit}>
        <label className="storytime-field">
          Email
          <input className="storytime-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="storytime-field">
          Password
          <input className="storytime-input" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="storytime-error">{error}</p> : null}
        <div className="storytime-actions">
          <button className="storytime-button" type="submit" disabled={working}>{working ? "Working..." : mode === "create" ? "Create account" : "Sign in"}</button>
          <button className="storytime-button secondary" type="button" onClick={() => setMode(mode === "create" ? "signIn" : "create")}>{mode === "create" ? "Use existing account" : "Create account"}</button>
        </div>
      </form>
    </section>
  );
}
