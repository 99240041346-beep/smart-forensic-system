'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '@/lib/api';
import { SmsInfo } from '@smart-forensic/shared';
import { RiskBadge } from '@/components/RiskBadge';
import { MessageSquare, Search, Download, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ReportExporter } from '@/lib/reportExporter';

export default function SmsPage() {
  const { selectedDevice } = useDevice();
  const [smsList, setSmsList] = useState<SmsInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDevice) {
      setIsLoading(true);
      api.getDeviceSms(selectedDevice.serial)
        .then(res => {
          setSmsList(res.sms || []);
          setPermissionGranted(res.permissionGranted);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedDevice]);

  const filteredSms = smsList.filter(s => {
    const matchesSearch =
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.body.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterSuspiciousOnly) return s.isSuspicious;
    return true;
  });

  const handleExportCsv = () => {
    const rows = [
      ['ID', 'DATE', 'SENDER_OR_RECIPIENT', 'TYPE', 'RISK_SCORE', 'SUSPICIOUS_REASONS', 'MESSAGE_BODY'],
      ...smsList.map(s => [
        s.id,
        `"${s.date}"`,
        `"${s.address}"`,
        s.type,
        s.riskScore.toString(),
        `"${s.suspiciousReasons.join('; ').replace(/"/g, '""')}"`,
        `"${s.body.replace(/"/g, '""')}"`
      ])
    ];
    ReportExporter.exportCsv(rows, `sms-forensic-export-${selectedDevice?.serial || 'device'}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-pink-400" />
            Authorized SMS Forensics & Smishing Triage
          </h2>
          <p className="text-xs text-slate-400">
            Identify incoming phishing links, 2FA OTP solicitation, urgent banking scam patterns, and alphanumeric origin tags
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={smsList.length === 0}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {!permissionGranted && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-950/50 p-4 border border-amber-800 text-amber-300 text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">SMS Access Permission Unavailable</p>
            <p>
              SMS collection is unavailable on this device or permission was not granted by the user.
              Authorized forensics adheres to Android permission constraints without bypassing.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-slate-900 border border-slate-800 p-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search sender address or message text..."
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
            <span>Show Flagged / Smishing Only ({smsList.filter(s => s.isSuspicious).length})</span>
          </label>
        </div>
      </div>

      {/* SMS Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Sender / Recipient</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Message Body</th>
              <th className="px-4 py-3">Heuristic Threat Indicators</th>
              <th className="px-4 py-3 text-right">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredSms.map((sms) => (
              <tr
                key={sms.id}
                className={`transition-colors ${
                  sms.isSuspicious ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-800/40'
                }`}
              >
                <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                  {sms.date}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-100 font-mono">
                  {sms.address}
                </td>

                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">
                    {sms.type}
                  </span>
                </td>

                <td className="px-4 py-3 max-w-md">
                  <p className="text-slate-200 leading-relaxed font-sans">{sms.body}</p>
                </td>

                <td className="px-4 py-3">
                  {sms.suspiciousReasons.length > 0 ? (
                    <div className="space-y-1">
                      {sms.suspiciousReasons.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[10px] text-rose-300 font-medium">
                          <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px]">No threat indicators</span>
                  )}
                </td>

                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {sms.isSuspicious ? (
                    <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                      SMISHING ({sms.riskScore}/100)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                      SAFE (0/100)
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filteredSms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No SMS records found matching the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
