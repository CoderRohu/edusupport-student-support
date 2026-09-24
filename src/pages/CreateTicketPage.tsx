import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import {
  TicketCategory,
  TicketPriority,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  SLA_HOURS_MAP,
} from '../types';

export const CreateTicketPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [category, setCategory] = useState<TicketCategory>('Technical Support');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!subject.trim()) {
      errors.subject = 'Subject line is required.';
    } else if (subject.trim().length < 5) {
      errors.subject = 'Subject should be at least 5 characters long.';
    }

    if (!description.trim()) {
      errors.description = 'Please provide details describing your inquiry or problem.';
    } else if (description.trim().length < 15) {
      errors.description = 'Description should be at least 15 characters to facilitate prompt triage.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createTicket({
        category,
        subject,
        description,
        priority,
      });

      success(`Ticket #${res.ticket.id} raised successfully! SLA guarantee: ${res.ticket.slaHours} hours.`);
      navigate(`/tickets/${res.ticket.id}`);
    } catch (err: any) {
      error(err.message || 'Failed to submit ticket');
      setIsSubmitting(false);
    }
  };

  const currentSlaHours = SLA_HOURS_MAP[priority];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tickets</span>
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Raise Support Ticket</h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit an academic, financial, administrative, or infrastructural request. Our support team operates under strict SLA turnaround standards.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ticket Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TICKET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all ${
                    category === cat
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subject Line <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (formErrors.subject) setFormErrors({ ...formErrors, subject: '' });
              }}
              placeholder="e.g. Duplicate debit for semester tuition fee via UPI gateway"
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all ${
                formErrors.subject ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {formErrors.subject && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.subject}</p>
            )}
          </div>

          {/* Priority Selection with Dynamic SLA Callout */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Severity & Urgency Priority <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>SLA Target: <strong className="text-indigo-700 font-mono">{currentSlaHours} hours</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TICKET_PRIORITIES.map((p) => {
                const hours = SLA_HOURS_MAP[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      priority === p
                        ? p === 'Critical'
                          ? 'border-red-500 bg-red-50/50 text-red-900 ring-1 ring-red-500'
                          : p === 'High'
                          ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500'
                          : p === 'Medium'
                          ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500'
                          : 'border-slate-500 bg-slate-50 text-slate-900 ring-1 ring-slate-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">{p}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {hours} hr SLA
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SLA Description Banner */}
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Product SLA Guarantee: </span>
                {priority === 'Critical' && 'Critical issues (e.g. fee debit failures, safety hazards, exam lockouts) are handled within 4 hours.'}
                {priority === 'High' && 'High priority requests (e.g. exam clashes, attendance shortage, hall ticket lockouts) are addressed within 8 hours.'}
                {priority === 'Medium' && 'Standard issues (e.g. ID card replacement, transcripts, scholarship reconciliation) are processed within 24 hours.'}
                {priority === 'Low' && 'Routine inquiries and certificate re-issuances are completed within 48 hours.'}
              </div>
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Description & Evidence <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
              }}
              placeholder="Please provide full details, reference transaction numbers, course codes, dates, and any relevant steps..."
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all ${
                formErrors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {formErrors.description && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.description}</p>
            )}
          </div>

          {/* Submitter Details Info */}
          <div className="p-3 rounded-lg bg-indigo-50/40 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>
                Submitting as <strong>{user?.name}</strong> ({user?.email})
              </span>
            </div>
            <span className="font-mono text-[11px] text-indigo-700 font-semibold">
              {user?.role === 'student' ? user?.studentId : user?.department}
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Link
              to="/tickets"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Raising Ticket...' : 'Submit Support Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
