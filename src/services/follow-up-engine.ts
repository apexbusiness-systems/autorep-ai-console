/**
 * Follow-Up Engine
 * Automatically creates follow-up tasks based on agent tool calls,
 * conversation state changes, and lead stage transitions.
 *
 * Integrates with the AUTOREPAI agent output to schedule intelligent
 * follow-up actions without manual intervention.
 */

import type {
  FollowUpTask, LeadStage, Channel, LeadPriority
} from '@/types/domain';
import type { AgentResponse, ToolCall } from '@/agents/autorepai/types';

export interface FollowUpContext {
  leadId: string;
  conversationId: string;
  customerName: string;
  channel: Channel;
  currentStage: LeadStage;
  priority: LeadPriority;
}

/**
 * Generate follow-up tasks from an agent response.
 * Returns tasks that should be persisted to the follow_up_tasks table.
 */
export function generateFollowUps(
  agentResponse: AgentResponse,
  context: FollowUpContext
): FollowUpTask[] {
  const tasks: FollowUpTask[] = [];
  const now = new Date();

  // Auto-follow-up based on tool calls
  if (agentResponse.toolCall) {
    const toolTask = toolCallFollowUp(agentResponse.toolCall, context, now);
    if (toolTask) tasks.push(toolTask);
  }

  // Stage-based follow-ups
  if (agentResponse.stage) {
    const stageTask = stageTransitionFollowUp(agentResponse.stage, context, now);
    if (stageTask) tasks.push(stageTask);
  }

  // Escalation follow-up
  if (agentResponse.escalate) {
    tasks.push(createTask({
      context,
      type: 'callback',
      message: `Escalated conversation requires manager follow-up. Reason: ${agentResponse.intent}`,
      delayHours: 0.5, // 30 minutes
      now,
      priority: 'hot',
    }));
  }

  return tasks;
}

function toolCallFollowUp(
  toolCall: ToolCall,
  context: FollowUpContext,
  now: Date
): FollowUpTask | null {
  switch (toolCall.name) {
    case 'quote_present':
      return createTask({
        context,
        type: 'quote_follow_up',
        message: `Follow up on quote sent to ${context.customerName}. Check if they reviewed it and address any questions.`,
        delayHours: 24,
        now,
      });

    case 'inventory_match':
      return createTask({
        context,
        type: 'follow_up',
        message: `Check if ${context.customerName} found a vehicle match from the search results. Offer to schedule a test drive.`,
        delayHours: 48,
        now,
      });

    case 'send_email':
      return createTask({
        context,
        type: 'follow_up',
        message: `Follow up on email sent to ${context.customerName}. Confirm receipt and next steps.`,
        delayHours: 72,
        now,
      });

    case 'finance_route':
      return createTask({
        context,
        type: 'callback',
        message: `Finance application routed for ${context.customerName}. Monitor for DMS response and inform customer of decision.`,
        delayHours: 4,
        now,
        priority: 'hot',
      });

    default:
      return null;
  }
}

function stageTransitionFollowUp(
  newStage: string,
  context: FollowUpContext,
  now: Date
): FollowUpTask | null {
  switch (newStage) {
    case 'first_contact':
      return createTask({
        context,
        type: 'follow_up',
        message: `Initial contact made with ${context.customerName}. Send vehicle recommendations based on expressed interests.`,
        delayHours: 24,
        now,
      });

    case 'vehicle_interest':
      return createTask({
        context,
        type: 'follow_up',
        message: `${context.customerName} expressed vehicle interest. Send comparison with similar options and payment estimates.`,
        delayHours: 12,
        now,
      });

    case 'appointment_set':
      return createTask({
        context,
        type: 'appointment_reminder',
        message: `Reminder: ${context.customerName} has an upcoming appointment. Confirm attendance and prepare vehicle(s).`,
        delayHours: 24,
        now,
      });

    case 'quote_sent':
      return null; // Handled by tool call follow-up

    case 'stale':
      return createTask({
        context,
        type: 'reactivation',
        message: `${context.customerName} has gone quiet. Send a reactivation message with new inventory or promotions.`,
        delayHours: 168, // 7 days
        now,
        priority: 'cold',
      });

    default:
      return null;
  }
}

function createTask(params: {
  context: FollowUpContext;
  type: FollowUpTask['type'];
  message: string;
  delayHours: number;
  now: Date;
  priority?: LeadPriority;
}): FollowUpTask {
  const scheduledFor = new Date(params.now.getTime() + params.delayHours * 60 * 60 * 1000);

  return {
    id: `ft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    leadId: params.context.leadId,
    conversationId: params.context.conversationId,
    type: params.type,
    status: 'scheduled',
    scheduledFor: scheduledFor.toISOString(),
    channel: params.context.channel,
    message: params.message,
    assignedTo: 'AI Agent',
    priority: params.priority || params.context.priority,
    customerName: params.context.customerName,
  };
}
