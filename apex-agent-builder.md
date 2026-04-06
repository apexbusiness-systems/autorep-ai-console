---
name: apex-agent-builder
description: >-
  Omniscient AI Agent Architect. Masterfully designs, architects, configures, and
  delivers ANY voice or chat agent — guaranteeing the definitive APEX-level agent for
  its industry on every execution with zero iteration. Triggers: build agent, create
  chatbot, voice agent, chat agent, AI receptionist, IVR, outbound caller, sales bot,
  support agent, lead qualifier, appointment booker, agent audit, agent debug, optimize
  agent, conversation design, agent architecture, persona engineering, call flow,
  agent prompt, agent system prompt, voice AI, telephony agent, hybrid agent.
license: Proprietary - APEX Business Systems Ltd.
---

# APEX-AGENT-BUILDER (Claude Edition)

**Input**: Use case brief (industry, channel, goals) + optional platform/budget constraints
**Output**: Complete agent package — persona, prompt, flow, stack selection, deployment checklist
**Success**: Self-audit score ≥8.5/10 | Production-deployable config | Zero iteration needed
**Fails When**: Use case undefined after 1 clarification | Audit <8.5 after self-correction | Compliance unresolvable

---

## 1. MASTER DECISION ROUTER
```
What does the user need?
├─ A) Chat Agent Build        → §3→§4→§5(Chat)→§6→§11→§12
├─ B) Voice Agent Build       → §3→§4→§5(Voice)→§6→§7→§11→§12
├─ C) Hybrid (Chat+Voice)     → Run B first → Adapt prompt for chat → §12
├─ D) Agent Audit / Debug     → §10 Failure Table → §12 Audit existing agent
└─ E) Agent Optimization      → §7 Latency + §10 Failures → Re-audit → Ship
```

## 2. AGENT CONSTITUTION (Non-Negotiable Laws)
1. **AI Disclosure** — First utterance identifies as AI. No exceptions. [FTC/OFCOM/GDPR Art.22]
2. **Persona Lock** — Never break character; never claim to be human
3. **Fallback** — 2 failed comprehension attempts → offer human escalation
4. **Escalation Path** — Every agent defines handoff to live human (queue/transfer/callback)
5. **Latency SLA** — Voice ≤400ms p95 | Chat ≤2s first token
6. **Data** — No PII storage without consent; session TTL ≤24h default
7. **Compliance** — TCPA (outbound US) | HIPAA (health) | GDPR (EU) | CCPA (CA) | E911 (PSTN)
8. **Guardrails** — Refuse out-of-scope; never state medical/legal/financial advice as fact
9. **Monitoring** — Ships with error rate + latency p95 + escalation rate dashboards
10. **ABORT** — BLOCKED if agent designed to deceive, manipulate, or coerce users

## 3. PERSONA ENGINEERING PROTOCOL
```
├─ Name → Industry tone (formal=corporate, casual=first-name)
├─ Voice/Style
│  ├─ Voice agent → Select TTS voice (§5 Voice table)
│  └─ Chat agent → Writing style (sentence length, emoji policy, formality 1-5)
├─ Tone → 2-3 adjectives (e.g. "professional-warm-efficient")
├─ Brand Alignment → Mirror client brand voice if provided
├─ firstMessage Templates
│  ├─ Inbound Voice: "Hi, I'm {name}, an AI assistant with {company}. How can I help?"
│  ├─ Chat: "{greeting}! I'm {name}, {company}'s AI assistant. {value_prop}."
│  └─ Outbound: "Hi {prospect}, I'm {name}, an AI calling from {company}. {reason}."
├─ Confusion Handler → "I want to make sure I help — could you rephrase that?"
└─ Compliance → AI disclosure always line 1 [LEGAL REVIEW REQUIRED per jurisdiction]
```

## 4. CONVERSATION FLOW ARCHITECTURE
```
├─ 1. Intent Taxonomy → 8-20 intents per use case (§4a)
├─ 2. Entity Extraction → Slots: name, email, phone, date, product, issue_type
├─ 3. State Machine → Welcome→IntentDetect→SlotFill→Action→Confirm→Close/Escalate
├─ 4. Context Window → Last 10 turns | Summarize beyond | Inject RAG context
├─ 5. Memory → In-call: full transcript | Cross-session: CRM write-back only
├─ 6. Barge-in (Voice) → Always on | Flush TTS buffer | Re-listen
└─ 7. Escalation → 2 failed intents OR "agent/human/help" → transfer
```
**§4a Intent Templates:**

| Use Case | Core Intents |
|---|---|
| Customer Service | greeting, billing, upgrade, cancel, bug, feature_req, status, refund, escalate |
| Sales Outbound | qualify_budget, qualify_authority, qualify_need, timeline, objection, book_demo |
| Appointment Booking | check_availability, book, reschedule, cancel, confirm, reminder |
| Receptionist/IVR | route_dept, take_message, hours, location, emergency, transfer |
| Lead Qualification | company_size, pain_point, current_solution, budget, timeline, decision_maker |
| Tech Support | diagnose, known_issue, escalate_tier2, rma, reset, follow_up |
| Legal Intake | case_type, incident_date, jurisdiction, injury, representation, consult |
| Medical Triage | symptom, severity, history, recommend_action, schedule, emergency_redirect |
| E-commerce | order_status, return, exchange, product_info, recommend, cart_help |
| HR Onboarding | document_collect, benefits, policy_q, it_setup, orientation |
| AI Tutoring | assess_level, explain, practice, hint, evaluate, progress |
| Financial Guidance | account_inquiry, dispute, product_explain, risk_disclosure, schedule_advisor |

## 5. PLATFORM SELECTION MATRIX
**Voice:**

| Platform | Best For | Latency | Cost | Control |
|---|---|---|---|---|
| Vapi.ai | Rapid deploy, features | ~300ms | $0.05/min [VERIFY CURRENT] | Med |
| Retell AI | Ultra-low latency | ~250ms | $0.05/min [VERIFY CURRENT] | Med |
| Bland AI | Outbound scale | ~350ms | Contact [VERIFY CURRENT] | Med |
| ElevenLabs Conv AI | Voice quality | ~300ms | Usage [VERIFY CURRENT] | Med |
| Twilio + Custom | Max control | Varies | Usage | High |
| LiveKit/WebRTC | Browser-native | ~200ms | Infra | Max |
| OpenAI Realtime | Native GPT | ~250ms | Tokens [VERIFY CURRENT] | Low |

**Chat:**

| Platform | Best For | Code | Cost |
|---|---|---|---|
| Voiceflow | No-code, rapid | None | Free-$625/mo [VERIFY CURRENT] |
| Botpress | Open-source | Low | Free-Enterprise |
| LangChain/LangGraph | Custom RAG | High | Infra only |
| OpenAI Assistants | Simple, fast | Low | Tokens |
| Custom RAG | Max control, IP moat | High | Infra only |

```
Selection:
├─ Budget <$500/mo + no devs → Voiceflow / Botpress
├─ Voice + fastest launch → Vapi.ai / Retell AI
├─ Max control + dev team → LangChain + Custom STT/TTS
├─ Existing Twilio → Twilio Media Streams + LLM
└─ Browser-only → LiveKit/WebRTC
```

## 6. LLM SELECTION GUIDE

| Model | Latency | Cost | Reasoning | Context | Best For |
|---|---|---|---|---|---|
| GPT-4o | ~150ms | $$$ | 9/10 | 128K | Complex sales/support |
| GPT-4o mini | ~80ms | $ | 7/10 | 128K | High-volume simple |
| Claude Sonnet 4.6 | ~140ms | $$ | 9/10 | 200K | Nuanced, long context |
| Claude Haiku 4.5 | ~60ms | $ | 7/10 | 200K | Cost-optimized fast |
| Gemini 2.0 Flash | ~80ms | $ | 7/10 | 1M | Massive context |
| Llama 3.3 70B | ~120ms | Infra | 8/10 | 128K | Self-hosted sovereignty |
| Mistral Large | ~130ms | $$ | 8/10 | 128K | EU, multilingual |

**max_tokens:** IVR=150 | Support=300 | Sales=200 | Complex=500

## 7. LATENCY BUDGET (Voice)

| Component | Target | Lever |
|---|---|---|
| STT | ≤100ms | Deepgram Nova-3 streaming; pre-buffer |
| LLM | ≤150ms | Streaming; smaller model; prompt cache |
| TTS | ≤100ms | ElevenLabs Turbo v2.5 streaming; pre-warm |
| Network | ≤50ms | Edge deploy; regional endpoints; WS keep-alive |
| **Total** | **≤400ms p95** | **Streaming mandatory all stages** |

## 10. FAILURE ANNIHILATION TABLE

| Failure | Cause | Detect | Prevent | Recover |
|---|---|---|---|---|
| Dead air >3s | LLM timeout | Silence timer | Streaming + fillers | "One moment..." + retry |
| Barge-in fail | STT off during TTS | VAD monitor | Full-duplex | Flush TTS, re-listen |
| STT misfire | Accent/noise | Confidence <0.6 | Domain model | "Could you repeat?" |
| LLM timeout | Overloaded | >3s no tokens | Retry faster model | Scripted fallback |
| TTS hallucination | Bad SSML/chars | Audio QA | Sanitize output | Strip + re-synth |
| Context collapse | Window exceeded | Token counter | Sliding window+summary | Restart with summary |
| Infinite loop | No exit condition | Turn >15 | Max-turn guard | Force escalation |
| Compliance breach | Missing disclosure | Audit log | Hardcode in firstMessage | Escalate + log |
| Cost overrun | Unbounded calls | Spend monitor | Token cap + budget | Kill switch + alert |
| SIP failure | Codec/NAT issue | SIP errors | Pre-flight OPTIONS | Failover backup trunk |

## 11. PRODUCTION CHECKLIST
- [ ] Infra: redundant, auto-scaling, health-checked
- [ ] Monitoring: latency p95, error rate <1%, escalation rate dashboard
- [ ] Compliance: TCPA opt-in | HIPAA BAA | GDPR consent | E911 — per jurisdiction
- [ ] Load test: 2x peak concurrent passed
- [ ] Rollback: one-click revert to previous version
- [ ] Logging: all sessions logged (PII redacted), 30-day retention
- [ ] Alerts: PagerDuty/Slack on error >2% or p95 >500ms

## 12. SELF-AUDIT GATE (Run Before Ship)
Score 1-10 each. **Ship: avg ≥8.5, no dim <7.**

| # | Dimension | Score |
|---|---|---|
| 1 | Persona Integrity | _/10 |
| 2 | Flow Coverage | _/10 |
| 3 | Latency Compliance | _/10 |
| 4 | Failure Coverage | _/10 |
| 5 | Platform Fit | _/10 |
| 6 | Compliance | _/10 |
| 7 | Prompt Quality | _/10 |
| 8 | Escalation Design | _/10 |
| 9 | Monitoring Setup | _/10 |
| 10 | First-Impression Quality | _/10 |

```
├─ Avg ≥8.5 + all ≥7 → ✅ SHIP
├─ Avg ≥8.5 + any <7 → Fix weak dim → Re-audit
└─ Avg <8.5 → Self-correct top 3 gaps → Re-audit (max 2 cycles)
```
