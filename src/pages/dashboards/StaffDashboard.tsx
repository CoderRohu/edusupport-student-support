import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  AlertTriangle,
  Clock,
  AlertOctagon,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Activity as ActivityIcon,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Ticket, DashboardMetrics, Activity } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLABadge } from '../../components/SLABadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { calculateSLA } from '../../utils/sla';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, ticketsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getTickets(),
        ]);
        setMetrics(statsRes.metrics);
        setAllTickets(ticketsRes.tickets);
      } catch (err) {
        console.error('Failed to load staff dashboard:', err);
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
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl" />
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // Filter specific sets for staff
  const myAssignedTickets = allTickets.filter((t) => t.assignedStaffId === user?.id);
  const myActiveTickets = myAssignedTickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed');
  const unassignedTickets = allTickets.filter((t) => !t.assignedStaffId && t.status !== 'Resolved' && t.status !== 'Closed');

  // Extract recent activities across all tickets
  const recentActivities: { ticketId: string; activity: Activity }[] = [];
  allTickets.forEach((t) => {
    t.activities.forEach((act) => {
      recentActivities.push({ ticketId: t.id, activity: act });
    });
  });
  recentActivities.sort((a, b) => new Date(b.activity.timestamp).getTime() - new Date(a.activity.timestamp).getTime());
  const topActivities = recentActivities.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Triage Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* My Active Tickets */}
        <Link
          to="/tickets?view=my_tickets"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>My Active</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {myActiveTickets.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Assigned to you</div>
        </Link>

        {/* Unassigned Tickets */}
        <Link
          to="/tickets?view=unassigned"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Unassigned</span>
            <Inbox className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600">
            {metrics?.unassignedCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Requires triage</div>
        </Link>

        {/* Due Soon */}
        <Link
          to="/tickets?view=due_soon"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Due Soon</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600">
            {metrics?.dueSoonCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">SLA &lt; 2h left</div>
        </Link>

        {/* Overdue */}
        <Link
          to="/tickets?view=overdue"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-red-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Overdue</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-red-600">
            {metrics?.overdueTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">SLA breached</div>
        </Link>

        {/* Critical Priority */}
        <Link
          to="/tickets?priority=Critical"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-red-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Critical (4h)</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-red-700">
            {metrics?.criticalCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">High severity</div>
        </Link>

        {/* High Priority */}
        <Link
          to="/tickets?priority=High"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-orange-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>High Priority (8h)</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-orange-600">
            {metrics?.highCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">8-hour SLA</div>
        </Link>
      </div>

      {/* Main Grid: My Queue & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Active Tickets Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Your Action Queue</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tickets assigned to you requiring investigation or closure</p>
              </div>
              <Link
                to="/tickets?view=my_tickets"
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <span>View All ({myActiveTickets.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {myActiveTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">All assigned tickets are up to date!</p>
                <p className="text-[11px] text-slate-400 mt-1">Check the unassigned queue to claim new requests.</p>
                <Link
                  to="/tickets?view=unassigned"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                >
                  <span>Go to Unassigned Queue</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Subject & Student</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">SLA Guarantee</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {myActiveTickets.slice(0, 6).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {t.id}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/tickets/${t.id}`}
                            className="font-medium text-slate-900 hover:text-indigo-600 line-clamp-1 max-w-xs"
                          >
                            {t.subject}
                          </Link>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {t.studentName} · {t.category}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3">
                          <SLABadge ticket={t} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/tickets/${t.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Unassigned Spotlight */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Unassigned Tickets Needing Owner ({unassignedTickets.length})
                </h3>
              </div>
              <Link
                to="/tickets?view=unassigned"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {unassignedTickets.slice(0, 4).map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/75 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-slate-900">{t.id}</span>
                      <PriorityBadge priority={t.priority} />
                      <CategoryBadge category={t.category} />
                    </div>
                    <Link
                      to={`/tickets/${t.id}`}
                      className="block text-xs font-semibold text-slate-900 hover:text-indigo-600 truncate mt-1"
                    >
                      {t.subject}
                    </Link>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Raised by {t.studentName} ({t.studentDepartment})
                    </div>
                  </div>
                  <Link
                    to={`/tickets/${t.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors shrink-0"
                  >
                    Claim / Triage
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Tickets by Status & Recent Activity Feed */}
        <div className="space-y-6">
          {/* Tickets by Status Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Tickets by Status
            </h3>
            <div className="space-y-2">
              {metrics?.byStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                  <StatusBadge status={item.status} />
                  <span className="font-mono font-semibold tabular-nums text-slate-800">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline Feed */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 mb-3">
              <ActivityIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Activity Stream
              </h3>
            </div>
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {topActivities.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate">
                        {item.activity.actorName}
                      </span>
                      <Link
                        to={`/tickets/${item.ticketId}`}
                        className="font-mono text-[10px] text-indigo-600 hover:underline shrink-0"
                      >
                        {item.ticketId}
                      </Link>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">
                      {item.activity.details}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {new Date(item.activity.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
