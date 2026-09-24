import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  History,
  Send,
  ShieldAlert,
  Flame,
  User as UserIcon,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import {
  Ticket,
  User,
  TicketStatus,
  TicketPriority,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SLABadge } from '../components/SLABadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { calculateSLA, calculateAgeing } from '../utils/sla';

export const TicketDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab for discussion: 'comments' vs 'notes'
  const [activeTab, setActiveTab] = useState<'comments' | 'notes'>('comments');

  // Comment & Note inputs
  const [commentText, setCommentText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  // Modals / Action States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>('Medium');

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const loadTicketData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ticketRes, usersRes] = await Promise.all([
        api.getTicket(id),
        user?.role !== 'student' ? api.getUsers('staff') : Promise.resolve({ users: [] }),
      ]);
      setTicket(ticketRes.ticket);
      if (usersRes.users) {
        setStaffList(usersRes.users);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load ticket details');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  if (loading || !ticket) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl" />
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const sla = calculateSLA(ticket);
  const ageing = calculateAgeing(ticket.createdAt);

  // Comment submit
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment(ticket.id, commentText);
      setTicket(res.ticket);
      setCommentText('');
      success('Public response added to discussion');
    } catch (err: any) {
      error(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Internal Note submit (Staff & Manager only)
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await api.addInternalNote(ticket.id, noteText);
      setTicket(res.ticket);
      setNoteText('');
      success('Confidential internal note saved');
    } catch (err: any) {
      error(err.message || 'Failed to save note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Assign staff
  const handleAssign = async () => {
    if (!selectedStaffId) return;
    try {
      const res = await api.assignTicket(ticket.id, selectedStaffId);
      setTicket(res.ticket);
      setShowAssignModal(false);
      success('Staff assignment updated');
    } catch (err: any) {
      error(err.message || 'Assignment failed');
    }
  };

  // Claim ticket (assign to self)
  const handleClaim = async () => {
    if (!user) return;
    try {
      const res = await api.assignTicket(ticket.id, user.id);
      setTicket(res.ticket);
      success('You claimed ownership of this ticket');
    } catch (err: any) {
      error(err.message || 'Claim failed');
    }
  };

  // Status Change
  const handleStatusChange = async () => {
    if (selectedStatus === 'Resolved' && !resolutionNotes.trim()) {
      error('Resolution notes are required when resolving a ticket.');
      return;
    }
    try {
      const res = await api.updateStatus(ticket.id, selectedStatus, resolutionNotes);
      setTicket(res.ticket);
      setShowStatusModal(false);
      setResolutionNotes('');
      success(`Status transitioned to ${selectedStatus}`);
    } catch (err: any) {
      error(err.message || 'Status transition failed');
    }
  };

  // Priority Change
  const handlePriorityChange = async () => {
    try {
      const res = await api.updatePriority(ticket.id, selectedPriority);
      setTicket(res.ticket);
      setShowPriorityModal(false);
      success(`Priority changed to ${selectedPriority}. SLA deadline updated.`);
    } catch (err: any) {
      error(err.message || 'Priority update failed');
    }
  };

  // Escalate
  const handleEscalate = async () => {
    if (!escalationReason.trim()) {
      error('Please provide a specific justification for escalation.');
      return;
    }
    try {
      const res = await api.escalateTicket(ticket.id, escalationReason);
      setTicket(res.ticket);
      setShowEscalateModal(false);
      setEscationReason('');
      success('Ticket escalated to Management & Proctorial queue');
    } catch (err: any) {
      error(err.message || 'Escalation failed');
    }
  };

  // Student Reopen
  const handleStudentReopen = async () => {
    try {
      const res = await api.updateStatus(ticket.id, 'Reopened');
      if (reopenReason.trim()) {
        await api.addComment(ticket.id, `Ticket reopened: ${reopenReason.trim()}`);
      }
      const updated = await api.getTicket(ticket.id);
      setTicket(updated.ticket);
      setShowReopenModal(false);
      setReopenReason('');
      success('Ticket reopened and returned to active staff investigation queue');
    } catch (err: any) {
      error(err.message || 'Reopening failed');
    }
  };

  function setEscationReason(val: string) {
    setEscalationReason(val);
  }

  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';
  const canManage = user?.role === 'staff' || user?.role === 'manager';
  const canReopen = user?.role === 'student' && ticket.status === 'Resolved';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Navigation and Back */}
      <div className="flex items-center justify-between">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tickets</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Ageing:</span>
          <span className="text-xs font-semibold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {ageing.text} old
          </span>
        </div>
      </div>

      {/* Escalation Alert Banner if ticket is escalated */}
      {ticket.escalation && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <Flame className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-rose-900">
            <div className="font-bold flex items-center gap-2">
              <span>ESCALATED CASE</span>
              <span className="text-[10px] font-mono text-rose-700 font-normal">
                {new Date(ticket.escalation.escalatedAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 font-medium">{ticket.escalation.reason}</p>
            <div className="mt-1.5 text-[11px] text-rose-700">
              Escalated by: <strong>{ticket.escalation.escalatedByName}</strong> ({ticket.escalation.escalatedByRole})
              {ticket.escalation.currentOwnerName && (
                <span> · Assigned Owner: {ticket.escalation.currentOwnerName}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                {ticket.id}
              </span>
              <CategoryBadge category={ticket.category} />
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              <SLABadge ticket={ticket} />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {ticket.subject}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
              <div>
                Raised by: <strong className="text-slate-800">{ticket.studentName}</strong>
                {ticket.studentDepartment && <span> ({ticket.studentDepartment})</span>}
              </div>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <div>
                Created: <span className="font-mono">{new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <div>
                Assigned to:{' '}
                {ticket.assignedStaffName ? (
                  <strong className="text-slate-800">{ticket.assignedStaffName}</strong>
                ) : (
                  <span className="text-amber-600 font-semibold italic">Unassigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0">
            {canManage && (
              <>
                {!ticket.assignedStaffId && (
                  <button
                    onClick={handleClaim}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                  >
                    Claim Ticket
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedStaffId(ticket.assignedStaffId || '');
                    setShowAssignModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {ticket.assignedStaffId ? 'Reassign' : 'Assign Staff'}
                </button>

                <button
                  onClick={() => {
                    setSelectedPriority(ticket.priority);
                    setShowPriorityModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Priority
                </button>

                <button
                  onClick={() => {
                    setSelectedStatus(ticket.status);
                    setShowStatusModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  Update Status
                </button>

                {!ticket.escalation && (
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    Escalate
                  </button>
                )}
              </>
            )}

            {canReopen && (
              <button
                onClick={() => setShowReopenModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Ticket</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Discussion (Left 2 cols) vs Ticket Meta & Timeline (Right col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description + Resolution Notes + Discussion Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Ticket Description & Particulars
            </h3>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-100">
              {ticket.description}
            </div>

            {/* Resolution Banner if resolved */}
            {ticket.resolutionNotes && (
              <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Official Resolution Notes</span>
                  {ticket.resolvedAt && (
                    <span className="font-mono text-[10px] text-emerald-700 font-normal">
                      · {new Date(ticket.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  {ticket.resolutionNotes}
                </p>
              </div>
            )}
          </div>

          {/* Discussion Tabs: Public Conversation vs Internal Notes */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {/* Tab Header */}
            <div className="border-b border-slate-200 px-5 pt-3 flex items-center gap-6">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Public Discussion ({ticket.comments.length})</span>
              </button>

              {/* Internal Notes tab only visible to staff & manager */}
              {canManage && (
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'notes'
                      ? 'border-amber-600 text-amber-800'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span className="flex items-center gap-1.5">
                    <span>Internal Notes ({ticket.internalNotes?.length || 0})</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">
                      Confidential
                    </span>
                  </span>
                </button>
              )}
            </div>

            {/* Tab 1: Public Comments */}
            {activeTab === 'comments' && (
              <div className="p-5 space-y-5">
                {ticket.comments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No comments posted yet. Use the message box below to ask questions or provide updates.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ticket.comments.map((comm) => (
                      <div
                        key={comm.id}
                        className={`p-3.5 rounded-lg border text-xs ${
                          comm.userRole === 'student'
                            ? 'bg-slate-50/70 border-slate-200'
                            : 'bg-indigo-50/40 border-indigo-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{comm.userName}</span>
                            <span
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                comm.userRole === 'student'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {comm.userRole}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                            {new Date(comm.createdAt).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {comm.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Box */}
                <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 space-y-2">
                  <textarea
                    rows={3}
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type a public response or update visible to both student and staff..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">
                      Public message · Notification will be dispatched
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingComment ? 'Sending...' : 'Post Reply'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Internal Notes (Staff & Manager only) */}
            {activeTab === 'notes' && canManage && (
              <div className="p-5 space-y-5 bg-amber-50/20">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Confidential Staff Notes: </span>
                    Internal notes are strictly restricted to staff and managers. Students can never view these entries in UI or API responses.
                  </div>
                </div>

                {(!ticket.internalNotes || ticket.internalNotes.length === 0) ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No internal notes documented yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ticket.internalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{note.userName}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900">
                              {note.userRole}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                            {new Date(note.createdAt).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Internal Note */}
                <form onSubmit={handleAddNote} className="pt-3 border-t border-slate-200 space-y-2">
                  <textarea
                    rows={3}
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Document internal investigation details, system lookups, or staff handover notes..."
                    className="w-full p-3 text-xs bg-white border border-amber-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-amber-700 font-medium">
                      🔒 Confidential to staff only
                    </span>
                    <button
                      type="submit"
                      disabled={submittingNote || !noteText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{submittingNote ? 'Saving...' : 'Save Internal Note'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Metadata Specs & Activity Timeline */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ticket Metadata & SLA Info
            </h3>

            <div className="space-y-2 divide-y divide-slate-100">
              <div className="flex justify-between items-center pt-2 first:pt-0">
                <span className="text-slate-500">Student Name</span>
                <span className="font-semibold text-slate-900">{ticket.studentName}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Department</span>
                <span className="text-slate-800">{ticket.studentDepartment || 'General'}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-800">{ticket.category}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Priority Level</span>
                <PriorityBadge priority={ticket.priority} />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Current Status</span>
                <StatusBadge status={ticket.status} />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">SLA Guarantee</span>
                <span className="font-mono font-semibold text-indigo-700">
                  {ticket.slaHours} Hours
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">SLA Deadline</span>
                <span className="font-mono text-slate-700 tabular-nums">
                  {new Date(ticket.slaDeadline).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">SLA Compliance</span>
                <SLABadge ticket={ticket} />
              </div>
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Audit & Activity Timeline
              </h3>
            </div>

            <div className="relative border-l border-slate-200 ml-2.5 space-y-4 text-xs">
              {ticket.activities.map((act) => (
                <div key={act.id} className="relative pl-5">
                  {/* Dot */}
                  <div
                    className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                      act.type === 'resolved'
                        ? 'bg-emerald-500'
                        : act.type === 'escalated'
                        ? 'bg-rose-500'
                        : act.type === 'reopened'
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                  />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{act.actorName}</span>
                      <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{act.details}</p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      {new Date(act.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Assign Ticket to Support Staff
            </h3>
            <p className="text-xs text-slate-500">
              Select an agent from the support desk to take ownership of #{ticket.id}.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support Staff Member
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">Select staff agent...</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.department || 'Support Desk'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedStaffId}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Transition Ticket Status
            </h3>
            <p className="text-xs text-slate-500">
              Update the workflow lifecycle state. If marking as Resolved, detailed resolution notes are required.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {TICKET_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {selectedStatus === 'Resolved' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain how the ticket was resolved, steps taken, or pickup instructions for the student..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Update Ticket Priority
            </h3>
            <p className="text-xs text-slate-500">
              Modifying priority immediately recalculates the SLA deadline countdown.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Tier
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as TicketPriority)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {TICKET_PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPriorityModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePriorityChange}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Apply Priority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-rose-900">
                Escalate Ticket to Management
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Escalation places this ticket on the Director & Manager high-priority dashboard. Please record a valid justification.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Escalation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Detail why standard resolution procedures cannot address this issue..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-rose-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={!escalationReason.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Reopen Resolved Request
            </h3>
            <p className="text-xs text-slate-500">
              If your request was not resolved satisfactorily or if issues persist, you may reopen this ticket.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Reopening
              </label>
              <textarea
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Describe why the solution did not resolve the problem..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleStudentReopen}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Reopen Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
