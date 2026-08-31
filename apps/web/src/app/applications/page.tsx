'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '../../lib/api';
import { AppInfo } from '@smart-forensic/shared';
import { RiskBadge } from '../../components/RiskBadge';

import { Layers, Search } from 'lucide-react';

export default function ApplicationsPage() {
  const { selectedDevice } = useDevice();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'USER' | 'SYSTEM' | 'SIDELOADED' | 'SUSPICIOUS' | 'HIGH_RISK'>('ALL');
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedDevice) return;
    setIsLoading(true);
    api.getDeviceApps(selectedDevice.serial).then(res => setApps(res.apps)).catch(console.error).finally(() => setIsLoading(false));
  }, [selectedDevice]);

  const filteredApps = apps.filter(app => {
    const q = searchQuery.toLowerCase();
    const matches = app.appName.toLowerCase().includes(q) || app.packageName.toLowerCase().includes(q) || app.requestedPermissions.some(p => p.toLowerCase().includes(q));
    if (!matches) return false;
    if (activeFilter === 'USER') return !app.isSystemApp;
    if (activeFilter === 'SYSTEM') return app.isSystemApp;
    if (activeFilter === 'SIDELOADED') return app.isSideloaded;
    if (activeFilter === 'SUSPICIOUS') return ['SUSPICIOUS', 'HIGH_RISK', 'CRITICAL'].includes(app.risk.riskLevel);
    if (activeFilter === 'HIGH_RISK') return ['HIGH_RISK', 'CRITICAL'].includes(app.risk.riskLevel);
    return true;
  });

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Layers className="h-5 w-5 text-purple-400" />Installed Applications & Heuristic Risk Analysis</h2><p className="text-xs text-slate-400">Audit permissions, installation origin and security indicators.</p></div>
      <div className="flex flex-col lg:flex-row gap-4 rounded-xl bg-slate-900 border border-slate-800 p-3">
        <div className="relative w-full lg:w-96"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search app, package, permission..." className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-slate-200" /></div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL','USER','SYSTEM','SIDELOADED','SUSPICIOUS','HIGH_RISK'] as const).map(id => <button key={id} onClick={() => setActiveFilter(id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === id ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>{id}</button>)}
        </div>
      </div>
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400 uppercase"><tr><th className="px-4 py-3">Application</th><th className="px-4 py-3">Package</th><th className="px-4 py-3">Install Source</th><th className="px-4 py-3">Permissions</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-800 text-slate-300">
        {filteredApps.map(app => <tr key={app.packageName}><td className="px-4 py-3"><b>{app.appName}</b><div className="text-[11px] text-slate-500">v{app.versionName} ({app.versionCode})</div></td><td className="px-4 py-3 font-mono">{app.packageName}</td><td className="px-4 py-3">{app.isSideloaded ? 'Sideloaded APK' : app.installSource}</td><td className="px-4 py-3">{app.dangerousPermissions.slice(0,3).map(p => <span key={p} className="mr-1 inline-block rounded bg-slate-950 px-1.5 py-0.5 text-[10px]">{p.replace('android.permission.','')}</span>)}</td><td className="px-4 py-3"><RiskBadge level={app.risk.riskLevel} size="sm" /> <span className="ml-1">{app.risk.riskScore}/100</span></td><td className="px-4 py-3"><button onClick={() => setSelectedApp(app)} className="rounded bg-slate-800 px-3 py-1">Audit Details</button></td></tr>)}
        {!isLoading && filteredApps.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No applications found.</td></tr>}
      </tbody></table></div></div>
      {selectedApp && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"><div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4"><div className="flex justify-between"><div><h3 className="font-bold text-slate-100">{selectedApp.appName}</h3><p className="font-mono text-xs text-slate-400">{selectedApp.packageName}</p></div><button onClick={() => setSelectedApp(null)} className="rounded bg-slate-800 px-3 py-1">Close</button></div><RiskBadge level={selectedApp.risk.riskLevel} /><p className="text-sm text-slate-300">{selectedApp.risk.reasons.join(' • ') || 'No heuristic findings.'}</p><div className="flex flex-wrap gap-1">{selectedApp.requestedPermissions.map(p => <span key={p} className="rounded border border-slate-800 px-2 py-1 text-[10px] font-mono">{p}</span>)}</div></div></div>}
    </div>
  );
}
