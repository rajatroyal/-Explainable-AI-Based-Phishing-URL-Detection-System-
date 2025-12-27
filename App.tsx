
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { analyzeContent } from './services/geminiService';
import { AnalysisResult, ScanHistoryItem, RiskLevel } from './types';
import ResultView from './components/ResultView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'url' | 'simulation'>('content');
  const [inputText, setInputText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [simulationText, setSimulationText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeScanType, setActiveScanType] = useState<'content' | 'url' | 'simulation' | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('phishguard_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const isValidUrl = (url: string) => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', // fragment locator
      'i'
    );
    return !!pattern.test(url);
  };

  const handleAnalyze = async () => {
    const type = activeTab;
    const targetInput = 
      type === 'content' ? inputText : 
      type === 'url' ? urlInput : 
      simulationText;

    if (!targetInput.trim()) return;

    setError(null);
    setResult(null);

    // Validate URL if in URL tab
    if (type === 'url' && !isValidUrl(targetInput)) {
      setError('Please enter a valid URL (e.g., https://example.com or domain.com)');
      return;
    }

    setIsAnalyzing(true);
    setActiveScanType(type);

    try {
      const isSim = type === 'simulation';
      
      // Explicitly prompt for real-time verification when scanning URLs
      const prompt = type === 'url' 
        ? `Perform a real-time security check for the URL: ${targetInput}. Use Search to verify the site's identity, age, and reputation. Provide exact data, not a general estimate.` 
        : targetInput;
      
      const analysis = await analyzeContent(prompt, isSim);
      setResult(analysis);
      
      const newHistoryItem: ScanHistoryItem = {
        id: crypto.randomUUID(),
        content: targetInput.substring(0, 100),
        result: analysis,
        timestamp: Date.now()
      };

      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('phishguard_history', JSON.stringify(updatedHistory));
    } catch (err: any) {
      setError(err.message || 'An unexpected security error occurred during intelligence gathering.');
    } finally {
      setIsAnalyzing(false);
      setActiveScanType(null);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('phishguard_history');
  };

  const isInputEmpty = 
    activeTab === 'content' ? !inputText.trim() : 
    activeTab === 'url' ? !urlInput.trim() : 
    !simulationText.trim();

  const getThemeColor = () => {
    if (activeTab === 'content') return 'indigo';
    if (activeTab === 'url') return 'emerald';
    return 'purple';
  };

  const themeColor = getThemeColor();

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const lowerSearch = searchTerm.toLowerCase();
    return history.filter(item => {
      const contentMatch = item.content.toLowerCase().includes(lowerSearch);
      const riskMatch = item.result.riskLevel.toLowerCase().includes(lowerSearch);
      const typeMatch = item.result.isSimulation ? 'simulation'.includes(lowerSearch) : false;
      return contentMatch || riskMatch || typeMatch;
    });
  }, [history, searchTerm]);

  const getRiskColor = (item: ScanHistoryItem) => {
    if (item.result.isSimulation) return 'bg-purple-500';
    switch (item.result.riskLevel) {
      case RiskLevel.LOW: return 'bg-emerald-500';
      case RiskLevel.MEDIUM: return 'bg-amber-500';
      case RiskLevel.HIGH: return 'bg-orange-500';
      case RiskLevel.CRITICAL: return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getRiskTextColor = (item: ScanHistoryItem) => {
    if (item.result.isSimulation) return 'text-purple-400';
    switch (item.result.riskLevel) {
      case RiskLevel.LOW: return 'text-emerald-400';
      case RiskLevel.MEDIUM: return 'text-amber-400';
      case RiskLevel.HIGH: return 'text-orange-400';
      case RiskLevel.CRITICAL: return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getRiskIntensityIcon = (item: ScanHistoryItem) => {
    if (item.result.isSimulation) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    switch (item.result.riskLevel) {
      case RiskLevel.LOW:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case RiskLevel.MEDIUM:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case RiskLevel.HIGH:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case RiskLevel.CRITICAL:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHistoryId(expandedHistoryId === id ? null : id);
  };

  // Helper to render the Risk Tag with icon and proper colors
  const renderRiskTag = (item: ScanHistoryItem) => {
    if (item.result.isSimulation) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-600 text-white shadow-lg shadow-purple-500/20">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.054.441l-1.712 1.37a2 2 0 00-.542 2.541l.002.002a2 2 0 001.676.953h14.88c.908 0 1.646-.565 1.946-1.348l.33-.825a2 2 0 00-.542-2.541l-1.712-1.37zM12 11V3m0 0l-3 3m3-3l3 3" />
          </svg>
          Simulation
        </span>
      );
    }

    let config = {
      colorClass: 'bg-slate-500',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };

    switch (item.result.riskLevel) {
      case RiskLevel.LOW:
        config = {
          colorClass: 'bg-emerald-500 shadow-emerald-500/30',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        };
        break;
      case RiskLevel.MEDIUM:
        config = {
          colorClass: 'bg-amber-500 shadow-amber-500/30',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
        break;
      case RiskLevel.HIGH:
        config = {
          colorClass: 'bg-orange-500 shadow-orange-500/30',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
        break;
      case RiskLevel.CRITICAL:
        config = {
          colorClass: 'bg-red-600 shadow-red-600/30',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )
        };
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase text-white shadow-lg transition-all ${config.colorClass}`}>
        {config.icon}
        {item.result.riskLevel} Risk
      </span>
    );
  };

  return (
    <div className="min-h-screen text-slate-200 p-4 md:p-8 flex flex-col items-center">
      <style>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        @keyframes pulse-emerald {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          50% { box-shadow: 0 0 15px 2px rgba(16, 185, 129, 0.2); }
        }
        .animate-pulse-emerald {
          animation: pulse-emerald 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <header className="w-full max-w-5xl mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">PhishGuard <span className="text-indigo-400 font-light">AI</span></h1>
            <p className="text-slate-400 text-sm">Advanced NLP Security Analysis Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
          <div className={`w-2 h-2 rounded-full animate-pulse ${themeColor === 'emerald' ? 'bg-emerald-500' : themeColor === 'purple' ? 'bg-purple-500' : 'bg-indigo-500'}`}></div>
          <span className="text-xs font-medium text-slate-300">Analysis Core Active</span>
        </div>
      </header>

      <main className="w-full max-w-5xl space-y-8 mb-12">
        <div className={`glass-card rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isAnalyzing ? `ring-2 ring-${themeColor}-500/50 bg-${themeColor}-900/10` : ''}`}>
          <div className="flex flex-wrap border-b border-slate-700/50 bg-slate-900/20">
            <button
              onClick={() => { setActiveTab('content'); setError(null); }}
              className={`flex-1 py-4 px-4 text-[11px] md:text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'content' ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className="relative group flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-slate-700 z-50">
                  Detection
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-slate-700"></div>
                </div>
              </div>
              Detection
            </button>
            <button
              onClick={() => { setActiveTab('url'); setError(null); }}
              className={`flex-1 py-4 px-4 text-[11px] md:text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'url' ? 'text-emerald-400 bg-emerald-500/5 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className="relative group flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-slate-700 z-50">
                  URL Scan
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-slate-700"></div>
                </div>
              </div>
              URL Scan
            </button>
            <button
              onClick={() => { setActiveTab('simulation'); setError(null); }}
              className={`flex-1 py-4 px-4 text-[11px] md:text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'simulation' ? 'text-purple-400 bg-purple-500/5 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className="relative group flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-slate-700 z-50">
                  Simulation
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-slate-700"></div>
                </div>
              </div>
              Simulation
            </button>
          </div>

          <div className="p-6 md:p-8">
            <div className="relative">
              {activeTab === 'content' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-slate-300 font-medium">Detection Engine</h3>
                    <span className="text-xs text-slate-500">Analyze real incoming messages</span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste the suspicious email or SMS content here..."
                    className={`w-full min-h-[200px] bg-slate-900/50 text-slate-100 rounded-2xl border border-slate-700 p-5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none placeholder-slate-600 ${isAnalyzing ? 'opacity-50' : ''}`}
                  />
                </div>
              )}

              {activeTab === 'url' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-slate-300 font-medium">Link Validator</h3>
                    <span className="text-xs text-slate-500">Inspect specific URL with real-time intelligence</span>
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => { setUrlInput(e.target.value); if (error) setError(null); }}
                      placeholder="https://secure-login.example-scam.com"
                      className={`w-full bg-slate-900/50 text-slate-100 rounded-2xl border transition-all outline-none placeholder-slate-600 pl-5 py-4 ${
                        urlInput ? 'pr-12' : 'pr-5'
                      } ${
                        isAnalyzing ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 animate-pulse-emerald' : 
                        error && activeTab === 'url' ? 'border-red-500' : 'border-slate-700 focus:ring-2 focus:ring-indigo-500'
                      }`}
                    />
                    {urlInput && !isAnalyzing && (
                      <button
                        onClick={() => { setUrlInput(''); if (error) setError(null); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all active:scale-90"
                        title="Clear URL"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {isAnalyzing && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 rounded-b-2xl overflow-hidden">
                        <div className="h-full bg-emerald-500 w-1/4 animate-scan blur-[1px]"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'simulation' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-slate-300 font-medium">Training Simulator</h3>
                    <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Education Mode</span>
                  </div>
                  <textarea
                    value={simulationText}
                    onChange={(e) => setSimulationText(e.target.value)}
                    placeholder="Write a 'test' phishing message here to see how effective it is for training purposes..."
                    className={`w-full min-h-[200px] bg-slate-900/50 text-slate-100 rounded-2xl border border-purple-900/30 p-5 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none placeholder-slate-600 ${isAnalyzing ? 'opacity-50' : ''}`}
                  />
                  <p className="text-[10px] text-slate-500 italic">
                    Note: This mode is for educational security awareness training. The AI critiques the deception tactics to help you learn what real attackers use.
                  </p>
                </div>
              )}
              
              {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="flex flex-col items-center gap-2">
                    <svg className={`animate-spin h-8 w-8 ${themeColor === 'emerald' ? 'text-emerald-400' : themeColor === 'purple' ? 'text-purple-400' : 'text-indigo-400'}`} viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className={`text-xs font-bold animate-pulse ${themeColor === 'emerald' ? 'text-emerald-300' : themeColor === 'purple' ? 'text-purple-300' : 'text-indigo-300'}`}>
                      {activeTab === 'url' ? 'Fetching Real-time Threat Intelligence...' : 'Scanning for Malware...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isInputEmpty}
                className={`flex-grow flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98] ${
                  isAnalyzing || isInputEmpty
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : activeTab === 'simulation'
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30'
                      : activeTab === 'url'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'
                }`}
              >
                {isAnalyzing ? 'Analyzing...' : activeTab === 'url' ? 'Verify URL Authenticity' : 'Start Security Scan'}
              </button>
              <button
                onClick={() => { setInputText(''); setUrlInput(''); setSimulationText(''); setResult(null); setError(null); }}
                className="px-8 py-4 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold border border-slate-700 transition-all active:scale-[0.98]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-2xl text-red-400 flex items-center gap-3 animate-in fade-in duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        {result && (
          <div className="w-full">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 px-1">
              <span className={`w-2 h-6 rounded-full ${result.isSimulation ? 'bg-purple-500' : 'bg-indigo-500'}`}></span>
              {result.isSimulation ? 'Simulation Analysis Data' : 'Verified Security Findings'}
            </h2>
            <ResultView result={result} />
          </div>
        )}

        <section className="border-t border-slate-800 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Intelligence Log
            </h2>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
              <div className="relative group min-w-[280px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Filter by content or risk level..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/40 text-slate-200 text-xs rounded-xl border border-slate-800 py-2.5 pl-9 pr-4 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 outline-none transition-all placeholder-slate-600"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <>
                    <button 
                      onClick={() => setSearchTerm('')} 
                      disabled={!searchTerm}
                      className={`text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded-lg border transition-all flex-1 sm:flex-none whitespace-nowrap ${
                        searchTerm 
                          ? 'text-indigo-400 bg-indigo-900/10 border-indigo-900/30 hover:border-indigo-500/50 hover:bg-indigo-900/20' 
                          : 'text-slate-600 bg-slate-900/10 border-slate-800 cursor-not-allowed opacity-50'
                      }`}
                    >
                      Clear Filter
                    </button>
                    <button onClick={clearHistory} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold bg-slate-900/20 px-3 py-2 rounded-lg border border-slate-800 hover:border-red-900/30 flex-1 sm:flex-none whitespace-nowrap">
                      Wipe Database
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((item) => {
                const isExpanded = expandedHistoryId === item.id;
                return (
                  <div 
                    key={item.id} 
                    className={`glass-card p-4 rounded-2xl border hover:border-slate-600 transition-all cursor-pointer group animate-in fade-in zoom-in duration-300 relative overflow-hidden ${item.result.isSimulation ? 'border-purple-900/30' : 'border-slate-800'} ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}
                    onClick={() => {
                      setResult(item.result);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                  >
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${getRiskColor(item)} opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.1)]`}></div>
                    
                    <div className="pl-2">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          {renderRiskTag(item)}
                          <button 
                            onClick={(e) => toggleExpand(item.id, e)}
                            className="p-1 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-slate-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex gap-3 mb-2">
                        <div className={`mt-1 flex-shrink-0 ${getRiskTextColor(item)}`}>
                          {getRiskIntensityIcon(item)}
                        </div>
                        <p className="text-slate-300 text-sm line-clamp-2 italic">
                          "{item.content}..."
                        </p>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Detailed Threat Breakdown</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {item.result.threatsDetected.map((threat, idx) => (
                              <div key={idx} className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-white">{threat.name}</span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                                    threat.severity === RiskLevel.LOW ? 'text-emerald-400 bg-emerald-400/20 border-emerald-500/30' :
                                    threat.severity === RiskLevel.MEDIUM ? 'text-amber-400 bg-amber-400/20 border-amber-500/30' :
                                    threat.severity === RiskLevel.HIGH ? 'text-orange-400 bg-orange-400/20 border-orange-500/30' :
                                    'text-red-400 bg-red-400/20 border-red-500/30'
                                  }`}>
                                    {threat.severity}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed italic">{threat.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-[10px] text-indigo-400 font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform mt-2">
                        {item.result.isSimulation ? 'Review Critique →' : 'View Full Dossier →'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 glass-card rounded-3xl border-dashed border-2 border-slate-800 animate-in fade-in duration-500">
              {history.length > 0 ? (
                <div className="flex flex-col items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-slate-500 text-sm">No intelligence records match "{searchTerm}".</p>
                  <button onClick={() => setSearchTerm('')} className="text-xs text-indigo-400 font-bold hover:underline">Clear filter</button>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No telemetry records found.</p>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="w-full max-w-5xl text-center text-slate-500 text-xs py-8 border-t border-slate-800">
        <p>&copy; {new Date().getFullYear()} PhishGuard AI • Powered by Gemini AI • Real-time Cybersecurity Intelligence</p>
        <p className="mt-2 text-[10px] opacity-50 uppercase tracking-widest">Confidential Analysis & Training Mode Active</p>
      </footer>
    </div>
  );
};

export default App;
