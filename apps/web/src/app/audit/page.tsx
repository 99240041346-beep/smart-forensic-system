'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AuditLogEntry } from '@smart-forensic/shared';
import { History, Search, ShieldCheck, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs(200);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.investigator.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.targetDeviceSerial && l.targetDeviceSerial.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-400" />
            Tamper-Evident Forensic Audit Log
          </h2>
          <p className="text-xs text-slate-400">
            Immutable chain-of-custody event stream recording authorized device discoveries, scans, and evidence exports
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>REFRESH LOGS</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search action, investigator, or details..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Timestamp (UTC)</th>
              <th className="px-4 py-3">Investigator</th>
              <th className="px-4 py-3">Action Type</th>
              <th className="px-4 py-3">Target Endpoint</th>
              <th className="px-4 py-3">Sanitized Event Details</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-200">
                  {log.investigator}
                </td>

                <td className="px-4 py-3 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                    {log.action}
                  </span>
                </td>

                <td className="px-4 py-3 font-mono text-slate-400">
                  {log.targetDeviceSerial || '—'}
                </td>

                <td className="px-4 py-3 text-slate-300 max-w-md">
                  <p className="truncate">{log.details}</p>
                </td>

                <td className="px-4 py-3 text-right">
                  {log.status === 'SUCCESS' ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      SUCCESS
                    </span>
                  ) : log.status === 'FAILURE' ? (
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold">
                      FAILURE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                      WARNING
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No audit log records recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
