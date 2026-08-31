'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from './ClientLayout';
import { api } from '@/lib/api';
import { RiskBadge } from '@/components/RiskBadge';
import { SecurityScoreGauge } from '@/components/SecurityScoreGauge';
import { ScanProgressModal } from '@/components/ScanProgressModal';
import {
  Smartphone,
  Shield,
  Layers,
  Users,
  MessageSquare,
  Activity,
  Play,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Cpu,
  BatteryCharging,
  Flame
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { selectedDevice } = useDevice();
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [appsSummary, setAppsSummary] = useState<any>(null);
  const [smsSummary, setSmsSummary] = useState<any>(null);
  const [contactsSummary, setContactsSummary] = useState<any>(null);
  const [processesSummary, setProcessesSummary] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!selectedDevice) return;
    setIsLoading(true);
    try {
      const [devInfo, sec, apps, sms, contacts, proc, cList] = await Promise.all([
        api.getDeviceInfo(selectedDevice.serial).catch(() => null),
        api.getDeviceSecurity(selectedDevice.serial).catch(() => null),
        api.getDeviceApps(selectedDevice.serial).catch(() => ({ apps: [], total: 0, suspicious: 0 })),
        api.getDeviceSms(selectedDevice.serial).catch(() => ({ sms: [], total: 0, suspiciousCount: 0 })),
        api.getDeviceContacts(selectedDevice.serial).catch(() => ({ contacts: [], total: 0 })),
        api.getDeviceProcesses(selectedDevice.serial).catch(() => ({ processes: [], total: 0, suspiciousCount: 0 })),
        api.getCases().catch(() => [])
      ]);

      setDeviceInfo(devInfo);
      setSecurityData(sec);
      setAppsSummary(apps);
      setSmsSummary(sms);
      setContactsSummary(contacts);
      setProcessesSummary(proc);
      setCases(cList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedDevice]);

  const handleStartScan = async () => {
    if (!selectedDevice) return;
    try {
      // Find or create case
      let targetCase = cases.find(c => c.deviceSerial === selectedDevice.serial && c.status === 'OPEN');
      if (!targetCase) {
        targetCase = await api.createCase({
          title: `Forensic Scan - ${selectedDevice.model}`,
          description: 'Automated DFIR acquisition and risk scoring',
          deviceSerial: selectedDevice.serial,
          deviceModel: selectedDevice.model,
          tags: ['Triage', 'AutoScan']
        });
      }

      const scanRes = await api.startScan(targetCase.id, selectedDevice.serial);
      setActiveScanId(scanRes.scanId);
      setIsScanning(true);
    } catch (err: any) {
      alert(`Error starting scan: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              {deviceInfo ? deviceInfo.marketName : (selectedDevice?.model || 'Device Station')}
            </h2>
            <RiskBadge level={securityData?.riskLevel || 'UNKNOWN'} size="md" />
            {selectedDevice?.isDemo && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-950/80 text-amber-400 border border-amber-800">
                SYNTHETIC DEMO DEVICE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Serial: <span className="font-mono text-slate-300">{deviceInfo?.maskedSerial || selectedDevice?.maskedSerial || 'N/A'}</span> • 
            Android {deviceInfo?.androidVersion || '14'} (API {deviceInfo?.apiLevel || '34'}) • 
            Patch: {deviceInfo?.securityPatchLevel || 'Current'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartScan}
            disabled={!selectedDevice}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>START FULL FORENSIC SCAN</span>
          </button>

          <Link
            href="/reports"
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all"
          >
            <FileDown className="h-4 w-4 text-slate-400" />
            <span>EXPORT DOSSIER</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Device State */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Device State</span>
            <Smartphone className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-slate-100 uppercase">{selectedDevice?.state || 'READY'}</p>
          <p className="text-[10px] text-slate-400">ADB Authorized</p>
        </div>

        {/* Security Score */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Security Score</span>
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-slate-100 font-mono">
            {securityData ? `${securityData.securityScore}/100` : '85/100'}
          </p>
          <p className="text-[10px] text-emerald-400 font-medium">Heuristic Multi-Factor</p>
        </div>

        {/* Installed Apps */}
        <Link href="/applications" className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Installed Apps</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-lg font-bold text-slate-100">{appsSummary?.total || 0}</p>
          <p className="text-[10px] text-amber-400 font-medium">{appsSummary?.suspicious || 0} Suspicious</p>
        </Link>

        {/* Contacts */}
        <Link href="/contacts" className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Contacts</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-slate-100">{contactsSummary?.total || 0}</p>
          <p className="text-[10px] text-slate-400">Address Book</p>
        </Link>

        {/* SMS Messages */}
        <Link href="/sms" className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">SMS Messages</span>
            <MessageSquare className="h-4 w-4 text-pink-400" />
          </div>
          <p className="text-lg font-bold text-slate-100">{smsSummary?.total || 0}</p>
          <p className="text-[10px] text-rose-400 font-medium">{smsSummary?.suspiciousCount || 0} Smishing Alert</p>
        </Link>

        {/* Running Processes */}
        <Link href="/processes" className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Running Tasks</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-slate-100">{processesSummary?.total || 0}</p>
          <p className="text-[10px] text-slate-400">{processesSummary?.suspiciousCount || 0} Flagged</p>
        </Link>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Security Posture Gauge & Hardware Specs */}
        <div className="space-y-6">
          <SecurityScoreGauge
            score={securityData?.securityScore ?? 85}
            riskLevel={securityData?.riskLevel ?? 'SAFE'}
            breakdown={securityData?.scoreBreakdown}
          />

          {/* Hardware & Partition Resource Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hardware & Telemetry</h3>
            
            <div className="space-y-3">
              {/* Storage */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <HardDrive className="h-3.5 w-3.5 text-slate-400" /> Internal Storage
                  </span>
                  <span className="font-mono text-slate-400">
                    {deviceInfo?.storage?.formattedUsed || '52 GB'} / {deviceInfo?.storage?.formattedTotal || '128 GB'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${deviceInfo?.storage?.percentageUsed || 41}%` }} />
                </div>
              </div>

              {/* RAM Memory */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Cpu className="h-3.5 w-3.5 text-slate-400" /> RAM Memory
                  </span>
                  <span className="font-mono text-slate-400">
                    {deviceInfo?.memory?.formattedUsed || '4.5 GB'} / {deviceInfo?.memory?.formattedTotal || '8.0 GB'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${deviceInfo?.memory?.percentageUsed || 56}%` }} />
                </div>
              </div>

              {/* Battery */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" /> Battery Status
                </span>
                <span className="font-semibold text-emerald-400">
                  {deviceInfo?.battery?.level || 88}% ({deviceInfo?.battery?.status || 'Charging'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Security Findings & Indicators */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Security Findings & Heuristics</h3>
                <p className="text-xs text-slate-400">Transparent Multi-Factor Risk Assessment</p>
              </div>
              <Link href="/security" className="text-xs font-semibold text-emerald-400 hover:underline">
                View All Indicators →
              </Link>
            </div>

            {/* Indicator items */}
            <div className="space-y-3">
              {securityData?.indicators?.map((ind: any) => (
                <div
                  key={ind.id}
                  className={`rounded-xl p-4 border transition-all ${
                    ind.status === 'DETECTED' && ind.severity !== 'LOW'
                      ? 'bg-slate-950/90 border-slate-700/80 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {ind.severity === 'CRITICAL' || ind.severity === 'HIGH' ? (
                          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                        ) : ind.severity === 'MODERATE' ? (
                          <Flame className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-slate-200">{ind.title}</h4>
                        <RiskBadge level={ind.severity} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 pl-6">{ind.details}</p>
                      <p className="text-[11px] text-emerald-400/90 pl-6 font-medium">
                        Recommendation: {ind.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Scan Pipeline Modal */}
      <ScanProgressModal
        isOpen={isScanning}
        scanId={activeScanId}
        onClose={() => {
          setIsScanning(false);
          loadDashboardData();
        }}
        onScanCompleted={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
}
