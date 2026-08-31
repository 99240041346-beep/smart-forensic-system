'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Shield, X } from 'lucide-react';
import { ScanStage } from '@smart-forensic/shared';

interface ScanProgressModalProps {
  isOpen: boolean;
  scanId: string | null;
  onClose: () => void;
  onScanCompleted: (scanId: string) => void;
}

const STAGES: Array<{ id: ScanStage; label: string }> = [
  { id: 'INITIALIZE', label: 'ADB Connection & Authorization' },
  { id: 'DEVICE_INFO', label: 'Hardware Specs & OS Build' },
  { id: 'APPLICATION_ENUMERATION', label: 'Package Enumeration & Permissions' },
  { id: 'CONTACT_COLLECTION', label: 'Authorized Contacts' },
  { id: 'SMS_COLLECTION', label: 'Authorized SMS Inspection' },
  { id: 'PROCESS_INFORMATION', label: 'Running Processes & Services' },
  { id: 'SECURITY_ANALYSIS', label: 'Heuristic Rule Analysis' },
  { id: 'RISK_SCORING', label: 'Risk Scoring & Report Compilation' }
];

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  isOpen,
  scanId,
  onClose,
  onScanCompleted
}) => {
  const [currentStage, setCurrentStage] = useState<ScanStage>('INITIALIZE');
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState('Initializing acquisition pipeline...');
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !scanId) {
      setPercent(0);
      setIsCompleted(false);
      setError(null);
      return;
    }

    const eventSource = new EventSource(`http://127.0.0.1:3001/api/scans/${scanId}/events`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.stage) setCurrentStage(data.stage);
        if (data.percent !== undefined) setPercent(data.percent);
        if (data.message) setMessage(data.message);

        if (data.stage === 'COMPLETED' || data.stageStatus === 'completed') {
          setIsCompleted(true);
          setPercent(100);
          eventSource.close();
          onScanCompleted(scanId);
        } else if (data.stage === 'FAILED' || data.stageStatus === 'failed') {
          setError(data.error || 'Forensic acquisition failed');
          eventSource.close();
        }
      } catch (err) {
        // ignore JSON errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isOpen, scanId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Live Forensic Acquisition</h3>
              <p className="text-xs text-slate-400">Target Scan ID: {scanId}</p>
            </div>
          </div>
          {isCompleted && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">{message}</span>
            <span className="text-emerald-400 font-mono">{percent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ease-out ${
                error ? 'bg-rose-500' : isCompleted ? 'bg-emerald-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Stage Checklist */}
        <div className="rounded-xl bg-slate-950/70 p-4 border border-slate-800/80 space-y-2.5 max-h-60 overflow-y-auto">
          {STAGES.map((stg, idx) => {
            const isCurrent = currentStage === stg.id;
            const isDone = isCompleted || percent > ((idx + 1) * 100) / STAGES.length;

            return (
              <div key={stg.id} className="flex items-center gap-3 text-xs">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-emerald-400 animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={isCurrent ? 'text-emerald-300 font-semibold' : isDone ? 'text-slate-300' : 'text-slate-400'}>
                  {stg.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-rose-950/50 p-3 border border-rose-800 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isCompleted && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-500 transition-colors"
            >
              VIEW SCAN RESULTS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
