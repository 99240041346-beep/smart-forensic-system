'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AuditLogEntry } from '@smart-forensic/shared';
import { History, Search, RefreshCw } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fetchLogs = async () => { setIsLoading(true); try { setLogs(await api.getAuditLogs(200)); } catch (err) { console.error(err); } finally { setIsLoading(false); } };
  useEffect(() => { fetchLogs(); }, []);
  const filtered = logs.filter(l => `${l.action} ${l.investigator} ${l.details} ${l.targetDeviceSerial || ''}`.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><History className="h-5 w-5 text-emerald-400" />Tamper-Evident Forensic Audit Log</h2><p className="text-xs text-slate-400">Authorized device discoveries, scans and evidence exports.</p></div><button onClick={fetchLogs} disabled={isLoading} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />REFRESH LOGS</button></div><div className="rounded-xl bg-slate-900 border border-slate-800 p-3"><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search audit events..." className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-slate-200" /></div></div><div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400 uppercase"><tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Investigator</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-800 text-slate-300">{filtered.map(log => <tr key={log.id}><td className="px-4 py-3 font-mono">{new Date(log.timestamp).toLocaleString()}</td><td className="px-4 py-3">{log.investigator}</td><td className="px-4 py-3 font-mono">{log.action}</td><td className="px-4 py-3 font-mono">{log.targetDeviceSerial || '—'}</td><td className="px-4 py-3 max-w-md truncate">{log.details}</td><td className="px-4 py-3">{log.status}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No audit log records.</td></tr>}</tbody></table></div></div></div>;
}
