import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { ShieldCheck, ArrowRight, FileCheck, BookOpen, Scale, Eye, CheckCircle2, Award } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  const handleRoleSelect = async (role: Role) => {
    await switchRole(role);
    navigate('/dashboard');
  };

  const steps = [
    {
      num: '01',
      title: 'Brand Library',
      desc: 'Approved facts, 25+ terminology rules, tone standards and assets are kept in one single source of truth.'
    },
    {
      num: '02',
      title: 'Check',
      desc: 'Content enters. Deterministic rules layer always runs; LLM layer enriches with strict cite-or-discard verification.'
    },
    {
      num: '03',
      title: 'Decide',
      desc: 'Every issue cites its exact guideline or fact source. Creators accept, edit, or reject each proposed fix.'
    },
    {
      num: '04',
      title: 'Approve',
      desc: 'Reviewers inspect diffs, verify author rationale, and sign off. No silent overwrites or auto-publishing.'
    },
    {
      num: '05',
      title: 'Insights',
      desc: 'Analytics identify repeated mistakes, high-override rules, and unclear guidelines needing clarification.'
    }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-65px)] flex flex-col justify-between bg-[var(--ink-paper)] text-[var(--ink-slate)] transition-colors duration-200">
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--ink-line)] bg-[var(--ink-card)] text-xs font-medium text-[var(--ink-muted)] mb-6 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--ink-amber)]" />
          <span>Zero-Friction Hackathon Evaluation Mode</span>
          <span>·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Pre-Seeded & Ready to Test</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-[var(--ink-slate)] tracking-tight leading-[1.15] max-w-4xl mx-auto">
          The Proofreading Desk Between Content Creation and Brand Publication.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[var(--ink-muted)] max-w-2xl mx-auto leading-relaxed">
          Content goes in. It is checked against approved guidelines, terms, facts, and visual assets. Issues come back explained with sources cited. Humans decide every fix.
        </p>

        {/* Big Try Demo CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => handleRoleSelect('creator')}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-[#1D3557] hover:bg-[#152843] dark:bg-[#E8A13A] dark:text-neutral-900 dark:hover:bg-[#d69230] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <span>Try the Demo as Creator</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => handleRoleSelect('manager')}
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xl transition-colors"
          >
            Open Brand Manager View
          </button>
        </div>

        {/* Role Switcher Matrix */}
        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-left">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4 text-center">
            Or Choose a Seeded Persona (1-Click Instant Sign In)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <button
              onClick={() => handleRoleSelect('creator')}
              className="p-5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] hover:border-[#E8A13A] dark:hover:border-[#E8A13A] hover:shadow-md transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                    Creator Role
                  </span>
                  <span className="text-xs text-neutral-400">Maya Lin</span>
                </div>
                <div className="font-heading font-semibold text-neutral-900 dark:text-white text-base">
                  Draft & Review Desk
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Submit marketing copy, load sample content with problems, see color-coded inline highlights, and decide on suggested fixes.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-[#1D3557] dark:text-[#E8A13A] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Enter as Maya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('manager')}
              className="p-5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] hover:border-[#1D3557] dark:hover:border-[#E8A13A] hover:shadow-md transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                    Manager Role
                  </span>
                  <span className="text-xs text-neutral-400">Marcus Vance</span>
                </div>
                <div className="font-heading font-semibold text-neutral-900 dark:text-white text-base">
                  Brand Governance & Library
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Edit brand guidelines, mark facts outdated, manage approved terms, inspect audit logs, and review user feedback.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-[#1D3557] dark:text-[#E8A13A] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Enter as Marcus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('reviewer')}
              className="p-5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                    Reviewer Role
                  </span>
                  <span className="text-xs text-neutral-400">Elena Rostova</span>
                </div>
                <div className="font-heading font-semibold text-neutral-900 dark:text-white text-base">
                  Sign-off & Approval Queue
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Audit submissions, verify author decisions, add revision comments, request changes, and approve publication exports.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-[#1D3557] dark:text-[#E8A13A] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Enter as Elena</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

          </div>
        </div>
      </section>

      {/* How it Works Strip */}
      <section className="border-y border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-neutral-900 dark:text-white">
              The Exact Governance Lifecycle
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Deterministic rules layer + AI cite-or-discard guard + human sign-off
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((st, i) => (
              <div
                key={st.num}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/70 relative"
              >
                <div className="text-xs font-mono font-bold text-[#E8A13A] mb-1">
                  {st.num}
                </div>
                <div className="font-heading font-semibold text-neutral-900 dark:text-white text-sm mb-1.5">
                  {st.title}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Grounding Anchor */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
            <Scale className="w-6 h-6 mx-auto text-[#1D3557] dark:text-[#E8A13A] mb-2" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">100% Explainable & Grounded</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Every finding explicitly cites a real Guideline ID, Fact ID, or Terminology record. Hallucinated findings are automatically discarded.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Zero-Key Deterministic Guarantee</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Works completely offline with our built-in regex, terminology parser, WCAG contrast engine, and Flesch-Kincaid readability scoring.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
            <Eye className="w-6 h-6 mx-auto text-[#2F80A8] mb-2" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Human-in-the-Loop Control</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Suggested fixes are proposals. Authors accept, edit, or reject each item. Nothing publishes without human review.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
