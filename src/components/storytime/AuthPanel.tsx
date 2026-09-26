"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { FormEvent, useEffect, useState } from "react";
import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

type AuthState =
  | { status: "blocked" }
  | { status: "checking" }
  | { status: "signedOut" }
  | { status: "signedIn"; email: string; emailVerified: boolean };

function toMessage() {
  return "We couldn’t complete that account request. Check your details and try again.";
}

export function AuthPanel() {
  const configured = isFirebaseClientConfigured();
  const [authState, setAuthState] = useState<AuthState>(() =>
    configured ? { status: "checking" } : { status: "blocked" }
  );
  const [mode, setMode] = useState<"signIn" | "create">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!configured) return undefined;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setAuthState(user?.email
        ? { status: "signedIn", email: user.email, emailVerified: user.emailVerified }
        : { status: "signedOut" });
    });
    return unsubscribe;
  }, [configured]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || password.length < 8) {
      setError("Enter your email and a password with at least 8 characters.");
      return;
    }
    setWorking(true);
    try {
      const auth = getFirebaseAuth();
      if (mode === "create") {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(credential.user);
        setNotice("Account created. Check your email to verify the address before relying on cloud Storytime.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setPassword("");
    } catch {
      setError(toMessage());
    } finally {
      setWorking(false);
    }
  }

  if (authState.status === "blocked" || authState.status === "checking") {
    return (
      <section className="storytime-card storytime-stack" aria-label="Storytime account">
        <p className="storytime-pill">Account</p>
        <h2>{authState.status === "blocked" ? "Sign-in unavailable" : "Checking your account"}</h2>
        <p>{authState.status === "blocked" ? "Account access is temporarily unavailable. Your saved stories have not been changed." : "Restoring your private Storytime session."}</p>
      </section>
    );
  }

  if (authState.status === "signedIn") {
    async function resendVerification() {
      setError(null);
      setNotice(null);
      const user = getFirebaseAuth().currentUser;
      if (!user) return;
      setWorking(true);
      try {
        await sendEmailVerification(user);
        setNotice("Verification email requested. Check your inbox.");
      } catch {
        setError(toMessage());
      } finally {
        setWorking(false);
      }
    }

    return (
      <section className="storytime-card storytime-stack" aria-label="Storytime account">
        <p className="storytime-pill">Account</p>
        <h2>Signed in</h2>
        <p>{authState.email}</p>
        <p className="storytime-helper">
          {authState.emailVerified ? "Email verified." : "Email verification is still required for production account readiness."}
        </p>
        {notice ? <p role="status">{notice}</p> : null}
        {error ? <p className="storytime-error" role="alert">{error}</p> : null}
        <div className="storytime-actions">
          {!authState.emailVerified ? (
            <button className="storytime-button secondary" type="button" onClick={resendVerification} disabled={working}>
              Resend verification
            </button>
          ) : null}
          <button className="storytime-button secondary" type="button" onClick={() => signOut(getFirebaseAuth())}>Sign out</button>
        </div>
      </section>
    );
  }

  async function requestPasswordReset() {
    setError(null);
    setNotice(null);
    const address = email.trim();
    if (!address) {
      setError("Enter your email first.");
      return;
    }
    setWorking(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), address);
      setNotice("If that address can receive a reset email, check its inbox for the next step.");
    } catch {
      setNotice("If that address can receive a reset email, check its inbox for the next step.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Storytime account">
      <p className="storytime-pill">Account</p>
      <h2>{mode === "create" ? "Create your account" : "Sign in"}</h2>
      <p className="storytime-helper">Sign in to create private stories and return to the ones you have saved.</p>
      <form className="storytime-stack" onSubmit={handleSubmit}>
        <label className="storytime-field">
          Email
          <input className="storytime-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required aria-invalid={Boolean(error)} />
        </label>
        <label className="storytime-field">
          Password
          <input className="storytime-input" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} aria-invalid={Boolean(error)} />
        </label>
        {notice ? <p role="status">{notice}</p> : null}
        {error ? <p className="storytime-error" role="alert">{error}</p> : null}
        <div className="storytime-actions">
          <button className="storytime-button" type="submit" disabled={working}>{working ? "Please wait…" : mode === "create" ? "Create account" : "Sign in"}</button>
          <button className="storytime-button secondary" type="button" onClick={() => setMode(mode === "create" ? "signIn" : "create")}>{mode === "create" ? "Use existing account" : "Create account"}</button>
          {mode === "signIn" ? (
            <button className="storytime-button secondary" type="button" onClick={requestPasswordReset} disabled={working}>
              Reset password
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
