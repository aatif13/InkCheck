import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import {
  FileText,
  PlusCircle,
  BookOpen,
  History,
  Info,
  BarChart3,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  Layers,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const location = useLocation();

  interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }

  // 1. Role-specific navigation items
  let navItems: NavItem[] = [];

  if (role === 'creator') {
    navItems = [
      { to: '/dashboard', label: 'My Drafts', icon: <FileText className="w-4 h-4" /> },
      { to: '/submit', label: 'Submit & Check', icon: <PlusCircle className="w-4 h-4" /> },
      { to: '/library', label: 'Brand Library', badge: 'View-Only', icon: <BookOpen className="w-4 h-4" /> },
      { to: '/history/CNT-01', label: 'Revision Diffs', icon: <History className="w-4 h-4" /> },
      { to: '/about', label: 'About & Transparency', icon: <Info className="w-4 h-4" /> },
    ];
  } else if (role === 'manager') {
    navItems = [
      { to: '/dashboard', label: 'Executive Dashboard', icon: <Layers className="w-4 h-4" /> },
      { to: '/submit', label: 'Submit & Check', icon: <PlusCircle className="w-4 h-4" /> },
      { to: '/library', label: 'Brand Library', badge: 'Full Edit', icon: <BookOpen className="w-4 h-4" /> },
      { to: '/insights', label: 'Insights & Analytics', icon: <BarChart3 className="w-4 h-4" /> },
      { to: '/about', label: 'About & Transparency', icon: <Info className="w-4 h-4" /> },
    ];
  } else if (role === 'reviewer') {
    navItems = [
      { to: '/dashboard', label: 'Review Queue', icon: <CheckSquare className="w-4 h-4" /> },
      { to: '/approvals/CNT-01', label: 'Sign-off Desk', icon: <ShieldCheck className="w-4 h-4" /> },
      { to: '/library', label: 'Brand Library', badge: 'View-Only', icon: <BookOpen className="w-4 h-4" /> },
      { to: '/about', label: 'About & Transparency', icon: <Info className="w-4 h-4" /> },
    ];
  }

  const roleLabels: Record<Role, { title: string; subtitle: string; badgeColor: string }> = {
    creator: {
      title: 'Maya Lin',
      subtitle: 'Content Creator',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30'
    },
    manager: {
      title: 'Marcus Vance',
      subtitle: 'Brand Manager',
      badgeColor: 'bg-blue-400/20 text-blue-300 border-blue-400/30'
    },
    reviewer: {
      title: 'Elena Rostova',
      subtitle: 'Editorial Reviewer',
      badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
    }
  };

  const currentRoleMeta = roleLabels[role] || roleLabels.creator;

  return (
    <aside className="w-64 shrink-0 bg-[var(--ink-sidebar)] border-r border-[var(--ink-line)] text-white hidden md:flex flex-col justify-between sticky top-0 h-screen overflow-y-auto transition-colors duration-200">
      
      {/* Top Section */}
      <div className="p-5 space-y-6">
        
        {/* Brand Lockup */}
        <div className="space-y-1">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-heading font-bold text-2xl tracking-tight text-white group-hover:text-[var(--ink-amber)] transition-colors">
              InkCheck
            </span>
          </Link>
          <div className="text-[11px] text-slate-400 font-medium">
            Northwind Outdoors Governance
          </div>
        </div>

        {/* Current Role Identity Card */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${currentRoleMeta.badgeColor}`}>
              {role}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Active</span>
          </div>
          <div className="font-semibold text-xs text-white">
            {currentRoleMeta.title}
          </div>
          <div className="text-[11px] text-slate-400 leading-tight">
            {currentRoleMeta.subtitle}
          </div>
        </div>

        {/* Role-Specific Navigation Menu */}
        <nav className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
            {role === 'creator' ? 'Creator Workspace' : role === 'manager' ? 'Governance Suite' : 'Review Queue'}
          </div>

          {navItems.map(item => {
            const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--ink-amber)] text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-mono ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Switcher Strip */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
          Switch Persona
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          {(['creator', 'manager', 'reviewer'] as Role[]).map(r => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                role === r
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {r === 'creator' ? 'Creator' : r === 'manager' ? 'Manager' : 'Reviewer'}
            </button>
          ))}
        </div>
      </div>

    </aside>
  );
};
