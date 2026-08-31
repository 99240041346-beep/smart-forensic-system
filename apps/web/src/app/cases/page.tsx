'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '@/lib/api';
import { ForensicCase } from '@smart-forensic/shared';
import { RiskBadge } from '@/components/RiskBadge';
import { Briefcase, Plus, Search, Calendar, User, Smartphone, Tag, FileText } from 'lucide-react';
import Link from 'next/link';

export default function CasesPage() {
  const { selectedDevice, setActiveCaseId } = useDevice();
  const [cases, setCases] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInvestigator, setNewInvestigator] = useState('Lead Forensics Investigator');
  const [newTags, setNewTags] = useState('Mobile,Forensics');
  const [isLoading, setIsLoading] = useState(false);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const list = await api.getCases();
      setCases(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      await api.createCase({
        title: newTitle,
        description: newDesc,
        investigatorName: newInvestigator,
        deviceSerial: selectedDevice?.serial || 'DEMO-PIXEL8-SEC01',
        deviceModel: selectedDevice?.model || 'Google Pixel 8 Pro',
        tags: newTags.split(',').map(t => t.trim())
      });

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadCases();
    } catch (err: any) {
      alert(`Failed to create case: ${err.message}`);
    }
  };

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.deviceModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            Forensic Case Management
          </h2>
          <p className="text-xs text-slate-400">
            Track authorized investigation files, associate device snapshots, and archive evidence dossiers
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-950 hover:bg-emerald-500 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>NEW INVESTIGATION CASE</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search case number, title, or target..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                    {c.caseNumber}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-2">{c.title}</h3>
                </div>
                <RiskBadge level={c.riskLevel || 'UNKNOWN'} size="sm" />
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-slate-300 font-semibold">{c.deviceModel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>{c.investigatorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                c.status === 'OPEN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                c.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                'bg-slate-800 text-slate-400'
              }`}>
                {c.status}
              </span>

              <Link
                href={`/reports?caseId=${c.id}`}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>View Dossier</span>
              </Link>
            </div>
          </div>
        ))}

        {filteredCases.length === 0 && (
          <div className="col-span-full rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-8 text-center text-slate-500">
            No forensic cases found. Click "NEW INVESTIGATION CASE" to create one.
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateCase}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-100">Create New Forensic Investigation Case</h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Case Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Incident Response - Executive Endpoint Triage"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Case Scope & Objectives</label>
              <textarea
                rows={3}
                placeholder="Describe reason for investigation, suspected malware, or forensic authorization..."
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Investigator Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  value={newInvestigator}
                  onChange={(e) => setNewInvestigator(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Target Device</label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg bg-slate-950/50 border border-slate-800 px-3 py-2 text-xs text-slate-400 font-mono"
                  value={selectedDevice ? `${selectedDevice.model} (${selectedDevice.maskedSerial})` : 'DEMO-PIXEL8-SEC01'}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="Mobile, Malware, Smishing, HighPriority"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-500"
              >
                CREATE CASE
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
