import React from 'react';
import { AlertTriangle, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { TicketPriority } from '../types';

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'sm',
  showIcon = true,
}) => {
  const getStyles = () => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Low':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getIcon = () => {
    if (!showIcon) return null;
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    switch (priority) {
      case 'Critical':
        return <AlertCircle className={`${iconSize} text-red-600`} />;
      case 'High':
        return <AlertTriangle className={`${iconSize} text-amber-600`} />;
      case 'Medium':
        return <ArrowUp className={`${iconSize} text-sky-600`} />;
      case 'Low':
        return <ArrowDown className={`${iconSize} text-slate-500`} />;
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border ${sizeClasses} ${getStyles()} whitespace-nowrap`}
    >
      {getIcon()}
      {priority}
    </span>
  );
};
