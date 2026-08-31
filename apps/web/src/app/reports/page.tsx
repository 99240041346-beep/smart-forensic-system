'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '@/lib/api';
import { RiskBadge } from '@/components/RiskBadge';
import { ReportExporter } from '@/lib/reportExporter';
import {
  FileText,
  Download,
  Printer,
  FileJson,
  Shield,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { DISCLAIMER_NOTICE } from '@smart-forensic/shared';

export default function ReportsPage() {
  const { selectedDevice } = useDevice();
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.getCases().then(list => {
      setCases(list);
      if (list.length > 0) {
        setSelectedCase(list[0]);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      // Build report snapshot
      Promise.all([
        api.getDeviceInfo(selectedDevice.serial).catch(() => null),
        api.getDeviceSecurity(selectedDevice.serial).catch(() => null),
        api.getDeviceApps(selectedDevice.serial).catch(() => ({ apps: [] })),
        api.getDeviceSms(selectedDevice.serial).catch(() => ({ sms: [] })),
        api.getDeviceContacts(selectedDevice.serial).catch(() => ({ contacts: [] })),
        api.getDeviceProcesses(selectedDevice.serial).catch(() => ({ processes: [] }))
      ]).then(([dev, sec, apps, sms, cnt, proc]) => {
        setReportData({
          reportId: `RPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          generatedAt: new Date().toISOString(),
          generatedBy: 'Lead Forensics Investigator',
          caseInfo: selectedCase || {
            caseNumber: 'CASE-2026-0001',
            title: 'Mobile Forensic Risk & Security Analysis',
            investigatorName: 'Lead Forensics Investigator'
          },
          deviceInfo: dev || {
            model: selectedDevice.model,
            maskedSerial: selectedDevice.maskedSerial,
            androidVersion: '15',
            securityPatchLevel: '2024-08-05'
          },
          securityData: sec,
          apps: apps.apps || [],
          sms: sms.sms || [],
          contacts: cnt.contacts || [],
          processes: proc.processes || [],
          disclaimer: DISCLAIMER_NOTICE
        });
      });
    }
  }, [selectedDevice, selectedCase]);

  const handleExportJson = () => {
    if (!reportData) return;
    ReportExporter.exportJson(reportData, `forensic-dossier-${reportData.caseInfo?.caseNumber || 'export'}.json`);
  };

  const handleExportCsv = () => {
    if (!reportData) return;
    const rows = [
      ['CATEGORY', 'ITEM_ID', 'LABEL / NAME', 'RISK_LEVEL', 'EVIDENCE_OR_FLAGS'],
      ...reportData.apps.map((a: any) => ['APPLICATION', a.packageName, `"${a.appName}"`, a.risk?.riskLevel || 'SAFE', `"${(a.risk?.flags || []).join('; ')}"`]),
      ...reportData.sms.map((s: any) => ['SMS_MESSAGE', s.id, `"${s.address}"`, s.isSuspicious ? 'HIGH_RISK' : 'SAFE', `"${s.body.replace(/"/g, '""')}"`]),
      ...reportData.contacts.map((c: any) => ['CONTACT', c.id, `"${c.name}"`, c.isDuplicate ? 'DUPLICATE' : 'UNIQUE', c.source]),
      ...reportData.processes.map((p: any) => ['PROCESS', p.pid.toString(), `"${p.processName}"`, p.isSuspicious ? 'FLAGGED' : 'NORMAL', `CPU: ${p.cpuPercent}%`])
    ];
    ReportExporter.exportCsv(rows, `forensic-evidence-${reportData.caseInfo?.caseNumber || 'export'}.csv`);
  };

  const handlePrintPdf = () => {
    ReportExporter.printOrSavePdf();
  };

  if (!reportData) {
    return <div className="p-8 text-center text-slate-500">Compiling forensic dossier...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            Official Forensic Report & Evidence Dossier
          </h2>
          <p className="text-xs text-slate-400">
            Export court-ready, non-invasive digital forensic summaries in PDF, JSON, and CSV formats
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all"
          >
            <FileJson className="h-4 w-4 text-cyan-400" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4 text-purple-400" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-950 hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>PRINT / SAVE PDF</span>
          </button>
        </div>
      </div>

      {/* Official Forensic Printable Document */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-8 print:border-none print:p-0 print:bg-white print:text-black">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
              <Shield className="h-4 w-4" />
              <span>Smart Forensic System — Digital Evidence Report</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 print:text-black tracking-tight">
              Android Forensic & Security Analysis Dossier
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Report ID: {reportData.reportId} • Generated: {new Date(reportData.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-800 text-slate-300">
              CONFIDENTIAL / INVESTIGATIVE
            </span>
            <div className="mt-2">
              <RiskBadge level={reportData.securityData?.riskLevel || 'SAFE'} size="lg" />
            </div>
          </div>
        </div>

        {/* Investigation & Device Metadata */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 space-y-2 print:bg-gray-100">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Case Metadata</h3>
            <p><span className="text-slate-500">Case Number:</span> <strong className="text-slate-200">{reportData.caseInfo?.caseNumber}</strong></p>
            <p><span className="text-slate-500">Case Title:</span> {reportData.caseInfo?.title}</p>
            <p><span className="text-slate-500">Lead Investigator:</span> {reportData.generatedBy}</p>
            <p><span className="text-slate-500">Authorization:</span> Non-Invasive ADB & Explicit Permission Model</p>
          </div>

          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 space-y-2 print:bg-gray-100">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Target Device Snapshot</h3>
            <p><span className="text-slate-500">Device Model:</span> <strong className="text-slate-200">{reportData.deviceInfo?.model}</strong></p>
            <p><span className="text-slate-500">Serial Identifier:</span> <span className="font-mono text-slate-300">{reportData.deviceInfo?.maskedSerial}</span></p>
            <p><span className="text-slate-500">OS Version:</span> Android {reportData.deviceInfo?.androidVersion} (API {reportData.deviceInfo?.apiLevel || '34'})</p>
            <p><span className="text-slate-500">Security Patch:</span> {reportData.deviceInfo?.securityPatchLevel}</p>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Executive Forensic Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Security Score</span>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {reportData.securityData?.securityScore ?? 85}/100
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Applications Audited</span>
              <p className="text-2xl font-black text-purple-400 font-mono mt-1">
                {reportData.apps.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Suspicious Apps</span>
              <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                {reportData.apps.filter((a: any) => a.risk?.riskLevel === 'SUSPICIOUS' || a.risk?.riskLevel === 'HIGH_RISK' || a.risk?.riskLevel === 'CRITICAL').length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Smishing Messages</span>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                {reportData.sms.filter((s: any) => s.isSuspicious).length}
              </p>
            </div>
          </div>
        </div>

        {/* Key Security Findings Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Identified Security Anomalies & Heuristics</h3>
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Indicator Title</th>
                  <th className="px-4 py-2.5">Severity</th>
                  <th className="px-4 py-2.5">Evidence & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reportData.securityData?.indicators?.map((ind: any) => (
                  <tr key={ind.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{ind.category}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-100">{ind.title}</td>
                    <td className="px-4 py-2.5"><RiskBadge level={ind.severity} size="sm" /></td>
                    <td className="px-4 py-2.5 text-slate-400">{ind.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Legal & Heuristic Disclaimer */}
        <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed space-y-1">
          <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Statutory & Heuristic Disclaimer</p>
          <p>{reportData.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
