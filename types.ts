export interface NetworkNode {
  id: string;
  label: string;
  type: 'server' | 'database' | 'router' | 'workstation' | 'firewall';
  status: 'secure' | 'warning' | 'critical';
  ip: string;
  os: string;
  description: string;
  vulnerabilities: Vulnerability[];
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  value: number;
}

export interface Vulnerability {
  id: string;
  cve?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface VoiceCommand {
  text: string;
  intent?: string;
  targetId?: string;
}

export interface AudioProfile {
  enabled: boolean;
  rate: number; // Speed
  volume: number;
  verbosity: 'low' | 'medium' | 'high';
}

export type ViewMode = 'graph' | 'list';