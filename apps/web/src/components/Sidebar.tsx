'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Smartphone,
  Layers,
  Users,
  MessageSquare,
  Activity,
  ShieldAlert,
  Briefcase,
  FileText,
  History,
  Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Devices', href: '/devices', icon: Smartphone },
  { label: 'Applications', href: '/applications', icon: Layers },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'SMS Forensics', href: '/sms', icon: MessageSquare },
  { label: 'Processes', href: '/processes', icon: Activity },
  { label: 'Security & Posture', href: '/security', icon: ShieldAlert },
  { label: 'Cases', href: '/cases', icon: Briefcase },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Audit Log', href: '/audit', icon: History },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Forensic Workstation
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Analyst Profile */}
      <div className="p-4 border-t border-slate-900">
        <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
              LF
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">Lead Investigator</p>
              <p className="text-[10px] text-slate-400 truncate">DFIR Analyst • Authorized</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
