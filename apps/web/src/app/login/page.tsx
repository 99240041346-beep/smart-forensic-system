'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LockKeyhole } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.replace('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1120] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-100">SMART FORENSIC SYSTEM</h1>
          <p className="mt-2 text-xs text-slate-400">Authorized Android Mobile Security & Forensic Station</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-emerald-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && <p role="alert" className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
