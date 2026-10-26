import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { Role, SystemHealth } from '../../types';
import { Sun, Moon, Cpu, CheckCircle2, ChevronDown, UserCheck, Menu, X, Shield, BookOpen, Layers } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, switchRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(err => console.warn('Health check query failed:', err));
  }, []);

  const roles: Array<{ key: Role; label: string; desc: string; user: string }> = [
    { key: 'creator', label: 'Creator', desc: 'Drafts, checks & resolves fixes', user: 'Maya Lin' },
    { key: 'manager', label: 'Brand Manager', desc: 'Library governance & insights', user: 'Marcus Vance' },
    { key: 'reviewer', label: 'Reviewer', desc: 'Sign-off, review & approvals', user: 'Elena Rostova' }
  ];

  const currentRoleInfo = roles.find(r => r.key === role) || roles[0];

  // Role-gated nav items for mobile drawer
  const getNavLinks = () => {
    if (role === 'creator') {
      return [
        { to: '/dashboard', label: 'My Drafts' },
        { to: '/submit', label: 'Submit & Check' },
        { to: '/library', label: 'Brand Library' },
        { to: '/history/CNT-01', label: 'Revision Diffs' },
        { to: '/about', label: 'About & Transparency' }
      ];
    }
    if (role === 'manager') {
      return [
        { to: '/dashboard', label: 'Executive Dashboard' },
        { to: '/submit', label: 'Submit & Check' },
        { to: '/library', label: 'Brand Library (Edit)' },
        { to: '/insights', label: 'Insights & Analytics' },
        { to: '/about', label: 'About & Transparency' }
      ];
    }
    // Reviewer
    return [
      { to: '/dashboard', label: 'Review Queue' },
      { to: '/approvals/CNT-01', label: 'Sign-off Desk' },
      { to: '/library', label: 'Brand Library' },
      { to: '/about', label: 'About & Transparency' }
    ];
  };

  const navLinks = getNavLinks();

  // Contextual breadcrumb title based on route and role
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      if (role === 'creator') return 'Creator Workspace · My Drafts';
      if (role === 'manager') return 'Governance Center · Executive Overview';
      return 'Editorial Desk · Review Queue';
    }
    if (path.startsWith('/submit')) return 'Content Submission & Analysis';
    if (path.startsWith('/review')) return 'Dual-Pane Proofreading Desk';
    if (path.startsWith('/library')) return `Brand Knowledge Library ${role === 'manager' ? '(Full Governance)' : '(Read-Only)'}`;
    if (path.startsWith('/approvals')) return 'Review Sign-Off & Official Certification';
    if (path.startsWith('/history')) return 'Revision Timeline & Side-by-Side Diffs';
    if (path.startsWith('/insights')) return 'Insights & Friction Analytics';
    if (path.startsWith('/about')) return 'Transparency & Model Disclosure';
    return 'Brand Governance';
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--ink-line)] bg-[var(--ink-card)] text-[var(--ink-slate)] backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        
        {/* Left: Mobile Toggle & Context Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-[var(--ink-line)] text-[var(--ink-slate)] hover:bg-[var(--ink-mist)]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-[var(--ink-amber)]" />
            <span className="text-xs sm:text-sm font-semibold text-[var(--ink-slate)] whitespace-nowrap">
              {getBreadcrumbTitle()}
            </span>
          </div>
        </div>

        {/* Right Zone: AI Status, Role Switcher, Dark Mode */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          
          {/* AI Status Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              health?.aiLayerActive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-[var(--ink-mist)] text-[var(--ink-muted)] border-[var(--ink-line)]'
            }`}
            title={health?.aiLayerActive ? 'Gemini 3.8 Flash AI layer active' : 'Deterministic rules layer active'}
          >
            <Cpu className="w-3.5 h-3.5 text-[var(--ink-amber)]" />
            <span className="whitespace-nowrap font-mono text-[11px]">
              {health?.aiLayerActive ? 'AI Layer: On (Gemini)' : 'AI: Off (Rules-Only)'}
            </span>
          </div>

          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] text-[var(--ink-slate)] hover:border-[var(--ink-amber)] transition-colors whitespace-nowrap shadow-xs"
              aria-label="Switch active role"
            >
              <UserCheck className="w-3.5 h-3.5 text-[var(--ink-amber)]" />
              <div className="flex flex-col text-left">
                <span className="leading-tight capitalize">{currentRoleInfo.label}</span>
                <span className="text-[10px] text-[var(--ink-muted)] leading-none">{currentRoleInfo.user}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-[var(--ink-muted)] ml-0.5" />
            </button>

            {roleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-2xl py-2 z-50 animate-in fade-in-50 duration-150"
                onMouseLeave={() => setRoleMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider border-b border-[var(--ink-line)]">
                  Switch Active Role (Instant Auth & Scoped View)
                </div>
                {roles.map(r => (
                  <button
                    key={r.key}
                    onClick={async () => {
                      await switchRole(r.key);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-start gap-2.5 ${
                      role === r.key
                        ? 'bg-[var(--ink-amber)]/10 text-[var(--ink-slate)] font-bold'
                        : 'text-[var(--ink-slate)] hover:bg-[var(--ink-mist)]'
                    }`}
                  >
                    <div className="mt-0.5">
                      {role === r.key ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--ink-amber)]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[var(--ink-line)]" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--ink-slate)]">
                        {r.label} <span className="font-normal text-[var(--ink-muted)]">({r.user})</span>
                      </div>
                      <div className="text-[11px] text-[var(--ink-muted)] leading-snug">
                        {r.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button (Toggles .dark on <html> & persists) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] text-[var(--ink-slate)] hover:border-[var(--ink-amber)] transition-colors"
            aria-label="Toggle color theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-[var(--ink-amber)]" /> : <Moon className="w-4 h-4 text-[var(--ink-navy)]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--ink-line)] bg-[var(--ink-card)] p-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] px-2">
            Navigation ({role})
          </div>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-semibold text-[var(--ink-slate)] hover:bg-[var(--ink-mist)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
