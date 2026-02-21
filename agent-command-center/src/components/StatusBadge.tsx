import React from 'react';
import type { Agent } from '../types/agent';

interface StatusBadgeProps {
  status: Agent['status'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    idle: 'bg-black text-matrix border-matrix',
    busy: 'bg-black text-amber-500 border-amber-500',
    error: 'bg-black text-red-500 border-red-500',
  };

  const labels = {
    idle: 'Idle',
    busy: 'Busy',
    error: 'Error',
  };

  return (
    <span className={`px-3 py-1 rounded text-xs font-medium border font-terminal ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};
