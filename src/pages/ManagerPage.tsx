import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield, Eye, HandMetal, MessageSquare, AlertTriangle,
  BarChart3, Users, Clock, Bot, PhoneOff, CheckCircle2,
  XCircle, Edit3, ShieldCheck, FileWarning, ArrowRightLeft,
  Activity, Phone, Globe, Instagram, Facebook, Mail,
  ChevronRight, Gauge, UserCheck, Ban, Timer, Flag,
  TrendingUp, DollarSign, Zap, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import {
  useConversations,
  useEscalations,
  useAuditEvents,
  useMessages,
  useLeads,
  useQuotes,
  initiateHandoff,
} from "@/hooks/use-store";
import type { Conversation, Escalation, Message, Channel } from "@/types/domain";

// ─── Helpers ────────────────────────────────────────────────────────────────

const channelIcons: Record<Channel, typeof Phone> = {
  phone: Phone,
  sms: MessageSquare,
  web: Globe,
  instagram: Instagram,
  facebook: Facebook,
  email: Mail,
};

const channelLabel: Record<Channel, string> = {
  phone: "Phone",
  sms: "SMS",
  web: "Web",
  instagram: "Instagram",
  facebook: "Facebook",
  email: "Email",
};

const stageLabel: Record<string, string> = {
  new: "New",
  first_contact: "First Contact",
  vehicle_interest: "Interest",
  quote_sent: "Quote Sent",
  appointment_set: "Appt Set",
  finance_intake: "Finance",
  negotiation: "Negotiation",
  closed_won: "Won",
  closed_lost: "Lost",
  stale: "Stale",
};

const sentimentColor: Record<string, string> = {
  positive: "text-green-400",
  neutral: "text-gray-400",
  frustrated: "text-red-400",
  angry: "text-red-600",
  unknown: "text-gray-500",
};

const sentimentLabel: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  frustrated: "Frustrated",
  angry: "Angry",
  unknown: "Unknown",
};

const severityStyles: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  low: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

const escalationReasonLabel: Record<string, string> = {
  customer_request: "Customer requested human agent",
  objection_detected: "Objection pattern detected by AI",
  sentiment_negative: "Negative sentiment detected",
  complex_negotiation: "Complex negotiation required",
  finance_question: "Finance question beyond AI scope",
  compliance_flag: "Compliance flag raised",
  ai_low_confidence: "AI confidence below threshold",
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDuration(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime();
  const totalSecs = Math.floor(diff / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ─── Summary Card ───────────────────────────────────────────────────────────

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  accent,
  subtitle,
}: {
  icon: typeof Bot;
  label: string;
  value: string | number;
  accent?: boolean;
  subtitle?: string;
}) => (
  <div
    className={`p-4 rounded-lg border transition-colors ${
      accent
        ? "bg-gold/5 border-gold/20"
        : "bg-card border-border hover:border-border/80"
    }`}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon
        className={`w-4 h-4 ${accent ? "text-gold" : "text-muted-foreground"}`}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p
      className={`text-2xl font-bold ${
        accent ? "text-gold" : "text-foreground"
      }`}
    >
      {value}
    </p>
    {subtitle && (
      <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
    )}
  </div>
);

// ─── Live Conversation Table ────────────────────────────────────────────────

function LiveConversationMonitor({
  conversations,
  onViewTranscript,
}: {
  conversations: Conversation[];
  onViewTranscript: (id: string) => void;
}) {
  const activeConvos = useMemo(() => conversations.filter(
    (c) => c.status === "active" || c.status === "escalated"
  ), [conversations]);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-4 h-4 text-gold" /> Live Conversation Monitor
        </h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Auto-refreshing
          </span>
        </div>
      </div>

      {activeConvos.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">
            No active conversations at this time
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Conversations will appear here when customers engage
          </p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/20 border-b border-border">
              {[
                "Customer",
                "Handler",
                "Channel",
                "Deal Stage",
                "Duration",
                "Sentiment",
                "Actions",
              ].map((col) => (
                <th
                  key={col}
                  className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeConvos.map((c) => {
              const isEscalated = c.escalationFlag;
              const ChannelIcon = channelIcons[c.channel] || MessageSquare;

              return (
                <tr
                  key={c.id}
                  className={`border-b border-border transition-colors ${
                    isEscalated
                      ? "bg-red-500/5"
                      : "hover:bg-secondary/20"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {c.customerName}
                      </span>
                      {isEscalated && (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.currentHandler === "ai" ? (
                      <StatusBadge status="active" label="AI Agent" />
                    ) : (
                      <StatusBadge status="pending" label={c.handlerName || "Human"} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ChannelIcon className="w-3.5 h-3.5" />
                      {channelLabel[c.channel]}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">
                    {stageLabel[c.dealStage] || c.dealStage}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {c.duration || formatDuration(c.startedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        sentimentColor[c.sentiment] || "text-gray-400"
                      }`}
                    >
                      {sentimentLabel[c.sentiment] || c.sentiment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => onViewTranscript(c.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {c.currentHandler === "ai" ? "Listen" : "View"}
                      </Button>
                      <Button
                        variant={isEscalated ? "gold" : "secondary"}
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          if (c.currentHandler === "ai") {
                            initiateHandoff(c.id, "Manager");
                          }
                        }}
                      >
                        <HandMetal className="w-3 h-3 mr-1" />
                        {isEscalated ? "Take Over" : "Handoff"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Escalation Alerts ──────────────────────────────────────────────────────

function EscalationAlerts({
  escalations,
  onViewTranscript,
}: {
  escalations: Escalation[];
  onViewTranscript: (conversationId: string) => void;
}) {
  const openEscalations = useMemo(() => escalations.filter((e) => e.status === "open"), [escalations]);

  if (openEscalations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <ShieldCheck className="w-8 h-8 text-green-400/60 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No open escalations
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          All conversations are running smoothly
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {openEscalations.map((esc) => {
        const isCriticalOrHigh =
          esc.severity === "critical" || esc.severity === "high";

        return (
          <div
            key={esc.id}
            className={`p-4 rounded-lg border ${
              isCriticalOrHigh
                ? "bg-gold/5 border-gold/20"
                : "bg-card border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 ${
                  isCriticalOrHigh ? "text-gold" : "text-yellow-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium text-foreground">
                    Escalation &mdash; {esc.customerName}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                      severityStyles[esc.severity]
                    }`}
                  >
                    {esc.severity}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {(() => {
                      const Icon = channelIcons[esc.channel] || MessageSquare;
                      return <Icon className="w-3 h-3" />;
                    })()}
                    {channelLabel[esc.channel]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {escalationReasonLabel[esc.reason] || esc.reason}
                </p>
                <p className="text-xs text-foreground/70 mt-1.5 italic">
                  Recommended: Assign to experienced closer for immediate follow-up.
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button
                    variant="gold"
                    size="sm"
                    className="text-xs"
                    onClick={() =>
                      initiateHandoff(esc.conversationId, "Mike R.")
                    }
                  >
                    Assign to Mike R.
                  </Button>
                  <Button variant="secondary" size="sm" className="text-xs">
                    Assign to Other
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => onViewTranscript(esc.conversationId)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" /> View Transcript
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    Dismiss
                  </Button>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {timeAgo(esc.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Transcript Review Panel ────────────────────────────────────────────────

function TranscriptReviewPanel({
  conversationId,
  conversations,
  onClose,
}: {
  conversationId: string | null;
  conversations: Conversation[];
  onClose: () => void;
}) {
  const messages = useMessages(conversationId);
  const conversation = conversations.find((c) => c.id === conversationId);

  // Combine inline messages from conversation object and store messages
  const allMessages: Message[] = useMemo(() => {
    if (!conversation) return [];
    return messages.length > 0
      ? messages
      : conversation.messages && conversation.messages.length > 0
      ? conversation.messages
      : [];
  }, [messages, conversation]);

  const pendingApproval = useMemo(() => allMessages.filter(
    (m) => m.requiresApproval && m.approved === undefined
  ), [allMessages]);

  if (!conversationId || !conversation) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Select a conversation to review its transcript
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Use the Live Monitor tab to pick a conversation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Transcript: {conversation.customerName}
            </h3>
            <StatusBadge
              status={conversation.status === "active" ? "active" : "idle"}
              label={conversation.status}
            />
            {conversation.currentHandler === "ai" ? (
              <StatusBadge status="active" label="AI Handling" />
            ) : (
              <StatusBadge
                status="pending"
                label={conversation.handlerName || "Human"}
              />
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Messages */}
        <div className="max-h-[480px] overflow-y-auto p-4 space-y-3">
          {allMessages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No messages in this conversation yet
            </p>
          ) : (
            allMessages.map((msg) => {
              const isFlagged =
                msg.requiresApproval && msg.approved === undefined;
              const isCustomer = msg.role === "customer";
              const isAgent = msg.role === "agent";

              return (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 ${
                    isFlagged
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : isCustomer
                      ? "bg-secondary/40 border border-border"
                      : isAgent
                      ? "bg-card border border-border"
                      : "bg-secondary/20 border border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                          isCustomer
                            ? "text-blue-400"
                            : isAgent
                            ? "text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {msg.role === "customer"
                          ? conversation.customerName
                          : msg.role === "agent"
                          ? msg.aiGenerated
                            ? "AI Agent"
                            : conversation.handlerName || "Agent"
                          : msg.role === "manager"
                          ? "Manager"
                          : "System"}
                      </span>
                      {isFlagged && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-yellow-400 font-medium">
                          <Flag className="w-3 h-3" /> Requires Approval
                        </span>
                      )}
                      {msg.aiGenerated && (
                        <span className="text-[10px] text-muted-foreground/60">
                          AI generated
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {msg.content}
                  </p>
                  {isFlagged && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-yellow-500/10">
                      <Button variant="gold" size="sm" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Approval Queue for this conversation */}
      {pendingApproval.length > 0 && (
        <div className="rounded-lg border border-gold/20 bg-gold/5">
          <div className="px-4 py-3 border-b border-gold/10 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <h4 className="text-sm font-semibold text-foreground">
              Pending Approvals ({pendingApproval.length})
            </h4>
          </div>
          <div className="p-3 space-y-2">
            {pendingApproval.map((msg) => (
              <div
                key={msg.id}
                className="p-3 rounded-md bg-background/50 border border-border"
              >
                <p className="text-xs text-muted-foreground mb-1">
                  Proposed AI response:
                </p>
                <p className="text-sm text-foreground/90">{msg.content}</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="gold" size="sm" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button variant="secondary" size="sm" className="text-xs">
                    <Edit3 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sensitive Message Approval Queue ───────────────────────────────────────

function ApprovalQueue({
  conversations,
}: {
  conversations: Conversation[];
}) {
  // Collect all messages across conversations that need approval
  const pendingMessages = useMemo(() => {
    const pending: { conversation: Conversation; message: Message }[] = [];
    for (const conv of conversations) {
      const msgs = conv.messages || [];
      for (const msg of msgs) {
        if (msg.requiresApproval && msg.approved === undefined) {
          pending.push({ conversation: conv, message: msg });
        }
      }
    }
    return pending;
  }, [conversations]);

  if (pendingMessages.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-400/60 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No messages pending approval
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          AI-generated sensitive messages will appear here for review
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingMessages.map(({ conversation, message }) => (
        <div
          key={message.id}
          className="p-4 rounded-lg border border-gold/20 bg-gold/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                {conversation.customerName}
              </span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {channelLabel[conversation.channel]}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="p-3 rounded-md bg-background/50 border border-border mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Proposed AI Message
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {message.content}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                AI Confidence: 87%
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" size="sm" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button variant="secondary" size="sm" className="text-xs">
                <Edit3 className="w-3 h-3 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <XCircle className="w-3 h-3 mr-1" /> Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Compliance & Exception Indicators ──────────────────────────────────────

function CompliancePanel({
  conversations,
  auditEvents,
  escalations,
}: {
  conversations: Conversation[];
  auditEvents: { id: string; action: string; performedAt: string; details: string }[];
  escalations: Escalation[];
}) {
  const totalConvos = conversations.length || 1;

  // ⚡ Bolt Performance Optimization: Single-pass array reduction
  // Replaced multiple O(N) array .filter() operations with a single pass O(N) loop
  // Expected impact: Reduces CPU cycles and memory allocations when processing large lists
  const complianceData = useMemo(() => {
    let disclosureSent = 0;
    let optOutHandled = 0;
    let flaggedConvos = 0;
    let openEscalations = 0;

    for (let i = 0; i < conversations.length; i++) {
      const c = conversations[i];
      if (c.aiDisclosureSent) disclosureSent++;
      if (c.optedOut) optOutHandled++;
      if (c.escalationFlag) flaggedConvos++;
    }

    for (let i = 0; i < escalations.length; i++) {
      if (escalations[i].status === "open") openEscalations++;
    }

    return { disclosureSent, optOutHandled, flaggedConvos, openEscalations };
  }, [conversations, escalations]);

  const disclosureRate =
    totalConvos > 0
      ? Math.round((complianceData.disclosureSent / totalConvos) * 100)
      : 100;

  const complianceItems = [
    {
      label: "AI Disclosure Compliance",
      value: `${disclosureRate}%`,
      icon: ShieldCheck,
      color:
        disclosureRate >= 95
          ? "text-green-400"
          : disclosureRate >= 80
          ? "text-yellow-400"
          : "text-red-400",
      detail: `${complianceData.disclosureSent} of ${totalConvos} conversations`,
    },
    {
      label: "Opt-Out Requests Handled",
      value: String(complianceData.optOutHandled),
      icon: Ban,
      color: "text-foreground",
      detail: "All opt-outs processed within SLA",
    },
    {
      label: "Escalation Response Time",
      value: "< 2 min",
      icon: Timer,
      color: "text-green-400",
      detail: "Average across all escalations",
    },
    {
      label: "Flagged Conversations",
      value: String(complianceData.flaggedConvos),
      icon: FileWarning,
      color: complianceData.flaggedConvos > 0 ? "text-yellow-400" : "text-green-400",
      detail: `${complianceData.openEscalations} open escalations`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Compliance Grid */}
      <div className="grid grid-cols-2 gap-4">
        {complianceItems.map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
            </div>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Audit Events */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold" /> Recent Compliance Events
          </h4>
        </div>
        {auditEvents.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-muted-foreground">
              No audit events recorded yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {auditEvents.slice(0, 10).map((evt) => (
              <div
                key={evt.id}
                className="px-4 py-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  <span className="text-xs text-foreground">{evt.details}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(evt.performedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recent Handoffs ────────────────────────────────────────────────────────

function RecentHandoffs({
  auditEvents,
}: {
  auditEvents: { id: string; action: string; entityId: string; performedAt: string; details: string }[];
}) {
  const handoffs = useMemo(() => auditEvents.filter(
    (e) => e.action === "handoff_completed" || e.action === "handoff_initiated"
  ), [auditEvents]);

  if (handoffs.length === 0) {
    return (
      <div className="rounded-lg bg-card border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-gold" /> Recent Handoffs
        </h3>
        <p className="text-xs text-muted-foreground text-center py-4">
          No handoffs recorded yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <ArrowRightLeft className="w-4 h-4 text-gold" /> Recent Handoffs
      </h3>
      <div className="space-y-3">
        {handoffs.slice(0, 8).map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div>
              <p className="text-sm text-foreground">{h.details}</p>
              <p className="text-xs text-muted-foreground">
                {h.action === "handoff_completed" ? "Completed" : "Initiated"}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge
                status={
                  h.action === "handoff_completed" ? "active" : "pending"
                }
                label={
                  h.action === "handoff_completed" ? "Resolved" : "In Progress"
                }
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {timeAgo(h.performedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Charts ───────────────────────────────────────────────────────

const CHART_GOLD = "hsl(42, 65%, 55%)";
const CHART_GOLD_BRIGHT = "hsl(42, 80%, 65%)";
const CHART_BLUE = "hsl(210, 80%, 55%)";
const CHART_GREEN = "hsl(152, 60%, 42%)";
const CHART_ORANGE = "hsl(38, 92%, 50%)";
const CHART_RED = "hsl(0, 72%, 51%)";
const CHART_PURPLE = "hsl(270, 60%, 55%)";
const CHART_TEAL = "hsl(180, 60%, 45%)";

const PIE_COLORS = [CHART_GOLD, CHART_BLUE, CHART_GREEN, CHART_ORANGE, CHART_PURPLE, CHART_TEAL];

const chartTooltipStyle = {
  contentStyle: {
    background: 'hsl(220, 14%, 11%)',
    border: '1px solid hsl(220, 12%, 18%)',
    borderRadius: '8px',
    color: 'hsl(45, 30%, 92%)',
    fontSize: '12px',
  },
};

function DashboardCharts() {
  const leads = useLeads();
  const conversations = useConversations();
  const quotes = useQuotes();

  // Lead Stage Funnel Data
  const funnelData = useMemo(() => {
    const stages: Record<string, number> = {};
    leads.forEach(l => {
      const label = stageLabel[l.stage] || l.stage;
      stages[label] = (stages[label] || 0) + 1;
    });
    return Object.entries(stages).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Lead Source Distribution
  const sourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    leads.forEach(l => {
      const src = l.source?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
      sources[src] = (sources[src] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // ⚡ Bolt Performance Optimization: Single-pass array reduction
  // Replaced multiple O(N) array .filter() operations with a single pass O(N) loop
  // Expected impact: Reduces CPU cycles and memory allocations when processing large lists
  const { aiHandledCount, humanHandledCount } = useMemo(() => {
    let ai = 0;
    let human = 0;
    for (let i = 0; i < conversations.length; i++) {
      if (conversations[i].currentHandler === 'ai') ai++;
      else if (conversations[i].currentHandler === 'human') human++;
    }
    return { aiHandledCount: ai, humanHandledCount: human };
  }, [conversations]);

  // AI vs Human Handle Rate
  const handlerData = useMemo(() => {
    const total = aiHandledCount + humanHandledCount || 1;
    return [
      { name: 'AI Handled', value: Math.round((aiHandledCount / total) * 100), count: aiHandledCount },
      { name: 'Human Handled', value: Math.round((humanHandledCount / total) * 100), count: humanHandledCount },
    ];
  }, [aiHandledCount, humanHandledCount]);

  // Sentiment Distribution
  const sentimentData = useMemo(() => {
    const sentiments: Record<string, number> = {};
    conversations.forEach(c => {
      const label = sentimentLabel[c.sentiment] || c.sentiment;
      sentiments[label] = (sentiments[label] || 0) + 1;
    });
    return Object.entries(sentiments).map(([name, value]) => ({ name, value }));
  }, [conversations]);

  // Revenue Pipeline (from quotes)
  const revenuePipeline = useMemo(() => {
    let total = 0;
    quotes.forEach(q => {
      q.scenarios?.forEach(s => {
        total += s.sellingPrice || 0;
      });
    });
    return total;
  }, [quotes]);

  // Conversion funnel timeline (simulated hourly data)
  const timelineData = useMemo(() => [
    { time: '6AM', ai: 2, human: 0, leads: 1 },
    { time: '7AM', ai: 5, human: 0, leads: 2 },
    { time: '8AM', ai: 8, human: 1, leads: 3 },
    { time: '9AM', ai: 12, human: 2, leads: 4 },
    { time: '10AM', ai: 15, human: 2, leads: 6 },
    { time: '11AM', ai: 18, human: 3, leads: 7 },
    { time: 'Now', ai: aiHandledCount + 18, human: humanHandledCount + 3, leads: leads.length + 5 },
  ], [aiHandledCount, humanHandledCount, leads.length]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border card-interactive">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gold" />
            <span className="text-xs text-muted-foreground">Revenue Pipeline</span>
          </div>
          <p className="text-2xl font-bold text-gold number-roll-in">${(revenuePipeline / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12.5% from last week
          </p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border card-interactive">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-gold" />
            <span className="text-xs text-muted-foreground">Conversion Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground number-roll-in">34.2%</p>
          <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +5.3% vs industry avg
          </p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border card-interactive">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-gold" />
            <span className="text-xs text-muted-foreground">AI Handle Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground number-roll-in">{handlerData[0]?.value || 0}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {handlerData[0]?.count || 0} of {(handlerData[0]?.count || 0) + (handlerData[1]?.count || 0)} conversations
          </p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border card-interactive">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gold" />
            <span className="text-xs text-muted-foreground">Avg First Response</span>
          </div>
          <p className="text-2xl font-bold text-foreground number-roll-in">1.2s</p>
          <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 98% faster than human avg
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Stage Funnel */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gold" /> Lead Pipeline by Stage
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnelData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 18%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="value" fill={CHART_GOLD} radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources Pie */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" /> Lead Sources
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {sourceData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold" /> Today's Activity Timeline
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 18%)" />
              <XAxis dataKey="time" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'hsl(220, 10%, 50%)' }} />
              <Area type="monotone" dataKey="ai" stackId="1" stroke={CHART_GOLD} fill={CHART_GOLD} fillOpacity={0.3} name="AI Conversations" />
              <Area type="monotone" dataKey="human" stackId="1" stroke={CHART_BLUE} fill={CHART_BLUE} fillOpacity={0.3} name="Human Conversations" />
              <Area type="monotone" dataKey="leads" stroke={CHART_GREEN} fill={CHART_GREEN} fillOpacity={0.15} name="New Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment Distribution */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-gold" /> Conversation Sentiment
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {sentimentData.map((entry, index) => {
                  const colors: Record<string, string> = { Positive: CHART_GREEN, Neutral: CHART_BLUE, Frustrated: CHART_ORANGE, Angry: CHART_RED };
                  return <Cell key={`cell-${index}`} fill={colors[entry.name] || CHART_PURPLE} />;
                })}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const ManagerPage = () => {
  const conversations = useConversations();
  const escalations = useEscalations();
  const auditEvents = useAuditEvents();

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Computed counts
  // ⚡ Bolt Performance Optimization: Single-pass array reduction
  // Replaced multiple O(N) array .filter() operations with a single pass O(N) loop
  // Expected impact: Reduces CPU cycles and memory allocations when processing large lists
  const { activeAiCount, humanHandledCount } = useMemo(() => {
    let activeAi = 0;
    let humanHandled = 0;
    for (let i = 0; i < conversations.length; i++) {
      const c = conversations[i];
      if (c.currentHandler === "ai" && c.status === "active") activeAi++;
      if (c.currentHandler === "human") humanHandled++;
    }
    return { activeAiCount: activeAi, humanHandledCount: humanHandled };
  }, [conversations]);

  const openEscalationCount = useMemo(() => {
    let openCount = 0;
    for (let i = 0; i < escalations.length; i++) {
      if (escalations[i].status === "open") openCount++;
    }
    return openCount;
  }, [escalations]);

  const handleViewTranscript = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setActiveTab("transcript");
  };

  return (
    <AppLayout>
      <PageHeader
        title="Manager Supervision"
        subtitle="Monitor AI conversations, review sentiment, and manage handoffs"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" /> Reports
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard
            icon={Bot}
            label="Active AI Conversations"
            value={activeAiCount}
            subtitle="Currently handled by AI"
          />
          <SummaryCard
            icon={Users}
            label="Human-Handled"
            value={humanHandledCount}
            subtitle="Transferred to agents"
          />
          <SummaryCard
            icon={HandMetal}
            label="Handoff Requests"
            value={openEscalationCount}
            accent
            subtitle="Awaiting assignment"
          />
          <SummaryCard
            icon={Clock}
            label="Avg Response Time"
            value="1.2s"
            subtitle="Across all AI conversations"
          />
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="dashboard" className="text-xs gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Live Monitor
            </TabsTrigger>
            <TabsTrigger value="escalations" className="text-xs gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Escalations
              {openEscalationCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gold/20 text-gold text-[9px] font-bold badge-pulse">
                  {openEscalationCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transcript" className="text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Transcript Review
            </TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Compliance
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardCharts />
          </TabsContent>

          {/* Live Monitor Tab */}
          <TabsContent value="live" className="space-y-6">
            <LiveConversationMonitor
              conversations={conversations}
              onViewTranscript={handleViewTranscript}
            />

            {/* Inline Escalation Alert Banner (only when escalations exist) */}
            {openEscalationCount > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gold" />
                  Active Escalation Alerts
                </h3>
                <EscalationAlerts
                  escalations={escalations}
                  onViewTranscript={handleViewTranscript}
                />
              </div>
            )}

            {/* Recent Handoffs */}
            <RecentHandoffs auditEvents={auditEvents} />
          </TabsContent>

          {/* Escalations Tab */}
          <TabsContent value="escalations" className="space-y-6">
            <EscalationAlerts
              escalations={escalations}
              onViewTranscript={handleViewTranscript}
            />

            {/* Approval Queue */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold" />
                Sensitive Message Approval Queue
              </h3>
              <ApprovalQueue conversations={conversations} />
            </div>
          </TabsContent>

          {/* Transcript Review Tab */}
          <TabsContent value="transcript" className="space-y-6">
            {/* Conversation Selector */}
            {conversations.length > 0 && (
              <div className="rounded-lg border border-border bg-card">
                <div className="px-4 py-3 border-b border-border">
                  <h4 className="text-sm font-semibold text-foreground">
                    Select Conversation
                  </h4>
                </div>
                <div className="divide-y divide-border max-h-48 overflow-y-auto">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConversationId(c.id)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                        selectedConversationId === c.id
                          ? "bg-gold/5"
                          : "hover:bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground">
                          {c.customerName}
                        </span>
                        <StatusBadge
                          status={c.status === "active" ? "active" : "idle"}
                          label={c.status}
                        />
                        {c.escalationFlag && (
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {channelLabel[c.channel]}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <TranscriptReviewPanel
              conversationId={selectedConversationId}
              conversations={conversations}
              onClose={() => setSelectedConversationId(null)}
            />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <CompliancePanel
              conversations={conversations}
              auditEvents={auditEvents}
              escalations={escalations}
            />

            {/* Recent Handoffs in Compliance view too */}
            <RecentHandoffs auditEvents={auditEvents} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ManagerPage;
