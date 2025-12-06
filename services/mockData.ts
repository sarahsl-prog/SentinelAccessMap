import { NetworkNode, NetworkLink } from '../types';

export const mockNodes: NetworkNode[] = [
  {
    id: 'fw-01',
    label: 'Core Firewall',
    type: 'firewall',
    status: 'secure',
    ip: '192.168.1.1',
    os: 'PfSense',
    description: 'Primary perimeter firewall filtering incoming traffic. Ruleset version 4.2 active.',
    vulnerabilities: []
  },
  {
    id: 'db-prod-01',
    label: 'Primary DB',
    type: 'database',
    status: 'critical',
    ip: '192.168.1.10',
    os: 'Ubuntu 20.04 LTS',
    description: 'Main production database containing sensitive customer records. Currently flagging critical security violations.',
    vulnerabilities: [
      { id: 'v1', cve: 'CVE-2024-10023', severity: 'critical', description: 'SQL Injection vulnerability in login module' },
      { id: 'v2', severity: 'medium', description: 'Outdated SSL certificate' }
    ]
  },
  {
    id: 'web-prod-01',
    label: 'Web Server A',
    type: 'server',
    status: 'warning',
    ip: '192.168.1.20',
    os: 'CentOS 7',
    description: 'Frontend web server hosting the customer portal. Performance is degraded due to high load.',
    vulnerabilities: [
      { id: 'v3', cve: 'CVE-2023-4589', severity: 'high', description: 'Apache HTTP Server privilege escalation' }
    ]
  },
  {
    id: 'web-prod-02',
    label: 'Web Server B',
    type: 'server',
    status: 'secure',
    ip: '192.168.1.21',
    os: 'CentOS 7',
    description: 'Secondary web server for load balancing. Operating within normal parameters.',
    vulnerabilities: []
  },
  {
    id: 'router-main',
    label: 'Main Router',
    type: 'router',
    status: 'secure',
    ip: '192.168.0.1',
    os: 'Cisco IOS',
    description: 'Core backbone router handling internal network traffic distribution.',
    vulnerabilities: []
  },
  {
    id: 'ws-hr-04',
    label: 'HR Workstation',
    type: 'workstation',
    status: 'critical',
    ip: '192.168.2.45',
    os: 'Windows 10',
    description: 'Workstation assigned to HR department. Critical malware signatures detected in file system.',
    vulnerabilities: [
      { id: 'v4', severity: 'critical', description: 'Ransomware signature detected in temporary files' },
      { id: 'v5', severity: 'high', description: 'SMB port 445 open to public internet' }
    ]
  },
  {
    id: 'ws-dev-09',
    label: 'Dev Laptop',
    type: 'workstation',
    status: 'warning',
    ip: '192.168.2.88',
    os: 'MacOS Sonoma',
    description: 'Developer laptop connected via guest WiFi. System firewall is currently disabled.',
    vulnerabilities: [
      { id: 'v6', severity: 'medium', description: 'Disabled system firewall' }
    ]
  }
];

export const mockLinks: NetworkLink[] = [
  { source: 'router-main', target: 'fw-01', value: 10 },
  { source: 'fw-01', target: 'web-prod-01', value: 5 },
  { source: 'fw-01', target: 'web-prod-02', value: 5 },
  { source: 'fw-01', target: 'db-prod-01', value: 8 },
  { source: 'router-main', target: 'ws-hr-04', value: 2 },
  { source: 'router-main', target: 'ws-dev-09', value: 2 },
  { source: 'web-prod-01', target: 'db-prod-01', value: 5 },
  { source: 'web-prod-02', target: 'db-prod-01', value: 5 },
];