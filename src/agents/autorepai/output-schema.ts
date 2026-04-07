import { z } from 'zod';

export const toolCallSchema = z.object({
  name: z.string(),
  args: z.record(z.any()),
});

export const agentResponseSchema = z.object({
  message: z.string().describe("The text response to send to the user. MUST BE SAFE AND COMPLIANT."),
  intent: z.string().describe("The detected user intent (e.g., 'vehicle_inquiry', 'finance_question', 'general_chat')."),
  posture: z.enum(['LEAN_IN', 'GUIDE', 'PLANT', 'RESET']).describe("The conversational posture to take."),
  stage: z.string().nullable().describe("The updated stage of the conversation or lead."),
  confidence: z.number().min(0).max(1).describe("Confidence score of the intent and response (0.0 to 1.0)."),
  nextAction: z.string().nullable().describe("Description of the next best action to take."),
  toolCall: toolCallSchema.nullable().describe("A specific tool to execute, if applicable."),
  escalate: z.boolean().describe("True if the conversation should be escalated to a human."),
  complianceFlags: z.array(z.string()).describe("List of compliance rules applied or considered in this response."),
  auditMeta: z.object({
    promptVersion: z.string(),
    model: z.string(),
    channel: z.string(),
  }).describe("Metadata for auditing purposes."),
});

export type AgentResponseSchemaType = z.infer<typeof agentResponseSchema>;
