'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Smartphone, Shield, AlertTriangle, Usb, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { AdbDevice, AdbStatus } from '@smart-forensic/shared';

interface NavbarProps {
  selectedDevice: AdbDevice | null;
  onSelectDevice: (device: AdbDevice) => void;
  onRefreshCompleted?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ selectedDevice, onSelectDevice, onRefreshCompleted }) => {
  const [adbStatus, setAdbStatus] = useState<AdbStatus | null>(null);
  const [devices, setDevices] = useState<AdbDevice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatusAndDevices = async () => {
    try {
      setIsRefreshing(true);
      setErrorMsg(null);
      const res = await api.refreshAdb();
      setAdbStatus(res.status);
      setDevices(res.devices);

      if (res.devices.length > 0 && !selectedDevice) onSelectDevice(res.devices[0]);
      else if (selectedDevice) {
        const stillExists = res.devices.find(d => d.serial === selectedDevice.serial);
        if (stillExists) onSelectDevice(stillExists);
        else if (res.devices.length > 0) onSelectDevice(res.devices[0]);
      }
      if (onRefreshCompleted) onRefreshCompleted();
    } catch (err: any) {
      setErrorMsg(err.message || 'ADB connection failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatusAndDevices();
    const interval = setInterval(() => {
      api.getDevices().then(res => setDevices(res.devices)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"><Shield className="h-5 w-5" /></div>
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">SMART FORENSIC SYSTEM <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">v1.0 LAB</span></h1>
          <p className="text-xs text-slate-400">Authorized Android Mobile Security & Forensic Station</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <Smartphone className="h-4 w-4 text-slate-400" />
          <select aria-label="Select target Android device" className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer" value={selectedDevice?.serial || ''} onChange={(e) => { const found = devices.find(d => d.serial === e.target.value); if (found) onSelectDevice(found); }}>
            {devices.length === 0 && <option value="">No Devices Detected</option>}
            {devices.map((d) => <option key={d.serial} value={d.serial} className="bg-slate-900 text-slate-200">{d.model} ({d.maskedSerial}) {d.isDemo ? '• [DEMO]' : ''}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wider uppercase transition-colors bg-slate-900 border-slate-800">
          <Usb className="h-4 w-4 text-emerald-400" />
          <span className="text-slate-400">ADB:</span>
          {adbStatus?.isInstalled ? <span className="text-emerald-400 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />READY ({devices.length} {devices.length === 1 ? 'DEV' : 'DEVS'})</span> : <span className="text-amber-400 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />NOT DETECTED</span>}
        </div>

        <button onClick={fetchStatusAndDevices} disabled={isRefreshing} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-emerald-950 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /><span>{isRefreshing ? 'SCANNING USB...' : 'REFRESH ADB'}</span>
        </button>

        <a href="/logout" className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:border-rose-900 hover:text-rose-300 transition-colors" aria-label="Sign out">
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </a>
      </div>
    </header>
  );
};
