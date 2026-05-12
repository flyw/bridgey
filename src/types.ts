export interface Config {
  token: string;
  relay: {
    port: number;
    host: string;
    webUser?: string;
    webPass?: string;
  };
  agent: {
    serverUrl: string;
  };
}

export interface AgentInfo {
  id: string;
  status: 'alive' | 'disconnected';
  lastSeen: number;
  command?: string;
  cwd?: string;
  ip?: string;
  hostname?: string;
}
