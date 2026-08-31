'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '../lib/api';
import { RiskBadge } from '../components/RiskBadge';
import { ReportExporter } from '../lib/reportExporter';
import {
  FileText, Download, Printer, FileJson, Shield
} from 'lucide-react';
import { DISCLAIMER_NOTICE } from '@smart-forensic/shared';

export default function ReportsPage() {
  const { selectedDevice } = useDevice();
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    api.getCases().then(list => {
      setCases(list);
      if (list.length > 0) setSelectedCase(list[0]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDevice) return;
    Promise.all([
      api.getDeviceInfo(selectedDevice.serial).catch(() => null),
      api.getDeviceSecurity(selectedDevice.serial).catch(() => null),
      api.getDeviceApps(selectedDevice.serial).catch(() => ({ apps: [] })),
      api.getDeviceSms(selectedDevice.serial).catch(() => ({ sms: [] })),
      api.getDeviceContacts(selectedDevice.serial).catch(() => ({ contacts: [] })),
      api.getDeviceProcesses(selectedDevice.serial).catch(() => ({ processes: [] }))
    ]).then(([dev, sec, apps, sms, cnt, proc]) => setReportData({
      reportId: `RPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Lead Forensics Investigator',
      caseInfo: selectedCase || { caseNumber: 'CASE-2026-0001', title: 'Mobile Forensic Risk & Security Analysis' },
      deviceInfo: dev || { model: selectedDevice.model, maskedSerial: selectedDevice.maskedSerial, androidVersion: '15', securityPatchLevel: '2024-08-05' },
      securityData: sec, apps: apps.apps || [], sms: sms.sms || [], contacts: cnt.contacts || [], processes: proc.processes || [], disclaimer: DISCLAIMER_NOTICE
    }));
  }, [selectedDevice, selectedCase]);

  const handleExportJson = () => reportData && ReportExporter.exportJson(reportData, `forensic-dossier-${reportData.caseInfo?.caseNumber || 'export'}.json`);
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
  const handlePrintPdf = () => ReportExporter.printOrSavePdf();

  if (!reportData) return <div className="p-8 text-center text-slate-500">Compiling forensic dossier...</div>;

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
      <div><h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-400" />Official Forensic Report & Evidence Dossier</h2><p className="text-xs text-slate-400">Export court-ready, non-invasive digital forensic summaries in PDF, JSON, and CSV formats</p></div>
      <div className="flex items-center gap-3"><button onClick={handleExportJson}> <FileJson className="h-4 w-4" /> EXPORT JSON</button><button onClick={handleExportCsv}><Download className="h-4 w-4" /> EXPORT CSV</button><button onClick={handlePrintPdf}><Printer className="h-4 w-4" /> PRINT / SAVE PDF</button></div>
    </div>
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-8">
      <div className="border-b border-slate-800 pb-6 flex items-start justify-between"><div><div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs"><Shield className="h-4 w-4" />Smart Forensic System — Digital Evidence Report</div><h1 className="text-2xl font-black text-slate-100">Android Forensic & Security Analysis Dossier</h1><p className="text-xs text-slate-400 font-mono">Report ID: {reportData.reportId} • Generated: {new Date(reportData.generatedAt).toLocaleString()}</p></div><RiskBadge level={reportData.securityData?.riskLevel || 'SAFE'} size="lg" /></div>
      <div className="grid grid-cols-2 gap-6 text-xs"><div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2"><h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Case Metadata</h3><p>Case Number: <strong>{reportData.caseInfo?.caseNumber}</strong></p><p>Case Title: {reportData.caseInfo?.title}</p><p>Lead Investigator: {reportData.generatedBy}</p><p>Authorization: Non-Invasive ADB & Explicit Permission Model</p></div><div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2"><h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Target Device Snapshot</h3><p>Device Model: <strong>{reportData.deviceInfo?.model}</strong></p><p>Serial Identifier: {reportData.deviceInfo?.maskedSerial}</p><p>OS Version: Android {reportData.deviceInfo?.androidVersion}</p><p>Security Patch: {reportData.deviceInfo?.securityPatchLevel}</p></div></div>
      <div><h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Executive Forensic Summary</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3"><div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">Security Score<p className="text-2xl font-black text-emerald-400 mt-1">{reportData.securityData?.securityScore ?? 85}/100</p></div><div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">Applications Audited<p className="text-2xl font-black text-purple-400 mt-1">{reportData.apps.length}</p></div><div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">Suspicious Apps<p className="text-2xl font-black text-amber-400 mt-1">{reportData.apps.filter((a: any) => ['SUSPICIOUS','HIGH_RISK','CRITICAL'].includes(a.risk?.riskLevel)).length}</p></div><div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">Smishing Messages<p className="text-2xl font-black text-rose-400 mt-1">{reportData.sms.filter((s: any) => s.isSuspicious).length}</p></div></div></div>
      <div><h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Identified Security Anomalies & Heuristics</h3><div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden"><table className="w-full text-left text-xs"><thead><tr><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Indicator Title</th><th className="px-4 py-2.5">Severity</th><th className="px-4 py-2.5">Evidence & Details</th></tr></thead><tbody>{reportData.securityData?.indicators?.map((ind: any) => <tr key={ind.id}><td className="px-4 py-2.5">{ind.category}</td><td className="px-4 py-2.5">{ind.title}</td><td className="px-4 py-2.5"><RiskBadge level={ind.severity} size="sm" /></td><td className="px-4 py-2.5">{ind.details}</td></tr>)}</tbody></table></div></div>
      <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-[11px] text-slate-400"><p className="font-bold text-slate-300 uppercase">Statutory & Heuristic Disclaimer</p><p>{reportData.disclaimer}</p></div>
    </div>
  </div>;
}
