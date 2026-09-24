import React from 'react';
import { TicketStatus } from '../types';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyles = () => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Assigned':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending Student':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Pending Internal':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Reopened':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'New':
        return 'bg-blue-500';
      case 'Assigned':
        return 'bg-purple-500';
      case 'In Progress':
        return 'bg-amber-500';
      case 'Pending Student':
        return 'bg-orange-500';
      case 'Pending Internal':
        return 'bg-indigo-500';
      case 'Resolved':
        return 'bg-emerald-500';
      case 'Closed':
        return 'bg-slate-500';
      case 'Reopened':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${sizeClasses} ${getStyles()} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {status}
    </span>
  );
};
