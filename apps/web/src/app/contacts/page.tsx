'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '@/lib/api';
import { ContactInfo } from '@smart-forensic/shared';
import { Users, Search, Download, ShieldCheck, AlertCircle, Copy } from 'lucide-react';
import { ReportExporter } from '@/lib/reportExporter';

export default function ContactsPage() {
  const { selectedDevice } = useDevice();
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDevice) {
      setIsLoading(true);
      api.getDeviceContacts(selectedDevice.serial)
        .then(res => {
          setContacts(res.contacts || []);
          setPermissionGranted(res.permissionGranted);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedDevice]);

  const filteredContacts = contacts.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumbers.some(p => p.number.includes(searchQuery)) ||
      c.emails.some(e => e.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (showDuplicatesOnly) return c.isDuplicate;
    return true;
  });

  const handleExportCsv = () => {
    const rows = [
      ['ID', 'NAME', 'PRIMARY_PHONE', 'EMAIL', 'SOURCE', 'DUPLICATE_FLAG'],
      ...contacts.map(c => [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.phoneNumbers[0]?.number || ''}"`,
        `"${c.emails[0]?.email || ''}"`,
        c.source,
        c.isDuplicate ? 'YES' : 'NO'
      ])
    ];
    ReportExporter.exportCsv(rows, `contacts-export-${selectedDevice?.serial || 'device'}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Authorized Address Book & Contacts Dossier
          </h2>
          <p className="text-xs text-slate-400">
            Audit authorized contact entries, deduplicate profiles, and verify storage origins
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={contacts.length === 0}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {!permissionGranted && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-950/50 p-4 border border-amber-800 text-amber-300 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Contacts Permission Not Granted</p>
            <p>
              The Android companion app requires explicit user permission before contacts can be collected.
              Grant permission on the device screen or run in Demo Mode.
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
            placeholder="Search contact name, phone, or email..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showDuplicatesOnly}
              onChange={(e) => setShowDuplicatesOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span>Show Duplicates Only</span>
          </label>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone Numbers</th>
              <th className="px-4 py-3">Email Address</th>
              <th className="px-4 py-3">Account Origin</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredContacts.map((cnt) => (
              <tr key={cnt.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-100 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center text-xs border border-cyan-500/20">
                    {cnt.name.charAt(0)}
                  </div>
                  <span>{cnt.name}</span>
                </td>

                <td className="px-4 py-3 font-mono text-slate-300">
                  {cnt.phoneNumbers.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span>{p.number}</span>
                      <span className="text-[10px] text-slate-500">({p.type})</span>
                    </div>
                  ))}
                </td>

                <td className="px-4 py-3 text-slate-400">
                  {cnt.emails.map((e, idx) => (
                    <div key={idx}>{e.email}</div>
                  ))}
                  {cnt.emails.length === 0 && <span className="text-slate-600">—</span>}
                </td>

                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                    {cnt.source}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  {cnt.isDuplicate ? (
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                      DUPLICATE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      UNIQUE
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filteredContacts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No contact entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
