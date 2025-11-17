import React from 'react';
import { getTriageLevelColor, getTriageLevelLabel } from '@/lib/triageService';
import type { TriageRecord } from '@/lib/triageService';

interface UrgencyBadgeProps {
  level: TriageRecord['triageLevel'];
  size?: 'sm' | 'md' | 'lg';
}

export default function UrgencyBadge({ level, size = 'md' }: UrgencyBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconMap = {
    emergency: '🚨',
    urgent: '⚠️',
    'semi-urgent': '⏰',
    'non-urgent': '✅',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${getTriageLevelColor(level)} ${sizeClasses[size]}`}>
      <span className="mr-1">{iconMap[level]}</span>
      {getTriageLevelLabel(level)}
    </span>
  );
}