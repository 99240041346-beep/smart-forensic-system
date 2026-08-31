'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Settings, Save, CheckCircle, Usb, ShieldCheck, Database, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    DEMO_MODE: 'true',
    RETENTION_DAYS: '30',
    ADB_PATH: 'adb',
    THREAT_INTEL_PROVIDER: 'offline_heuristics'
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggleDemo = async (enabled: boolean) => {
    const val = enabled ? 'true' : 'false';
    setSettings(prev => ({ ...prev, DEMO_MODE: val }));
    await api.updateSetting('DEMO_MODE', val);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      for (const [k, v] of Object.entries(settings)) {
        await api.updateSetting(k, v);
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-400" />
            Forensic Workstation Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Configure local ADB executable bindings, synthetic demo simulation mode, and data retention policies
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800 animate-fade-in">
            <CheckCircle className="h-4 w-4" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Card 1: Demo Mode Simulation */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Synthetic Demo Simulation Mode</h3>
              <p className="text-xs text-slate-400 max-w-xl">
                When enabled, provides realistic synthetic Android devices (Google Pixel 8 Pro & Samsung Galaxy S24 Ultra) with genuine heuristic malware cases, SMS smishing threats, and contact records so all pipeline features can be tested without a physical device.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.DEMO_MODE === 'true'}
                onChange={(e) => handleToggleDemo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Card 2: ADB Executable Path */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Usb className="h-4 w-4 text-emerald-400" />
              ADB Binary Executable Location
            </h3>
            <p className="text-xs text-slate-400">
              Specify explicit path to `adb.exe` on Windows or leave as default system PATH resolution.
            </p>
          </div>

          <div>
            <input
              type="text"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              value={settings.ADB_PATH || ''}
              onChange={(e) => setSettings({ ...settings, ADB_PATH: e.target.value })}
            />
          </div>
        </div>

        {/* Card 3: Data Retention Policy */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />
              Evidence Retention & Auto-Purge Policy
            </h3>
            <p className="text-xs text-slate-400">
              Configure automatic expiration and purge timelines for non-archived forensic case snapshots.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: '7', label: '7 Days' },
              { id: '30', label: '30 Days (Default)' },
              { id: '90', label: '90 Days' },
              { id: 'never', label: 'Indefinite (Never)' }
            ].map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setSettings({ ...settings, RETENTION_DAYS: opt.id })}
                className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                  settings.RETENTION_DAYS === opt.id
                    ? 'bg-purple-950/80 text-purple-300 border-purple-800 shadow-md ring-1 ring-purple-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-950 hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>SAVE CONFIGURATION</span>
          </button>
        </div>
      </form>
    </div>
  );
}
