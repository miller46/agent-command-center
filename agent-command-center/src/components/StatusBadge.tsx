import React from 'react';
import type { Agent } from '../types/agent';

interface StatusBadgeProps {
  status: Agent['status'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    idle: 'bg-green-100 text-green-800 border-green-200',
    busy: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels = {
    idle: 'Idle',
    busy: 'Busy',
    error: 'Error',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};
