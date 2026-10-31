"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { friendlyAuthError, useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const inputClass = "w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted-ink)]";
const buttonClass = "rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#171512] transition hover:bg-[var(--accent-soft)] disabled:opacity-50";

export function AuthPanel() {
  const { user, loading, signUp, logIn, google, logOut } = useAuth();
  const [createMode, setCreateMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [noticeRead, setNoticeRead] = useState(false);

  const recordAcknowledgement = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Your session could not be verified. Please try again.");
    const response = await fetch("/api/privacy/acknowledge", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      await signOut(auth);
      throw new Error("We could not record your privacy notice acknowledgement. Please try again.");
    }
    window.localStorage.setItem(`tinolandia-privacy-ack-${auth.currentUser?.uid}`, '2026-10-31-v1');
    window.dispatchEvent(new Event('tinolandia:privacy-ack'));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!noticeRead) { setError("Read and acknowledge the privacy notice and simulation disclaimer to continue."); return; }
    setBusy(true); setError("");
    try {
      if (createMode) await signUp(email, password, name);
      else await logIn(email, password);
      await recordAcknowledgement();
    } catch (err) { setError(friendlyAuthError(err)); }
    finally { setBusy(false); }
  };

  if (loading) return <p className="text-sm text-[var(--muted-ink)]">Checking your session…</p>;
  if (user) return (
    <div className="space-y-3 rounded-md border border-[var(--line)] bg-white p-4">
      <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.displayName || user.email}</p><p className="mt-1 text-xs text-[var(--muted-ink)]">Review the notice before continuing.</p></div>
      <label className="flex items-start gap-2.5 text-xs leading-5 text-[var(--muted-ink)]"><input type="checkbox" checked={noticeRead} onChange={(event) => setNoticeRead(event.target.checked)} className="mt-1 accent-[var(--accent)]"/><span>I have read the <Link href="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-dark)] underline">Privacy Notice</Link> and simulation disclaimer. Historical references do not endorse or condone any person or regime.</span></label>
      <div className="flex gap-2"><button type="button" disabled={!noticeRead || busy} onClick={async()=>{setBusy(true);setError('');try{await recordAcknowledgement()}catch(err){setError(err instanceof Error?err.message:'Could not record acknowledgement.')}finally{setBusy(false)}}} className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Acknowledge and continue</button><button type="button" onClick={() => void logOut()} className="rounded border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted-ink)]">Sign out</button></div>
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="space-y-2.5">
        {createMode && <input aria-label="Commander name" required maxLength={24} value={name} onChange={(e) => setName(e.target.value)} placeholder="Commander name" className={inputClass} />}
        <input aria-label="Email" autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={inputClass} />
        <input aria-label="Password" autoComplete={createMode ? "new-password" : "current-password"} type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" className={inputClass} />
        {error && <p role="alert" className="text-xs leading-5 text-rose-700">{error}</p>}
        <button className={`${buttonClass} w-full`} type="submit" disabled={busy}>{busy ? "Please wait…" : createMode ? "Create account" : "Sign in"}</button>
      </form>
      <label className="flex items-start gap-2.5 rounded-md border border-[var(--line)] bg-white px-3 py-3 text-xs leading-5 text-[var(--muted-ink)]"><input type="checkbox" checked={noticeRead} onChange={(event) => setNoticeRead(event.target.checked)} className="mt-1 accent-[var(--accent)]"/><span>I have read the <Link href="/privacy" target="_blank" className="font-semibold text-[var(--accent-dark)] underline">Privacy Notice</Link> and simulation disclaimer. I understand the game is fictional and historical references do not endorse any person or regime.</span></label>
      <button type="button" disabled={busy || !noticeRead} onClick={async () => { if (!noticeRead) return; setBusy(true); setError(""); try { await google(); await recordAcknowledgement(); } catch (err) { setError(friendlyAuthError(err)); } finally { setBusy(false); } }} className="w-full rounded-md border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] hover:bg-white/[.05] disabled:opacity-50">Continue with Google</button>
      <p className="text-xs text-[var(--muted-ink)]">{createMode ? "Already registered?" : "New commander?"}{" "}<button type="button" onClick={() => { setCreateMode(!createMode); setError(""); }} className="font-semibold text-[var(--accent-soft)] underline-offset-4 hover:underline">{createMode ? "Sign in" : "Create an account"}</button></p>
    </div>
  );
}
