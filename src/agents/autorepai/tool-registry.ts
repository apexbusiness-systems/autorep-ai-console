import { ToolCall } from './types';

// Define the allowed tools based on repository capabilities
export const ALLOWED_TOOLS = [
  'inventory_match',
  'send_sms',
  'send_email',
  'finance_route',
  'quote_present',
  'escalate',
  'stage_update'
] as const;

export type AllowedTool = typeof ALLOWED_TOOLS[number];

export function validateToolCall(toolCall: ToolCall | null): boolean {
  if (!toolCall) return true;
  return ALLOWED_TOOLS.includes(toolCall.name as AllowedTool);
}
