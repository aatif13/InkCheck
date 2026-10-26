import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Users,
  CheckCircle2,
  FileCheck,
  Award,
  Layers,
  Database
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'Mulla Mohammed Aatif',
      role: 'Lead Architect & AI Systems',
      contrib: 'Designed the hybrid detection engine, offline TF-IDF retriever, strict cite-or-discard guard, and JWT demo auth architecture.'
    },
    {
      name: 'Saheem Khan',
      role: 'Rules Engine & Accessibility Engineer',
      contrib: 'Implemented deterministic rules (25+ terminology patterns, outdated facts regex), WCAG 2.1 contrast ratio math, and Flesch-Kincaid scoring.'
    },
    {
      name: 'Khan Afzal',
      role: 'Frontend & Proofreading Desk Designer',
      contrib: 'Crafted the editorial two-pane review layout, inline color-coded highlight engine, synchronized finding cards, and diff proposal controls.'
    },
    {
      name: 'Pachapuri Mustaqeem',
      role: 'Database & Governance Workflows',
      contrib: 'Structured the relational SQLite database schemas, seed datasets for Northwind Outdoors, revision diff histories, and approvals workflow.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Transparency & System Architecture
        </div>
        <h1 className="text-3xl font-bold font-heading text-neutral-900 dark:text-white">
          About InkCheck & External Services Disclosure
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          InkCheck is an explainable brand-governance platform sitting between content creation and publication.
          This page transparently documents our external AI integrations, privacy boundaries, role access matrix, and hackathon team contributions.
        </p>
      </div>

      {/* AI & Services Disclosure */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A2332] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#E8A13A]" />
          <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
            AI Model & Data Processing Disclosure
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Configured Model</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              When an API key is provided via <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">GEMINI_API_KEY</code> or <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">LLM_API_KEY</code>, InkCheck enriches analysis using <strong>gemini-3.8-flash</strong> via the modern <code className="font-mono text-[11px]">@google/genai</code> SDK.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Zero-Leak Privacy Protocol</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Confidential Brand Library content is never sent to external servers in bulk. Only top-k retrieved snippets relevant to the submitted draft are passed into the prompt context for citation grounding.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E8A13A]" />
              <span>Deterministic Cite-or-Discard Guard</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Every finding must cite an authentic library record ID (e.g. GD-04, FACT-05, TRM-01). Any hallucinated finding or text excerpt not found verbatim in the user's draft is discarded before reaching the UI.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Offline Zero-Key Fallback</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              If no API key is provided, InkCheck runs in deterministic rules-only mode. All terminology, claims, accessibility, and outdated fact checks run with zero external network dependencies.
            </p>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A2332] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1D3557] dark:text-[#E8A13A]" />
          <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
            Role-Based Access Control (RBAC) Matrix
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Capability / Action</th>
                <th className="py-2.5 px-4">Creator (Maya Lin)</th>
                <th className="py-2.5 px-4">Brand Manager (Marcus Vance)</th>
                <th className="py-2.5 px-4">Reviewer (Elena Rostova)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr>
                <td className="py-3 px-4 font-medium">Create Content & Run InkCheck</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-neutral-400">Read-Only</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Accept / Edit / Reject Fix Proposals</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-neutral-400">Read-Only</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Submit Draft for Review</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-neutral-400">N/A</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Sign-off (Approve / Request Changes)</td>
                <td className="py-3 px-4 text-neutral-400">Forbidden</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Brand Library CRUD & Document Import</td>
                <td className="py-3 px-4 text-neutral-400">Read-Only</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-neutral-400">Read-Only</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Review Audit Trail & User Testing Feedback</td>
                <td className="py-3 px-4 text-neutral-400">Read-Only</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Allowed</td>
                <td className="py-3 px-4 text-neutral-400">Read-Only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Contributions Section */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A2332] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#E8A13A]" />
            <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
              Hackathon Team & Engineering Contributions
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">Team: aatifmulla1113</span>
        </div>

        <p className="text-xs text-neutral-500">
          InkCheck was engineered as a single deployable web application solving the brand governance challenge formulated by <strong>Inkloom AI</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {teamMembers.map((m, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-neutral-900 dark:text-white">{m.name}</div>
                <div className="text-[11px] font-semibold text-[#1D3557] dark:text-[#E8A13A]">{m.role}</div>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {m.contrib}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
