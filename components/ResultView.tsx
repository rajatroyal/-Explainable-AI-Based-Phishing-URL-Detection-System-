
import React, { useState } from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import RiskMeter from './RiskMeter';

interface ResultViewProps {
  result: AnalysisResult;
}

const ResultView: React.FC<ResultViewProps> = ({ result }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (isHelpful: boolean) => {
    console.log(`[Feedback] Analysis ID: ${result.analyzedAt} | Helpful: ${isHelpful}`);
    setFeedbackGiven(true);
  };

  const isSim = result.isSimulation;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <RiskMeter score={result.confidenceScore} level={result.riskLevel} isSimulation={isSim} />
        </div>
        
        <div className="md:col-span-2 space-y-4">
          <div className={`glass-card p-6 rounded-2xl h-full border ${isSim ? 'border-purple-500/30' : 'border-white/10'}`}>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSim ? 'text-purple-400' : 'text-indigo-400'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {isSim ? 'Simulation Critique' : 'Executive Summary'}
              {isSim && <span className="ml-auto text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded uppercase tracking-tighter">Training Mode</span>}
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm">
              {result.summary}
            </p>
            
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 w-full mb-1">{isSim ? 'Tactics Identified:' : 'Threats Detected:'}</span>
              {result.threatsDetected.map((threat, i) => (
                <div key={i} className={`group relative px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border cursor-help ${
                  threat.severity === RiskLevel.LOW ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                  threat.severity === RiskLevel.MEDIUM ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' :
                  'bg-red-900/30 text-red-400 border-red-500/30'
                }`}>
                  {threat.name}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] normal-case rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl border border-slate-700 z-50">
                    {threat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Grounding Section */}
      {!isSim && result.groundingSources && result.groundingSources.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/20">
          <h3 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Verified Intelligence Sources
          </h3>
          <div className="flex flex-wrap gap-3">
            {result.groundingSources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="text-[10px] text-slate-300 font-medium truncate max-w-[200px]">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSim ? 'text-purple-400' : 'text-emerald-400'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {isSim ? 'Refinement Tips' : 'Recommendations'}
          </h3>
          <ul className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isSim ? 'bg-purple-900/30 text-purple-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            URL Inspection
          </h3>
          {result.extractedLinks.length > 0 ? (
            <div className="space-y-4">
              {result.extractedLinks.map((link, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${link.isSuspicious ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="truncate max-w-[80%] font-mono text-[10px] text-slate-400">{link.url}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${link.isSuspicious ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {link.isSuspicious ? 'Suspect' : 'Safe'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] italic">"{link.reason}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-sm">No links detected in content</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-slate-700/50">
        {!feedbackGiven ? (
          <>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center ${isSim ? 'text-purple-400' : 'text-indigo-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Was this analysis helpful?</h4>
                <p className="text-xs text-slate-500">Your feedback helps improve our threat models.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => handleFeedback(true)}
                className={`flex-1 md:flex-none px-6 py-2 border rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${isSim ? 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border-purple-500/30' : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border-emerald-500/30'}`}
              >
                Yes
              </button>
              <button 
                onClick={() => handleFeedback(false)}
                className="flex-1 md:flex-none px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                No
              </button>
            </div>
          </>
        ) : (
          <div className="w-full text-center py-2 animate-in zoom-in duration-300">
            <p className={`${isSim ? 'text-purple-400' : 'text-indigo-400'} font-bold flex items-center justify-center gap-2 text-sm`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Thank you for your feedback!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultView;
