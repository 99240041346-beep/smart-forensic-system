import React from 'react';
import { RiskLevel } from '@smart-forensic/shared';

interface SecurityScoreGaugeProps {
  score: number; // 0 to 100
  riskLevel: RiskLevel | string;
  breakdown?: Array<{ factor: string; points: number; description: string }>;
}

export const SecurityScoreGauge: React.FC<SecurityScoreGaugeProps> = ({ score, riskLevel, breakdown }) => {
  let scoreColor = 'text-emerald-400';
  let barColor = 'bg-emerald-500';
  let verdict = 'OPTIMAL POSTURE';

  if (score < 40) {
    scoreColor = 'text-rose-500';
    barColor = 'bg-rose-500';
    verdict = 'CRITICAL RISK DETECTED';
  } else if (score < 60) {
    scoreColor = 'text-rose-400';
    barColor = 'bg-rose-400';
    verdict = 'HIGH RISK POSTURE';
  } else if (score < 75) {
    scoreColor = 'text-amber-400';
    barColor = 'bg-amber-400';
    verdict = 'ELEVATED SUSPICIOUS INDICATORS';
  } else if (score < 90) {
    scoreColor = 'text-blue-400';
    barColor = 'bg-blue-400';
    verdict = 'MODERATE / INFORMATIONAL';
  }

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Calculated Security Score</h3>
          <p className="text-xs text-slate-400">Explainable Multi-Factor Integrity Assessment</p>
        </div>
        <div className={`text-3xl font-black ${scoreColor} font-mono`}>
          {score}<span className="text-sm font-normal text-slate-400">/100</span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="font-semibold text-slate-300">Posture Verdict:</span>
        <span className={`font-bold ${scoreColor}`}>{verdict}</span>
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score Impact Factors:</div>
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-950/50">
              <span className="text-slate-300 truncate max-w-[280px]">{item.factor}</span>
              <span className={`font-mono font-semibold ${item.points < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {item.points > 0 ? `+${item.points}` : item.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
