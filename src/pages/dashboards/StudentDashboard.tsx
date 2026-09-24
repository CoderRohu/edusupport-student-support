import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Ticket, DashboardMetrics } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLABadge } from '../../components/SLABadge';
import { CategoryBadge } from '../../components/CategoryBadge';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
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
        setRecentTickets(ticketsRes.tickets.slice(0, 5));
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Student ID: <span className="font-mono font-medium text-slate-700">{user?.studentId}</span> · Department: {user?.department}
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise New Ticket</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Requests Raised</span>
            <TicketIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics?.totalTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            All submitted requests
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Open & Active</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-blue-600">
            {metrics?.openTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Currently with support desk
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Awaiting Action</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600">
            {metrics?.pendingTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Pending student or internal review
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Resolved Requests</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {metrics?.resolvedTickets ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Successfully closed or resolved
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Your Recent Requests</h3>
            <p className="text-xs text-slate-500 mt-0.5">Track resolution progress and SLA guarantees in real-time</p>
          </div>
          <Link
            to="/tickets"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>View All ({metrics?.totalTickets})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="p-8 text-center">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No requests raised yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              If you have inquiries regarding fees, exams, hostel, ID cards or documents, create your first ticket below.
            </p>
            <Link
              to="/tickets/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise Ticket</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Ticket ID</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Assigned Staff</th>
                  <th className="px-5 py-3">SLA Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900">
                      {t.id}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 line-clamp-1 max-w-xs"
                      >
                        {t.subject}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <CategoryBadge category={t.category} />
                    </td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {t.assignedStaffName || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3">
                      <SLABadge ticket={t} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        <span>Details</span>
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
    </div>
  );
};
