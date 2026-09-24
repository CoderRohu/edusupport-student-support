import { Ticket, SLACalculation } from '../types';

export function calculateSLA(ticket: Ticket): SLACalculation {
  const isResolvedOrClosed = ticket.status === 'Resolved' || ticket.status === 'Closed';
  const deadline = new Date(ticket.slaDeadline).getTime();

  if (isResolvedOrClosed && ticket.resolvedAt) {
    const resolvedTime = new Date(ticket.resolvedAt).getTime();
    const metSla = resolvedTime <= deadline;
    const diff = deadline - resolvedTime;

    return {
      state: 'resolved',
      label: metSla ? 'Resolved (Within SLA)' : 'Resolved (Breached SLA)',
      badgeColor: metSla
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : 'text-amber-700 bg-amber-50 border-amber-200',
      remainingMs: diff,
      remainingText: metSla ? '✓ Met target' : '✓ Resolved late',
      isBreached: !metSla,
    };
  }

  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) {
    const overdueMs = Math.abs(diff);
    return {
      state: 'overdue',
      label: 'Overdue',
      badgeColor: 'text-red-700 bg-red-50 border-red-200',
      remainingMs: diff,
      remainingText: `${formatDuration(overdueMs)} overdue`,
      isBreached: true,
    };
  }

  // 2 hours or less than 25% of SLA window
  const totalWindowMs = (ticket.slaHours || 24) * 3600 * 1000;
  const isDueSoon = diff <= 2 * 3600 * 1000 || diff <= totalWindowMs * 0.25;

  if (isDueSoon) {
    return {
      state: 'due_soon',
      label: 'Due Soon',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      remainingMs: diff,
      remainingText: `${formatDuration(diff)} left`,
      isBreached: false,
    };
  }

  return {
    state: 'on_track',
    label: 'On Track',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    remainingMs: diff,
    remainingText: `${formatDuration(diff)} left`,
    isBreached: false,
  };
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remMins = minutes % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return '< 1m';
}

export function calculateAgeing(createdAt: string): { hours: number; text: string; bucket: '24h' | '1-3d' | '4-7d' | '>7d' } {
  const created = new Date(createdAt).getTime();
  const diffMs = Math.max(0, Date.now() - created);
  const hours = Math.floor(diffMs / (3600 * 1000));

  let bucket: '24h' | '1-3d' | '4-7d' | '>7d' = '24h';
  if (hours > 24 * 7) bucket = '>7d';
  else if (hours > 24 * 3) bucket = '4-7d';
  else if (hours > 24) bucket = '1-3d';

  return {
    hours,
    text: formatDuration(diffMs),
    bucket,
  };
}
