'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '@/lib/api';
import { ProcessInfo } from '@smart-forensic/shared';
import { Activity, Search, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ProcessesPage() {
  const { selectedDevice } = useDevice();
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProcesses = async () => {
    if (!selectedDevice) return;
    setIsLoading(true);
    try {
      const res = await api.getDeviceProcesses(selectedDevice.serial);
      setProcesses(res.processes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, [selectedDevice]);

  const filteredProcesses = processes.filter(p => {
    const matchesSearch =
      p.processName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.packageName && p.packageName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.pid.toString().includes(searchQuery) ||
      p.user.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterSuspiciousOnly) return p.isSuspicious;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Legitimately Exposed Running Processes & Daemons
          </h2>
          <p className="text-xs text-slate-400">
            Audit non-invasive process enumeration via standard ADB shell ps/top interfaces
          </p>
        </div>

        <button
          onClick={fetchProcesses}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>REFRESH TASKS</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-slate-900 border border-slate-800 p-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search process name, PID, user, or package..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-rose-400 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={filterSuspiciousOnly}
              onChange={(e) => setFilterSuspiciousOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-0"
            />
            <span>Show Flagged Processes Only ({processes.filter(p => p.isSuspicious).length})</span>
          </label>
        </div>
      </div>

      {/* Processes Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">PID</th>
              <th className="px-4 py-3">Process / Package</th>
              <th className="px-4 py-3">UID / User</th>
              <th className="px-4 py-3">CPU Usage</th>
              <th className="px-4 py-3">Memory (RSS)</th>
              <th className="px-4 py-3">Execution State</th>
              <th className="px-4 py-3 text-right">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredProcesses.map((proc) => (
              <tr
                key={proc.pid}
                className={`transition-colors ${
                  proc.isSuspicious ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-800/40'
                }`}
              >
                <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">
                  {proc.pid}
                </td>

                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-100 font-mono text-xs">{proc.processName}</div>
                  {proc.packageName && (
                    <span className="text-[10px] text-slate-500 font-mono">{proc.packageName}</span>
                  )}
                  {proc.suspiciousReason && (
                    <p className="text-[11px] text-rose-300 font-sans mt-0.5">{proc.suspiciousReason}</p>
                  )}
                </td>

                <td className="px-4 py-3 font-mono text-slate-400">
                  {proc.user}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{proc.cpuPercent}%</span>
                    <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${proc.cpuPercent > 10 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, proc.cpuPercent * 5)}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 font-mono text-slate-300">
                  {proc.formattedMemory}
                </td>

                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    proc.status === 'Foreground' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                    proc.status === 'Service' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {proc.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  {proc.isSuspicious ? (
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold">
                      FLAGGED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      NORMAL
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filteredProcesses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No active processes match the query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
