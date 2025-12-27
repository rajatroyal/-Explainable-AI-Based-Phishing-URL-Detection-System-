
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface DetailedThreat {
  name: string;
  severity: RiskLevel;
  description: string;
}

export interface ExtractedLink {
  url: string;
  isSuspicious: boolean;
  reason: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  isPhishing: boolean;
  confidenceScore: number; // This is now used as the "Risk Probability" (0-100)
  riskLevel: RiskLevel;
  threatsDetected: DetailedThreat[];
  summary: string;
  recommendations: string[];
  extractedLinks: ExtractedLink[];
  groundingSources?: GroundingSource[];
  analyzedAt: string;
  isSimulation?: boolean; 
}

export interface ScanHistoryItem {
  id: string;
  content: string;
  result: AnalysisResult;
  timestamp: number;
}
