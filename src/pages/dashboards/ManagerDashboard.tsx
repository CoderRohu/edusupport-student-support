import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
  Flame,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Ticket, DashboardMetrics } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLABadge } from '../../components/SLABadge';
import { CategoryBadge } from '../../components/CategoryBadge';

export const ManagerDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [escalatedTickets, setEscalatedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, ticketsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getTickets({ view: 'escalated' }),
        ]);
        setMetrics(statsRes.metrics);
        setEscalatedTickets(ticketsRes.tickets);
      } catch (err) {
        console.error('Failed to load manager dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-xl" />
          <div className="h-80 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Key Performance Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tickets */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Total Workload</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics?.totalTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Total tickets logged</div>
        </div>

        {/* Open Tickets */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Active Queue</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-blue-600">
            {metrics?.openTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">In Progress / New</div>
        </div>

        {/* Overdue */}
        <Link
          to="/tickets?view=overdue"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-red-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>SLA Breaches</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-red-600">
            {metrics?.overdueTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Overdue tickets</div>
        </Link>

        {/* Escalated Tickets */}
        <Link
          to="/tickets?view=escalated"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Escalated</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-rose-700">
            {metrics?.escalatedTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Requires executive action</div>
        </Link>

        {/* SLA Compliance */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>SLA Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {metrics?.slaComplianceRate ?? 100}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Target: ≥ 95%</div>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Resolution</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-indigo-700">
            {metrics?.avgResolutionTimeHours ?? 0}h
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Mean closure cycle</div>
        </div>
      </div>

      {/* Escalated Tickets Attention Banner */}
      {escalatedTickets.length > 0 && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-rose-900">
                Critical Escalations Requiring Manager Intervention ({escalatedTickets.length})
              </h3>
            </div>
            <Link
              to="/tickets?view=escalated"
              className="text-xs font-medium text-rose-700 hover:text-rose-900 underline"
            >
              View Escalated Queue
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {escalatedTickets.map((t) => (
              <div
                key={t.id}
                className="bg-white p-3.5 rounded-lg border border-rose-200 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">{t.id}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
                <Link
                  to={`/tickets/${t.id}`}
                  className="block text-xs font-semibold text-slate-900 hover:text-rose-600 line-clamp-1"
                >
                  {t.subject}
                </Link>
                <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100 line-clamp-2">
                  <span className="font-semibold">Reason:</span> {t.escalation?.reason}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Escalated by: {t.escalation?.escalatedByName}</span>
                  <Link
                    to={`/tickets/${t.id}`}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    Take Action →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Grid: Staff Workload & Ticket Ageing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Staff Workload Allocation */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Support Staff Workload & Productivity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time active ticket distribution and resolved counts per agent</p>
            </div>
            <Link
              to="/staff"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Staff Directory
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Staff Agent</th>
                  <th className="px-4 py-2.5 text-center">Active Load</th>
                  <th className="px-4 py-2.5 text-center">Resolved Count</th>
                  <th className="px-4 py-2.5">Capacity Utilization</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.staffWorkload?.map((staff) => {
                  const maxCap = 10;
                  const percent = Math.min(100, Math.round((staff.activeCount / maxCap) * 100));
                  return (
                    <tr key={staff.staffId} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-700">
                            {staff.staffName.charAt(0)}
                          </div>
                          <span>{staff.staffName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                        {staff.activeCount}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-emerald-600">
                        {staff.resolvedCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 max-w-xs">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent > 80 ? 'bg-red-500' : percent > 50 ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                            {percent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/tickets?assignedStaffId=${staff.staffId}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          View Queue
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Ticket Ageing & SLA Breaches */}
        <div className="space-y-6">
          {/* Ageing Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Unresolved Ticket Ageing
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>&lt; 24 Hours (Fresh)</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {metrics?.ageingBreakdown?.lessThan24h ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${
                        ((metrics?.ageingBreakdown?.lessThan24h ?? 0) /
                          Math.max(1, metrics?.openTickets ?? 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>1 to 3 Days</span>
                  <span className="font-mono font-semibold text-blue-600">
                    {metrics?.ageingBreakdown?.oneToThreeDays ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${
                        ((metrics?.ageingBreakdown?.oneToThreeDays ?? 0) /
                          Math.max(1, metrics?.openTickets ?? 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>4 to 7 Days (Ageing)</span>
                  <span className="font-mono font-semibold text-amber-600">
                    {metrics?.ageingBreakdown?.fourToSevenDays ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${
                        ((metrics?.ageingBreakdown?.fourToSevenDays ?? 0) /
                          Math.max(1, metrics?.openTickets ?? 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>&gt; 7 Days (High Risk Stagnation)</span>
                  <span className="font-mono font-semibold text-red-600">
                    {metrics?.ageingBreakdown?.moreThanSevenDays ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full"
                    style={{
                      width: `${
                        ((metrics?.ageingBreakdown?.moreThanSevenDays ?? 0) /
                          Math.max(1, metrics?.openTickets ?? 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Volume by Priority
            </h3>
            <div className="space-y-2">
              {metrics?.byPriority.map((item) => (
                <div
                  key={item.priority}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                >
                  <PriorityBadge priority={item.priority} />
                  <span className="font-mono font-semibold tabular-nums text-slate-800">
                    {item.count} tickets
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Distribution across 10 Institutional Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {metrics?.byCategory.map((cat) => (
            <Link
              key={cat.category}
              to={`/tickets?category=${encodeURIComponent(cat.category)}`}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-center block"
            >
              <div className="text-xs font-semibold text-slate-900 truncate">
                {cat.category}
              </div>
              <div className="text-lg font-bold font-mono text-indigo-700 mt-1 tabular-nums">
                {cat.count}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
