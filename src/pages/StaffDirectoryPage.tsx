import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, ShieldCheck, Mail, Phone, Building2, Ticket } from 'lucide-react';
import { api } from '../api/client';
import { User, DashboardMetrics } from '../types';

export const StaffDirectoryPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'staff' | 'students'>('staff');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [usersRes, statsRes] = await Promise.all([
          api.getUsers(),
          api.getDashboardStats(),
        ]);
        setUsers(usersRes.users);
        setMetrics(statsRes.metrics);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const staffMembers = users.filter((u) => u.role === 'staff' || u.role === 'manager');
  const students = users.filter((u) => u.role === 'student');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Institutional Users Directory</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          View registered students, assigned support officers, and operational workloads.
        </p>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'staff'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Support Staff & Managers ({staffMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'students'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Students ({students.length})</span>
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffMembers.map((st) => {
            const workload = metrics?.staffWorkload?.find((w) => w.staffId === st.id);
            return (
              <div
                key={st.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{st.name}</h3>
                      <span
                        className={`inline-block text-[10px] uppercase font-bold px-1.5 py-0.2 rounded mt-1 ${
                          st.role === 'manager'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {st.role}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {st.name.charAt(0)}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{st.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[11px] truncate">{st.email}</span>
                    </div>
                    {st.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-[11px]">{st.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {st.role === 'staff' && workload && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Active Load: </span>
                      <strong className="font-mono font-bold text-indigo-700">
                        {workload.activeCount}
                      </strong>
                    </div>
                    <Link
                      to={`/tickets?assignedStaffId=${st.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      View Tickets →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Students Grid */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((stu) => (
            <div
              key={stu.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{stu.name}</h3>
                    <span className="inline-block text-[11px] font-mono text-indigo-600 font-semibold mt-0.5">
                      {stu.studentId}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {stu.name.charAt(0)}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{stu.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-[11px] truncate">{stu.email}</span>
                  </div>
                  {stu.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[11px]">{stu.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <Link
                  to={`/tickets?search=${encodeURIComponent(stu.name)}`}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  View Student Tickets →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
