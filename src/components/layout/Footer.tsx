import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, ExternalLink, Lock } from 'lucide-react';
import { FeedbackModal } from '../common/FeedbackModal';

export const Footer: React.FC = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <footer className="w-full border-t border-[var(--ink-line)] bg-[var(--ink-card)] py-8 px-6 text-xs text-[var(--ink-muted)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Left: Brand & Problem brief */}
        <div className="space-y-1.5 max-w-md">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              InkCheck
            </span>
            <span>·</span>
            <span>Brand Governance & Human-in-the-Loop Proofreading</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Built by Team <strong className="text-neutral-700 dark:text-neutral-200">aatifmulla1113</strong> for the challenge set by <strong className="text-neutral-700 dark:text-neutral-200">Inkloom AI</strong>.
          </p>
        </div>

        {/* Center: Privacy & Disclosure */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Confidential library data never leaves server except retrieved snippets to configured LLM</span>
          </div>
          <span className="hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E8A13A]" />
            <span>Zero auto-publish · Human decisions only</span>
          </div>
        </div>

        {/* Right: Feedback & Links */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#E8A13A]" />
            <span>Give Feedback</span>
          </button>

          <Link
            to="/about"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Transparency & Model Disclosure
          </Link>
        </div>
      </div>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </footer>
  );
};
