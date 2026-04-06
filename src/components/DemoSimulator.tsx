/**
 * DemoSimulator — Live Sales Call Workflow Simulator
 * Activated via Ctrl+Shift+D hotkey (invisible to investor audience).
 * Simulates real automotive sales workflows: inbound calls, AI responses,
 * lead progression, sentiment shifts, escalations, and appointment bookings.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  addMessage,
  updateConversationSentiment,
  updateLeadStage,
  addAuditEvent,
} from '@/hooks/use-store';
import type { Message } from '@/types/domain';
import { PhoneIncoming, Zap, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Simulation Scenarios ──────────────────────────────────────────────────

interface SimStep {
  delay: number; // ms before executing
  action: () => void;
  label: string;
}

function buildSalesCallScenario(): SimStep[] {
  const now = () => new Date().toISOString();
  let stepCounter = 0;
  const nextMsgId = () => `sim-msg-${Date.now()}-${stepCounter++}`;

  return [
    // Step 1: New inbound SMS arrives on conv-2
    {
      delay: 2000,
      label: '📱 Inbound SMS from James Cooper',
      action: () => {
        const msg: Message = {
          id: nextMsgId(),
          conversationId: 'conv-2',
          role: 'customer',
          content: "Actually, I'm now also interested in the RAV4. Can you send me pricing on both the F-150 and RAV4?",
          timestamp: now(),
          channel: 'sms',
          delivered: true,
          read: false,
          aiGenerated: false,
          requiresApproval: false,
        };
        addMessage('conv-2', msg);
      },
    },

    // Step 2: AI auto-responds
    {
      delay: 3500,
      label: '🤖 AI Agent responding to James...',
      action: () => {
        const msg: Message = {
          id: nextMsgId(),
          conversationId: 'conv-2',
          role: 'agent',
          content: "Great choice! The 2024 RAV4 XLE AWD is one of our most popular models at $38,450. With your 2019 Civic EX trade-in valued at ~$17,500, your out-of-pocket would be significantly reduced. I'll prepare a side-by-side comparison of the F-150 XLT and RAV4 XLE with monthly payment scenarios. Give me just a moment!",
          timestamp: now(),
          channel: 'sms',
          delivered: true,
          read: true,
          aiGenerated: true,
          requiresApproval: false,
        };
        addMessage('conv-2', msg);
        updateConversationSentiment('conv-2', 'positive');
      },
    },

    // Step 3: Lead stage progression
    {
      delay: 2000,
      label: '📊 Lead stage updated → Vehicle Interest',
      action: () => {
        updateLeadStage('lead-2', 'vehicle_interest');
        addAuditEvent({
          id: `audit-sim-${Date.now()}`,
          action: 'stage_updated',
          entityType: 'lead',
          entityId: 'lead-2',
          performedBy: 'AI Agent',
          performedAt: now(),
          details: 'James Cooper moved to Vehicle Interest — now comparing F-150 and RAV4',
        });
      },
    },

    // Step 4: New inbound on conv-3 (Maria Santos)
    {
      delay: 4000,
      label: '📱 Maria Santos replying on web chat',
      action: () => {
        const msg: Message = {
          id: nextMsgId(),
          conversationId: 'conv-3',
          role: 'customer',
          content: "My ideal monthly payment would be around $350-400. I'm looking at the Equinox LT. What kind of rates can you get me?",
          timestamp: now(),
          channel: 'web',
          delivered: true,
          read: false,
          aiGenerated: false,
          requiresApproval: false,
        };
        addMessage('conv-3', msg);
      },
    },

    // Step 5: AI responds to Maria with finance pre-qual
    {
      delay: 3000,
      label: '🤖 AI Agent handling finance pre-qual...',
      action: () => {
        const msg: Message = {
          id: nextMsgId(),
          conversationId: 'conv-3',
          role: 'agent',
          content: "With the Equinox LT at $32,500 and a target of $350-400/month, here's what I can do: On a 72-month term at our current rate of 4.99%, your payment would be approximately $399/month with $2,500 down. If you put $5,000 down, it drops to $378/month. Would you like me to run a soft credit pre-qualification? It won't affect your score.",
          timestamp: now(),
          channel: 'web',
          delivered: true,
          read: true,
          aiGenerated: true,
          requiresApproval: false,
        };
        addMessage('conv-3', msg);
        updateConversationSentiment('conv-3', 'positive');
        updateLeadStage('lead-3', 'quote_sent');
      },
    },

    // Step 6: Simulated phone call ringing (conv-7 callback)
    {
      delay: 3000,
      label: '📞 Outbound callback to Amanda Torres',
      action: () => {
        const msg: Message = {
          id: nextMsgId(),
          conversationId: 'conv-7',
          role: 'agent',
          content: "Hi Amanda! This is the AI sales assistant from Door Step Auto calling back as promised. I've prepared a detailed comparison of all three options we discussed — the RAV4 XLE with $5K down at $425/month, the Tucson Preferred at $399/month, and a special: the 2023 Honda CR-V EX-L at $347/month. Which would you like to explore first?",
          timestamp: now(),
          channel: 'phone',
          delivered: true,
          read: true,
          aiGenerated: true,
          requiresApproval: false,
        };
        addMessage('conv-7', msg);
        addAuditEvent({
          id: `audit-sim-${Date.now()}`,
          action: 'call_started',
          entityType: 'conversation',
          entityId: 'conv-7',
          performedBy: 'AI Agent',
          performedAt: now(),
          details: 'Scheduled callback initiated to Amanda Torres — payment comparison presentation',
        });
      },
    },

    // Step 7: Amanda responds positively
    {
      delay: 5000,
      label: '😊 Amanda responding positively!',
      action: () => {
        const msg: Message = {
          id: nextMsgId(),
          conversationId: 'conv-7',
          role: 'customer',
          content: "Wait — the CR-V at $347? That's actually within my budget! Tell me more about that one. What's the catch?",
          timestamp: now(),
          channel: 'phone',
          delivered: true,
          read: false,
          aiGenerated: false,
          requiresApproval: false,
        };
        addMessage('conv-7', msg);
        updateConversationSentiment('conv-7', 'positive');
        addAuditEvent({
          id: `audit-sim-${Date.now()}`,
          action: 'sentiment_changed',
          entityType: 'conversation',
          entityId: 'conv-7',
          performedBy: 'System',
          performedAt: now(),
          details: 'Amanda Torres sentiment shifted: frustrated → positive (alternative vehicle found)',
        });
      },
    },

    // Step 8: AI closes toward appointment
    {
      delay: 3500,
      label: '🤖 AI closing → booking test drive',
      action: () => {
        const msg: Message = {
          id: nextMsgId(),
          conversationId: 'conv-7',
          role: 'agent',
          content: "No catch at all! The 2023 CR-V EX-L has only 12,400 km, leather interior, sunroof, and Honda Sensing safety suite. It's actually one of our best-value SUVs right now. At $35,900 with your $15,000 Corolla trade-in, you'd be financing just $20,900 — that's why the payment is so comfortable. Would you like to come in for a test drive? I have openings tomorrow at 11 AM and 2 PM.",
          timestamp: now(),
          channel: 'phone',
          delivered: true,
          read: true,
          aiGenerated: true,
          requiresApproval: false,
        };
        addMessage('conv-7', msg);
        updateLeadStage('lead-8', 'appointment_set');
      },
    },

    // Step 9: Final — appointment booked
    {
      delay: 4000,
      label: '🎉 Test drive booked! Deal progressing.',
      action: () => {
        const msg: Message = {
          id: nextMsgId(),
          conversationId: 'conv-7',
          role: 'customer',
          content: "Tomorrow at 2 PM works! I'm actually excited now. See you then!",
          timestamp: now(),
          channel: 'phone',
          delivered: true,
          read: false,
          aiGenerated: false,
          requiresApproval: false,
        };
        addMessage('conv-7', msg);
        addAuditEvent({
          id: `audit-sim-${Date.now()}`,
          action: 'appointment_booked',
          entityType: 'appointment',
          entityId: 'apt-sim-1',
          performedBy: 'AI Agent',
          performedAt: now(),
          details: 'Test drive booked for Amanda Torres — CR-V EX-L, tomorrow at 2 PM. Objection resolved via alternative vehicle.',
        });
      },
    },
  ];
}

// ─── Component ─────────────────────────────────────────────────────────────

const DemoSimulator = () => {
  const [visible, setVisible] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepLabels, setStepLabels] = useState<string[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Hotkey: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setVisible(v => !v);
      }
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, []);

  const stopSimulation = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setRunning(false);
  }, []);

  const startSimulation = useCallback(() => {
    stopSimulation();
    setRunning(true);
    setCurrentStep(-1);
    setStepLabels([]);

    const steps = buildSalesCallScenario();
    let cumulativeDelay = 0;

    steps.forEach((step, index) => {
      cumulativeDelay += step.delay;
      const timeout = setTimeout(() => {
        step.action();
        setCurrentStep(index);
        setStepLabels(prev => [...prev, step.label]);
      }, cumulativeDelay);
      timeoutsRef.current.push(timeout);
    });

    // Auto-stop after all steps
    const finalTimeout = setTimeout(() => {
      setRunning(false);
    }, cumulativeDelay + 1000);
    timeoutsRef.current.push(finalTimeout);
  }, [stopSimulation]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[340px] glass-premium rounded-xl overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold" />
          <span className="text-sm font-semibold text-foreground">Demo Simulator</span>
        </div>
        <div className="flex items-center gap-1">
          {running ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={stopSimulation}>
              <Pause className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startSimulation}>
              <Play className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setVisible(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-2 border-b border-border/30 flex items-center gap-2">
        {running ? (
          <>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-green-400 font-medium">Simulating live sales workflow...</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Press Play to start simulation</span>
          </>
        )}
      </div>

      {/* Step Log */}
      <div className="max-h-[240px] overflow-y-auto p-3 space-y-1.5">
        {stepLabels.length === 0 && !running && (
          <div className="py-6 text-center">
            <PhoneIncoming className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-[11px] text-muted-foreground">
              Simulates a real sales call workflow with AI agents
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              SMS, phone calls, objection handling, and appointment booking
            </p>
          </div>
        )}
        {stepLabels.map((label, i) => (
          <div
            key={i}
            className={`text-[11px] px-2 py-1.5 rounded-md animate-fade-in-up ${
              i === currentStep
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'text-muted-foreground'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-border/30">
        <p className="text-[9px] text-muted-foreground/50 text-center">
          Ctrl+Shift+D to toggle • Activity appears in all pages
        </p>
      </div>
    </div>
  );
};

export default DemoSimulator;
