'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '@/lib/api';
import { AppInfo } from '@smart-forensic/shared';
import { RiskBadge } from '@/components/RiskBadge';
import {
  Layers,
  Search,
  Filter,
  ShieldAlert,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Shield
} from 'lucide-react';

export default function ApplicationsPage() {
  const { selectedDevice } = useDevice();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'USER' | 'SYSTEM' | 'SIDELOADED' | 'SUSPICIOUS' | 'HIGH_RISK'>('ALL');
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDevice) {
      setIsLoading(true);
      api.getDeviceApps(selectedDevice.serial)
        .then(res => setApps(res.apps))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedDevice]);

  const filteredApps = apps.filter(app => {
    const matchesSearch =
      app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.requestedPermissions.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'USER':
        return !app.isSystemApp;
      case 'SYSTEM':
        return app.isSystemApp;
      case 'SIDELOADED':
        return app.isSideloaded;
      case 'SUSPICIOUS':
        return app.risk.riskLevel === 'SUSPICIOUS' || app.risk.riskLevel === 'HIGH_RISK' || app.risk.riskLevel === 'CRITICAL';
      case 'HIGH_RISK':
        return app.risk.riskLevel === 'HIGH_RISK' || app.risk.riskLevel === 'CRITICAL';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            Installed Applications & Heuristic Risk Analysis
          </h2>
          <p className="text-xs text-slate-400">
            Audit declared permissions, installation origin, debuggable flags, and suspicious behavior clusters
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 rounded-xl bg-slate-900 border border-slate-800 p-3">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search app name, package, or permission..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'ALL', label: `All (${apps.length})` },
            { id: 'USER', label: `User Apps (${apps.filter(a => !a.isSystemApp).length})` },
            { id: 'SYSTEM', label: `System (${apps.filter(a => a.isSystemApp).length})` },
            { id: 'SIDELOADED', label: `Sideloaded (${apps.filter(a => a.isSideloaded).length})` },
            { id: 'SUSPICIOUS', label: `Suspicious (${apps.filter(a => a.risk.riskLevel === 'SUSPICIOUS' || a.risk.riskLevel === 'HIGH_RISK' || a.risk.riskLevel === 'CRITICAL').length})` },
            { id: 'HIGH_RISK', label: `High Risk (${apps.filter(a => a.risk.riskLevel === 'HIGH_RISK' || a.risk.riskLevel === 'CRITICAL').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors ${
                activeFilter === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3">Package Identifier</th>
                <th className="px-4 py-3">Install Source</th>
                <th className="px-4 py-3">Sensitive Permissions</th>
                <th className="px-4 py-3">Risk Assessment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredApps.map(app => (
                <tr key={app.packageName} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      {app.appName}
                      {app.isDebuggable && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px]">
                          DEBUG
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">v{app.versionName} ({app.versionCode})</span>
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {app.packageName}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      app.isSideloaded
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {app.isSideloaded ? 'Sideloaded APK' : app.installSource}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {app.dangerousPermissions.slice(0, 3).map(p => (
                        <span key={p} className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-rose-300 border border-slate-800">
                          {p.replace('android.permission.', '')}
                        </span>
                      ))}
                      {app.dangerousPermissions.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-400 border border-slate-800">
                          +{app.dangerousPermissions.length - 3} more
                        </span>
                      )}
                      {app.dangerousPermissions.length === 0 && (
                        <span className="text-slate-500 text-[11px]">None requested</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RiskBadge level={app.risk.riskLevel} size="sm" />
                      <span className="font-mono text-xs text-slate-400 font-bold">{app.risk.riskScore}/100</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Audit Details
                    </button>
                  </td>
                </tr>
              ))}

              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No applications matched the search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* App Heuristic Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-100">{selectedApp.appName}</h3>
                  <RiskBadge level={selectedApp.risk.riskLevel} size="sm" />
                </div>
                <p className="font-mono text-xs text-slate-400">{selectedApp.packageName}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            {/* Why Flagged / Reasons */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Heuristic Assessment Rationale</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedApp.risk.reasons.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                * Note: Heuristic rules assess static indicators and permission capabilities; they do not represent proof of malware.
              </p>
            </div>

            {/* Declared Permissions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Declared Android Permissions ({selectedApp.requestedPermissions.length})
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-lg border border-slate-800">
                {selectedApp.requestedPermissions.map(p => (
                  <span
                    key={p}
                    className={`px-2 py-1 rounded text-[11px] font-mono border ${
                      p.includes('SMS') || p.includes('ACCESSIBILITY') || p.includes('ALERT_WINDOW') || p.includes('INSTALL')
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* APK Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500">APK Path:</span>
                <p className="font-mono text-slate-300 truncate">{selectedApp.apkPath}</p>
              </div>
              <div>
                <span className="text-slate-500">Install Source:</span>
                <p className="text-slate-300">{selectedApp.installSource}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
