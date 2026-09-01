'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      router.replace('/login');
      router.refresh();
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0b1120] flex items-center justify-center text-slate-300">
      <div className="flex items-center gap-3 text-sm font-semibold"><LogOut className="h-5 w-5" /> Signing out…</div>
    </main>
  );
}
