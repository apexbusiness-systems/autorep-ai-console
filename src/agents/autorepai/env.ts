import { AgentMode } from './types';

export function getAgentMode(env: Record<string, string | undefined>): AgentMode {
  const mode = env.AGENT_MODE?.toLowerCase();
  if (mode === 'demo' || mode === 'sandbox' || mode === 'prod') {
    return mode as AgentMode;
  }
  // Default to prod to ensure fail-closed security posture if undefined
  return 'prod';
}

export function isDemoMode(mode: AgentMode): boolean {
  return mode === 'demo';
}

export function isProdMode(mode: AgentMode): boolean {
  return mode === 'prod';
}
