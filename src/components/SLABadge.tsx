import React from 'react';
import { Clock, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Ticket } from '../types';
import { calculateSLA } from '../utils/sla';

interface SLABadgeProps {
  ticket: Ticket;
  showDetails?: boolean;
}

export const SLABadge: React.FC<SLABadgeProps> = ({ ticket, showDetails = true }) => {
  const sla = calculateSLA(ticket);

  const getIcon = () => {
    switch (sla.state) {
      case 'resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'overdue':
        return <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0 animate-pulse" />;
      case 'due_soon':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'on_track':
        return <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
  };

  const getDot = () => {
    switch (sla.state) {
      case 'resolved':
        return 'bg-emerald-500';
      case 'overdue':
        return 'bg-red-500 animate-ping';
      case 'due_soon':
        return 'bg-amber-500';
      case 'on_track':
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${sla.badgeColor} whitespace-nowrap`}
      >
        {getIcon()}
        <span>{sla.label}</span>
      </span>
      {showDetails && (
        <span
          className={`text-xs font-mono tabular-nums ${
            sla.state === 'overdue'
              ? 'text-red-600 font-semibold'
              : sla.state === 'due_soon'
              ? 'text-amber-700 font-medium'
              : 'text-slate-500'
          }`}
        >
          ({sla.remainingText})
        </span>
      )}
    </div>
  );
};
