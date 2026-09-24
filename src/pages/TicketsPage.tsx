import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Inbox,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Ticket,
  User,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SLABadge } from '../components/SLABadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { calculateSLA } from '../utils/sla';

export const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters from query params or local state
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const categoryFilter = searchParams.get('category') || 'all';
  const assignedFilter = searchParams.get('assignedStaffId') || 'all';
  const viewFilter = searchParams.get('view') || '';

  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'priority' | 'sla'>('created_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Reset view if changing manual filters
    if (key !== 'view' && next.has('view')) {
      next.delete('view');
    }
    setCurrentPage(1);
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setCurrentPage(1);
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const [ticketsRes, usersRes] = await Promise.all([
        api.getTickets({
          search,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          assignedStaffId: assignedFilter !== 'all' ? assignedFilter : undefined,
          view: viewFilter || undefined,
        }),
        user?.role !== 'student' ? api.getUsers('staff') : Promise.resolve({ users: [] }),
      ]);
      setTickets(ticketsRes.tickets);
      if (usersRes.users) {
        setStaffList(usersRes.users);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [search, statusFilter, priorityFilter, categoryFilter, assignedFilter, viewFilter]);

  // Client-side sorting
  const sortedTickets = useMemo(() => {
    const list = [...tickets];
    const priorityWeight: Record<TicketPriority, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    list.sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'created_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority') {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'sla') {
        return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
      }
      return 0;
    });

    return list;
  }, [tickets, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / pageSize));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTickets.slice(start, start + pageSize);
  }, [sortedTickets, currentPage]);

  const hasActiveFilters = Boolean(
    search ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    assignedFilter !== 'all' ||
    viewFilter
  );

  return (
    <div className="space-y-4">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {user?.role === 'student' ? 'My Support Requests' : 'Ticket Management Console'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === 'student'
              ? 'Track, update, and manage your campus service requests with dynamic SLA guarantees.'
              : 'Triage, prioritize, reassign, and resolve institutional student tickets across campus departments.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadTickets}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <Link
            to="/tickets/new"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise Ticket</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Ticket ID, subject, student, or staff..."
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
          </div>

          {/* Quick preset views if staff/manager */}
          {user?.role !== 'student' && (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <button
                onClick={() => updateFilter('view', '')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  !viewFilter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {user?.role === 'staff' && (
                <button
                  onClick={() => updateFilter('view', 'my_tickets')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    viewFilter === 'my_tickets'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  My Assigned
                </button>
              )}
              <button
                onClick={() => updateFilter('view', 'unassigned')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  viewFilter === 'unassigned'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Unassigned
              </button>
              <button
                onClick={() => updateFilter('view', 'escalated')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  viewFilter === 'escalated'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Escalated
              </button>
              <button
                onClick={() => updateFilter('view', 'overdue')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  viewFilter === 'overdue'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                SLA Breached
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Statuses</option>
            {TICKET_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Priorities</option>
            {TICKET_PRIORITIES.map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 max-w-[150px] truncate"
          >
            <option value="all">All Categories</option>
            {TICKET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Staff Filter (for staff and manager) */}
          {user?.role !== 'student' && (
            <select
              value={assignedFilter}
              onChange={(e) => updateFilter('assignedStaffId', e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 max-w-[160px] truncate"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned Only</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="priority">Priority (Critical First)</option>
              <option value="sla">SLA Deadline (Urgent First)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-500" />
            <p className="text-xs">Loading support tickets...</p>
          </div>
        ) : sortedTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No matching tickets found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try broadening your search query or clearing active status and category filters.'
                : 'There are currently no tickets registered in this view.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            ) : user?.role === 'student' ? (
              <Link
                to="/tickets/new"
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Raise Ticket</span>
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Ticket ID</th>
                    <th className="px-4 py-3 min-w-[200px]">Subject</th>
                    {user?.role !== 'student' && <th className="px-4 py-3">Student</th>}
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned To</th>
                    <th className="px-4 py-3 min-w-[150px]">SLA</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedTickets.map((t) => {
                    const sla = calculateSLA(t);
                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-50/75 transition-colors ${
                          t.escalation ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* ID */}
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                          <Link
                            to={`/tickets/${t.id}`}
                            className="hover:text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <span>{t.id}</span>
                            {t.escalation && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-rose-500"
                                title="Escalated ticket"
                              />
                            )}
                          </Link>
                        </td>

                        {/* Subject */}
                        <td className="px-4 py-3">
                          <Link
                            to={`/tickets/${t.id}`}
                            className="font-medium text-slate-900 hover:text-indigo-600 line-clamp-1"
                          >
                            {t.subject}
                          </Link>
                          {t.escalation && (
                            <span className="text-[10px] text-rose-600 font-medium">
                              [Escalated]
                            </span>
                          )}
                        </td>

                        {/* Student (Hidden from Student view to protect privacy) */}
                        {user?.role !== 'student' && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-slate-900">{t.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {t.studentDepartment || t.studentEmail}
                            </div>
                          </td>
                        )}

                        {/* Category */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <CategoryBadge category={t.category} />
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <PriorityBadge priority={t.priority} />
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={t.status} />
                        </td>

                        {/* Assigned To */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {t.assignedStaffName ? (
                            <span className="text-slate-800 font-medium">{t.assignedStaffName}</span>
                          ) : (
                            <span className="text-amber-600 font-medium italic bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* SLA */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <SLABadge ticket={t} />
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px] tabular-nums">
                          {new Date(t.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Link
                            to={`/tickets/${t.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  {Math.min(sortedTickets.length, (currentPage - 1) * pageSize + 1)}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  {Math.min(sortedTickets.length, currentPage * pageSize)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  {sortedTickets.length}
                </span>{' '}
                tickets
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded text-xs font-medium ${
                        currentPage === page
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
