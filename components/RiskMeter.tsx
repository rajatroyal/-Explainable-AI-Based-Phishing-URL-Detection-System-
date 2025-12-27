
import React from 'react';
import { RiskLevel } from '../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
  isSimulation?: boolean;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level, isSimulation }) => {
  const getColor = () => {
    switch (level) {
      case RiskLevel.LOW: return 'bg-emerald-500';
      case RiskLevel.MEDIUM: return 'bg-amber-500';
      case RiskLevel.HIGH: return 'bg-orange-600';
      case RiskLevel.CRITICAL: return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getTextColor = () => {
    if (isSimulation) return 'text-purple-400';
    switch (level) {
      case RiskLevel.LOW: return 'text-emerald-400';
      case RiskLevel.MEDIUM: return 'text-amber-400';
      case RiskLevel.HIGH: return 'text-orange-400';
      case RiskLevel.CRITICAL: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const label = isSimulation ? 'Deception' : 'Risk';

  return (
    <div className="flex flex-col items-center justify-center p-6 glass-card rounded-2xl">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-800"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={552.92}
            strokeDashoffset={552.92 * (1 - score / 100)}
            strokeLinecap="round"
            className={`${isSimulation ? 'text-purple-500' : getTextColor()} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-4xl font-bold text-white">{score}%</span>
          <span className={`text-[10px] font-semibold uppercase tracking-widest mt-1 ${isSimulation ? 'text-purple-400' : getTextColor()}`}>
            {level} {label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RiskMeter;
