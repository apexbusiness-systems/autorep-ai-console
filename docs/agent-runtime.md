# AUTOREPAI Runtime Architecture

## Summary
The AUTOREPAI agent runtime replaces duplicated prompt logic with a centralized, testable, and auditable orchestration engine. It enforces strict compliance rules (AI disclosure, finance constraints, opt-out checking) and uses a `zod`-validated output schema to guarantee structure.

## Architecture Result

### Flow
1. Client requests completion via `aiProvider.complete()`.
2. `aiProvider` routes the request directly to the `agent-orchestrator` edge function if in prod/sandbox.
3. The Edge Function runs mode gating, sets up context, builds the prompt with `AUTOREPAI_CONSTITUTION`, and queries the LLM requesting strict JSON format.
4. The output is validated against a Zod schema.
5. The `runComplianceGate` evaluates if the action/response violates core constraints (finance guarantees, missing AI disclosure, opt-outs).
6. Output, toolCall, and audit events are passed back.

### Orchestrator Entry Point
- `supabase/functions/agent-orchestrator/index.ts`

### Tool Registry Mapping
- Allowlist defined in `src/agents/autorepai/tool-registry.ts`
- Wired mappings include inventory lookup, messaging, quote generation, and escalation. Tools outside the `ALLOWED_TOOLS` array are strictly stripped from the output.

### Environment Modes
- **Demo Mode (`AGENT_MODE=demo`)**: Uses intelligent mock responses if the orchestrator/API is unavailable. Designed for local development and UI demos without incurring LLM costs. It correctly fails to mock in `prod` if credentials are missing.
- **Prod Mode (`AGENT_MODE=prod`)**: Enforces strict failure if keys/backends are missing. Will *never* silently return mock data.

## Compliance Result
- **Disclosure Enforcement**: The compliance gate flags and blocks outbound messages if AI disclosure is missing on first contact.
- **Opt-out Enforcement**: Blocks generation/sending if user is `optedOut` or `suppressed`.
- **Finance Guardrails**: Strips out and blocks text containing phrases like 'guaranteed approval'.
- **Escalation Enforcement**: Intent routing automatically identifies escalation requests.

## Test Evidence
- **Evals**: Created `agent-evals.ts` with fixtures covering first contact, opt-out blocks, finance questions, and escalation handling.
- **Runtime validation**: `autorepai.test.ts` validates prompt generation, zod schema adherence, compliance gating logic, and mode handling.
- **Service mapping**: `ai-provider.test.ts` updated to verify mode-specific demo fallbacks.
- **Test execution**: `npm run test` executes successfully.

## Next Tasks
- Migrate historical message data to strictly include intent and posture metadata for better future evals.
- Define specific Deno import maps for edge function deployments when deploying strictly via Supabase CLI.
