import React from 'react';
import { RiskLevel } from '@smart-forensic/shared';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const normLevel = (level || 'UNKNOWN').toUpperCase();

  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let label = normLevel;

  switch (normLevel) {
    case 'SAFE':
    case 'LOW':
      bg = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
      dotColor = 'bg-emerald-400';
      label = 'SAFE';
      break;
    case 'INFORMATIONAL':
    case 'MODERATE':
      bg = 'bg-blue-950/70 text-blue-300 border-blue-800/80';
      dotColor = 'bg-blue-400';
      label = 'INFORMATIONAL';
      break;
    case 'SUSPICIOUS':
    case 'ELEVATED':
      bg = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
      dotColor = 'bg-amber-400';
      label = 'SUSPICIOUS';
      break;
    case 'HIGH_RISK':
    case 'HIGH':
      bg = 'bg-rose-950/70 text-rose-300 border-rose-800/80';
      dotColor = 'bg-rose-400';
      label = 'HIGH RISK';
      break;
    case 'CRITICAL':
      bg = 'bg-red-950 text-red-200 border-red-700 animate-pulse';
      dotColor = 'bg-red-500';
      label = 'CRITICAL RISK';
      break;
    default:
      label = 'UNKNOWN';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm font-semibold'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider ${bg} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
