import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus, Bell, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onToggleMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview Dashboard';
    if (path === '/tickets') {
      const search = new URLSearchParams(location.search);
      const view = search.get('view');
      if (view === 'my_tickets') return 'My Assigned Queue';
      if (view === 'unassigned') return 'Unassigned Queue';
      if (view === 'escalated') return 'Escalated Tickets';
      if (view === 'overdue') return 'SLA Breaches';
      return user.role === 'student' ? 'My Tickets' : 'Ticket Management';
    }
    if (path === '/tickets/new') return 'Raise Support Ticket';
    if (path.startsWith('/tickets/')) return 'Ticket Investigation & Resolution';
    if (path === '/staff') return 'Staff & Student Directory';
    if (path === '/docs') return 'Technical Documentation';
    return 'EduSupport Platform';
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Zone 1: Mobile toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">EduSupport</span>
          <span className="text-xs text-slate-300 hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Zone 2: Middle SLA & Environment Guarantee */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200 text-xs text-slate-600">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium">Active SLA Engine:</span>
        <span className="font-mono text-slate-500">Critical 4h · High 8h · Med 24h · Low 48h</span>
      </div>

      {/* Zone 3: Primary Actions & User Status */}
      <div className="flex items-center gap-3">
        {user.role === 'student' ? (
          <Link
            to="/tickets/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Ticket</span>
          </Link>
        ) : (
          <Link
            to="/tickets/new"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Ticket</span>
          </Link>
        )}

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-slate-900 leading-none truncate max-w-[120px]">
              {user.name}
            </div>
            <div className="text-[10px] text-slate-500 font-mono capitalize leading-tight mt-0.5">
              {user.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
