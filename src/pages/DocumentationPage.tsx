import React from 'react';
import { BookOpen, ShieldCheck, Clock, CheckCircle2, User, Key, Server, Laptop } from 'lucide-react';
import { SLA_HOURS_MAP } from '../types';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              EduSupport — Technical & Architectural Documentation
            </h1>
            <p className="text-xs text-slate-500">
              Edumerge Solutions Pre-Drive Product Engineering Assignment (Option 4: Student Support & Ticket Management)
            </p>
          </div>
        </div>
      </div>

      {/* Demo Credentials Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Demo Credentials & Evaluator Quick Access
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The system comes pre-seeded with 16 realistic university accounts (10 students, 5 support staff, 1 manager) and 32 initial tickets covering all SLA states, categories, and workflow transitions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Student */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Student Account</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Student
              </span>
            </div>
            <div className="font-mono text-slate-700 font-medium">student@edusupport.demo</div>
            <div className="text-[11px] text-slate-500">Password: <code className="font-mono font-semibold text-slate-800">Password123!</code></div>
            <p className="text-[11px] text-slate-500 pt-1">
              Aarav Sharma (B.Tech CSE). Can only see own tickets; no internal notes visible.
            </p>
          </div>

          {/* Staff */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Support Staff</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                Staff
              </span>
            </div>
            <div className="font-mono text-slate-700 font-medium">staff@edusupport.demo</div>
            <div className="text-[11px] text-slate-500">Password: <code className="font-mono font-semibold text-slate-800">Password123!</code></div>
            <p className="text-[11px] text-slate-500 pt-1">
              Priya Iyer (Registrar Desk). Can claim, assign, add confidential internal notes, resolve, and escalate.
            </p>
          </div>

          {/* Manager */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Executive Manager</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                Manager
              </span>
            </div>
            <div className="font-mono text-slate-700 font-medium">manager@edusupport.demo</div>
            <div className="text-[11px] text-slate-500">Password: <code className="font-mono font-semibold text-slate-800">Password123!</code></div>
            <p className="text-[11px] text-slate-500 pt-1">
              Dr. Vikram Malhotra (Student Experience Director). Full visibility, staff workload, SLA analytics, and escalated queue.
            </p>
          </div>
        </div>
      </div>

      {/* SLA Policy & Assumptions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Product Assumptions & SLA Guarantee Matrix
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The platform dynamically calculates SLA deadlines and breach durations based on ticket creation timestamp, priority tier, and resolution state. SLA calculations are dynamic, non-hardcoded, and recalculate in real-time.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-red-200 bg-red-50/40 text-center">
            <div className="text-xs font-bold text-red-900">Critical</div>
            <div className="text-2xl font-bold font-mono text-red-700 mt-1">4 Hours</div>
            <p className="text-[11px] text-red-600 mt-1">Fee deduction bugs, emergency hostel safety, campus system lockouts</p>
          </div>
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 text-center">
            <div className="text-xs font-bold text-amber-900">High</div>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">8 Hours</div>
            <p className="text-[11px] text-amber-600 mt-1">Exam clashes, attendance shortage corrections, hall ticket blocks</p>
          </div>
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/40 text-center">
            <div className="text-xs font-bold text-blue-900">Medium</div>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1">24 Hours</div>
            <p className="text-[11px] text-blue-600 mt-1">ID card replacements, scholarship reconciliations, bonafide certificates</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <div className="text-xs font-bold text-slate-900">Low</div>
            <div className="text-2xl font-bold font-mono text-slate-700 mt-1">48 Hours</div>
            <p className="text-[11px] text-slate-600 mt-1">Duplicate grade cards, spelling corrections, general campus inquiries</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
          <div className="font-semibold text-slate-900">Dynamic SLA State Logic:</div>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li><strong className="text-emerald-700">🟢 On Track:</strong> Remaining SLA window &gt; 2 hours and &gt; 25% of total allocated duration.</li>
            <li><strong className="text-amber-700">🟡 Due Soon:</strong> Remaining window &le; 2 hours or &le; 25% of total time window.</li>
            <li><strong className="text-red-700">🔴 Overdue:</strong> Current time exceeds SLA deadline and ticket is not yet resolved. Displays elapsed overdue duration.</li>
            <li><strong className="text-emerald-700">✓ Resolved:</strong> Ticket resolved within SLA target (or flagged if resolved late).</li>
          </ul>
        </div>
      </div>

      {/* Ticket Lifecycle Workflow */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Ticket Lifecycle & State Machine
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every state transition is audited and recorded into the persistent Activity Timeline:
        </p>

        <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
          <code>
            [New] → [Assigned] → [In Progress] → [Pending Student / Pending Internal] → [Resolved] → [Closed]
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ [Reopened by Student] ──↗
          </code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <strong className="text-slate-900">Resolution Verification:</strong> When staff or managers mark a ticket as Resolved, the system enforces mandatory entry of resolution notes explaining the corrective action.
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <strong className="text-slate-900">Reopen Guarantee:</strong> If an issue was not fixed adequately, students have explicit access to reopen resolved tickets with reasons, pushing the ticket back into active triage.
          </div>
        </div>
      </div>

      {/* Security & Access Isolation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Multi-Tenant Role-Based Security Isolation
          </h2>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <strong className="text-slate-900">1. Student Isolation at API Level:</strong> When a student queries <code className="font-mono text-indigo-600">/api/tickets</code>, the backend intercepts the session token and strictly filters records so only tickets matching the student’s unique user ID are returned. Accessing another student's ticket ID returns a strict 403 Forbidden.
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <strong className="text-slate-900">2. Confidential Internal Notes:</strong> Support staff notes (<code className="font-mono text-indigo-600">internalNotes</code>) are stripped on the server before serialization for student requests. Students cannot query or post internal notes.
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <strong className="text-slate-900">3. Operational Audit Trail:</strong> Every action (creation, priority adjustments, reassignment, resolution, reopening, escalation) records actor ID, actor name, actor role, and precise ISO timestamps.
          </div>
        </div>
      </div>
    </div>
  );
};
