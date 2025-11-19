import React from 'react';
import { getTriageLevelColor, getTriageLevelLabel } from '@/lib/triageService';


interface UrgencyBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function UrgencyBadge({ level, size = 'md' }: UrgencyBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconMap: { [key: number]: string } = {
    1: '🚨',
    2: '⚠️',
    3: '⏰',
    4: '✅',
    5: '✅',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${getTriageLevelColor(level)} ${sizeClasses[size]}`}>
      <span className="mr-1">{iconMap[level]}</span>
      {getTriageLevelLabel(level)}
    </span>
  );
}