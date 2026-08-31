'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '@/lib/api';
import { AdbDevice, DeviceInfo } from '@smart-forensic/shared';
import {
  Smartphone,
  RefreshCw,
  Usb,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  HardDrive,
  Battery,
  Wifi,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function DevicesPage() {
  const { selectedDevice, setSelectedDevice } = useDevice();
  const [devices, setDevices] = useState<AdbDevice[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDevices = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await api.refreshAdb();
      setDevices(res.devices);
      if (res.devices.length > 0 && !selectedDevice) {
        setSelectedDevice(res.devices[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to refresh ADB devices');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      api.getDeviceInfo(selectedDevice.serial)
        .then(setDeviceInfo)
        .catch(() => setDeviceInfo(null));
    }
  }, [selectedDevice]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-400" />
            Device Management & ADB Discovery
          </h2>
          <p className="text-xs text-slate-400">
            Detect, authorize, and inspect physical and synthetic Android mobile endpoints
          </p>
        </div>

        <button
          onClick={loadDevices}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-950 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'DISCOVERING...' : 'REFRESH ADB'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-950/50 p-4 border border-rose-800 text-rose-300 text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">ADB Execution Error</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Connected Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((dev) => {
          const isSelected = selectedDevice?.serial === dev.serial;
          return (
            <div
              key={dev.serial}
              onClick={() => setSelectedDevice(dev)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                    dev.state === 'device'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{dev.model}</h3>
                    <p className="text-xs font-mono text-slate-400">{dev.maskedSerial}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  dev.state === 'device'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border-amber-800'
                }`}>
                  {dev.state}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Product: {dev.product}</span>
                {dev.isDemo && (
                  <span className="text-[10px] text-amber-400 font-semibold uppercase">Demo Profile</span>
                )}
              </div>
            </div>
          );
        })}

        {devices.length === 0 && !isRefreshing && (
          <div className="col-span-full rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-8 text-center space-y-3">
            <Usb className="h-8 w-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No Android Devices Detected</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Connect an authorized Android smartphone via USB, enable Developer Options & USB Debugging, and click Refresh ADB.
            </p>
          </div>
        )}
      </div>

      {/* Detailed Technical Specifications for Selected Device */}
      {deviceInfo && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Technical Device Specification Dossier</h3>
              <p className="text-xs text-slate-400">Extracted securely via ADB system properties</p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
            >
              Open Live Dashboard <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            {/* Column 1: System & Firmware */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">OS & Firmware</h4>
              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Manufacturer</span>
                  <span className="font-semibold text-slate-200">{deviceInfo.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model Name</span>
                  <span className="font-semibold text-slate-200">{deviceInfo.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Android Version</span>
                  <span className="font-semibold text-emerald-400">Android {deviceInfo.androidVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">API Level</span>
                  <span className="font-mono text-slate-200">API {deviceInfo.apiLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CPU Architecture</span>
                  <span className="font-mono text-slate-200">{deviceInfo.architecture}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Build Number</span>
                  <span className="font-mono text-slate-400 truncate max-w-[150px]">{deviceInfo.buildNumber}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Security & Integrity State */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Security Integrity</h4>
              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Patch</span>
                  <span className="font-semibold text-slate-200">{deviceInfo.securityPatchLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verified Boot</span>
                  <span className="font-semibold uppercase text-emerald-400">{deviceInfo.verifiedBootState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage Encryption</span>
                  <span className="font-semibold uppercase text-emerald-400">{deviceInfo.encryptionState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Root Access</span>
                  <span className={`font-semibold ${deviceInfo.rootDetected ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {deviceInfo.rootDetected ? 'ROOT DETECTED' : 'NOT DETECTED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Developer Options</span>
                  <span className="text-amber-400 font-semibold">ENABLED</span>
                </div>
              </div>
            </div>

            {/* Column 3: Display & Hardware Resources */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Display & Power</h4>
              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Display Resolution</span>
                  <span className="font-mono text-slate-200">{deviceInfo.screenResolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Screen Density</span>
                  <span className="font-mono text-slate-200">{deviceInfo.screenDensityDpi} DPI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery Level</span>
                  <span className="font-semibold text-emerald-400">{deviceInfo.battery?.level}% ({deviceInfo.battery?.status})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery Health</span>
                  <span className="font-semibold text-slate-200">{deviceInfo.battery?.health}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total RAM</span>
                  <span className="font-mono text-slate-200">{deviceInfo.memory?.formattedTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
