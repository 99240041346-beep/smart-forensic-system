'use client';

import React, { useState, useEffect } from 'react';
import { useDevice } from '../ClientLayout';
import { api } from '@/lib/api';
import { RiskBadge } from '@/components/RiskBadge';
import { SecurityScoreGauge } from '@/components/SecurityScoreGauge';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock
} from 'lucide-react';

export default function SecurityPage() {
  const { selectedDevice } = useDevice();
  const [securityData, setSecurityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDevice) {
      setIsLoading(true);
      api.getDeviceSecurity(selectedDevice.serial)
        .then(setSecurityData)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedDevice]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-emerald-400" />
            Device Security Posture & Heuristic Indicators
          </h2>
          <p className="text-xs text-slate-400">
            Multi-factor verification of Android boot integrity, patch timeliness, root tampering, and encryption state
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Score Gauge & Breakdown */}
        <div className="space-y-6">
          <SecurityScoreGauge
            score={securityData?.securityScore ?? 85}
            riskLevel={securityData?.riskLevel ?? 'SAFE'}
            breakdown={securityData?.scoreBreakdown}
          />

          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scoring Methodology</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Security Posture Score starts from a benchmark of 100 points and applies transparent heuristic penalty deductions for verified integrity anomalies (e.g. outdated patches, unlocked bootloader, unencrypted storage, or root presence).
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <p>• <strong>Root Detection:</strong> -30 pts</p>
              <p>• <strong>Critically Outdated Patch (&gt;1 yr):</strong> -25 pts</p>
              <p>• <strong>Unlocked Bootloader / Orange State:</strong> -20 pts</p>
              <p>• <strong>Unencrypted Storage Partition:</strong> -20 pts</p>
              <p>• <strong>USB Debugging Active:</strong> -10 pts</p>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Security Indicators List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Comprehensive Integrity Indicator Checklist
            </h3>

            <div className="space-y-3">
              {securityData?.indicators?.map((ind: any) => {
                const isDetected = ind.status === 'DETECTED';
                const isBenign = ind.severity === 'LOW';

                return (
                  <div
                    key={ind.id}
                    className={`rounded-xl p-4 border transition-all ${
                      isDetected && !isBenign
                        ? 'bg-slate-950/90 border-slate-700/80 shadow-md'
                        : 'bg-slate-950/40 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5">
                          {ind.severity === 'CRITICAL' || ind.severity === 'HIGH' ? (
                            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                          ) : ind.severity === 'MODERATE' ? (
                            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                          )}
                          <h4 className="text-sm font-bold text-slate-100">{ind.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            ind.status === 'DETECTED' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {ind.status}
                          </span>
                          <RiskBadge level={ind.severity} size="sm" />
                        </div>

                        <p className="text-xs text-slate-300 pl-7">{ind.details}</p>

                        <div className="pl-7 pt-1 flex items-start gap-1.5 text-[11px] text-emerald-400/90 font-medium">
                          <span className="text-slate-500 font-bold uppercase">Mitigation:</span>
                          <span>{ind.recommendation}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono text-xs font-bold ${ind.scoreImpact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {ind.scoreImpact === 0 ? '0 pts' : `${ind.scoreImpact} pts`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
