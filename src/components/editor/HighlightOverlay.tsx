import React from 'react';
import { Finding } from '../../types';

interface HighlightOverlayProps {
  text: string;
  findings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
}

interface Segment {
  text: string;
  start: number;
  end: number;
  finding?: Finding;
}

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  text,
  findings,
  selectedFindingId,
  onSelectFinding
}) => {
  // Break text into non-overlapping segments with associated findings
  const segments: Segment[] = [];
  
  // Sort findings by span_start
  const validFindings = findings
    .filter(f => f.span_start >= 0 && f.span_end <= text.length && f.span_end > f.span_start)
    .sort((a, b) => a.span_start - b.span_start);

  let cursor = 0;

  for (const finding of validFindings) {
    if (finding.span_start > cursor) {
      segments.push({
        text: text.substring(cursor, finding.span_start),
        start: cursor,
        end: finding.span_start
      });
    }

    // Guard against overlaps
    const start = Math.max(cursor, finding.span_start);
    const end = Math.max(start, finding.span_end);

    if (end > start) {
      segments.push({
        text: text.substring(start, end),
        start,
        end,
        finding
      });
      cursor = end;
    }
  }

  if (cursor < text.length) {
    segments.push({
      text: text.substring(cursor),
      start: cursor,
      end: text.length
    });
  }

  const getHighlightStyle = (finding: Finding, isSelected: boolean) => {
    // If decision already made
    if (finding.decision === 'accepted') {
      return 'bg-emerald-500/15 border-b-2 border-emerald-600 text-emerald-950 dark:text-emerald-200';
    }
    if (finding.decision === 'rejected') {
      return 'bg-neutral-200/50 dark:bg-neutral-700/40 line-through opacity-60 border-b border-neutral-400';
    }
    if (finding.decision === 'edited') {
      return 'bg-blue-500/15 border-b-2 border-blue-600 text-blue-950 dark:text-blue-200';
    }

    // Pending by severity
    const ringClass = isSelected ? 'ring-2 ring-offset-1 ring-[var(--ink-amber)] font-semibold' : '';

    switch (finding.severity) {
      case 'high':
        return `bg-[#C0392B]/20 border-b-2 border-[var(--severity-high)] text-[var(--ink-slate)] ${ringClass}`;
      case 'medium':
        return `bg-[#E8A13A]/20 border-b-2 border-[var(--severity-medium)] text-[var(--ink-slate)] ${ringClass}`;
      case 'low':
      default:
        return `bg-[#2F80A8]/20 border-b-2 border-[var(--severity-low)] text-[var(--ink-slate)] ${ringClass}`;
    }
  };

  return (
    <div className="font-sans text-[15px] leading-[1.8] text-[var(--ink-slate)] whitespace-pre-wrap selection:bg-[var(--ink-amber)]/30">
      {segments.map((seg, idx) => {
        if (!seg.finding) {
          return <span key={idx}>{seg.text}</span>;
        }

        const isSelected = seg.finding.id === selectedFindingId;
        const style = getHighlightStyle(seg.finding, isSelected);

        return (
          <mark
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              onSelectFinding(seg.finding!.id);
            }}
            className={`cursor-pointer rounded-xs px-0.5 transition-all duration-150 inline ${style}`}
            title={`[${seg.finding.severity.toUpperCase()}] ${seg.finding.explanation} (Click to inspect fix)`}
          >
            {seg.text}
          </mark>
        );
      })}
    </div>
  );
};
