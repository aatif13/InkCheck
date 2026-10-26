import React from 'react';

interface BrandScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const BrandScoreRing: React.FC<BrandScoreRingProps> = ({
  score,
  size = 64,
  strokeWidth = 6,
  showLabel = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = 'var(--severity-success)';
  let bgTint = 'text-emerald-700 dark:text-emerald-400';
  if (clampedScore < 70) {
    strokeColor = 'var(--severity-high)';
    bgTint = 'text-red-700 dark:text-red-400';
  } else if (clampedScore < 85) {
    strokeColor = 'var(--severity-medium)';
    bgTint = 'text-amber-700 dark:text-amber-400';
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-200 dark:text-neutral-800"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className={`absolute text-sm font-semibold tabular-nums ${bgTint}`}>
          {clampedScore}
        </span>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Brand Score
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {clampedScore >= 85 ? 'Publication Ready' : clampedScore >= 70 ? 'Minor Adjustments' : 'Action Required'}
          </span>
        </div>
      )}
    </div>
  );
};
