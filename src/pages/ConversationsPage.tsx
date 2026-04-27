import { useState, useMemo, useDeferredValue } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useConversations,
  useMessages,
  useStore,
  setActiveConversation,
  addMessage,
  updateConversationStatus,
} from "@/hooks/use-store";
import {
  Phone,
  MessageSquare,
  Globe,
  Instagram,
  Facebook,
  Search,
  Filter,
  Plus,
  Clock,
  Send,
  Check,
  CheckCheck,
  Eye,
  Bot,
  AlertTriangle,
  User,
  ShieldAlert,
  XCircle,
  FileText,
  Car,
  CalendarPlus,
  MailPlus,
  ToggleLeft,
  ToggleRight,
  MessageCircle,
  Ban,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { Conversation, Message, Channel, ConversationStatus, Sentiment } from "@/types/domain";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const channelIcons: Record<Channel, typeof Phone> = {
  phone: Phone,
  sms: MessageSquare,
  web: Globe,
  instagram: Instagram,
  facebook: Facebook,
  email: MailPlus,
};

const channelLabels: Record<Channel, string> = {
  phone: "Phone",
  sms: "SMS",
  web: "Web Chat",
  instagram: "Instagram",
  facebook: "Facebook",
  email: "Email",
};

const sentimentColors: Record<Sentiment, string> = {
  positive: "bg-green-400",
  neutral: "bg-yellow-400",
  frustrated: "bg-red-400",
  angry: "bg-red-600",
  unknown: "bg-gray-400",
};

const statusBadgeMap: Record<ConversationStatus, "active" | "pending" | "idle" | "error" | "connected"> = {
  active: "active",
  pending: "pending",
  idle: "idle",
  closed: "idle",
  escalated: "error",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "\u2026" : str;
}

// ─── Delivery State Icons ──────────────────────────────────────────────────────

function DeliveryIndicator({ msg }: { msg: Message }) {
  if (msg.role === "customer" || msg.role === "system") return null;
  if (msg.read) return <Eye className="w-3 h-3 text-gold/70" />;
  if (msg.delivered) return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
  return <Check className="w-3 h-3 text-muted-foreground/60" />;
}

// ─── Thread List Item ──────────────────────────────────────────────────────────

function ThreadItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = channelIcons[conversation.channel] || MessageSquare;
  const lastMessage =
    conversation.messages.length > 0
      ? conversation.messages[conversation.messages.length - 1].content
      : conversation.summary || "No messages yet";

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors ${
        isActive
          ? "bg-gold/5 border-l-2 border-l-gold"
          : "hover:bg-secondary/30"
      }`}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary mt-0.5 shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${
              conversation.unreadCount > 0
                ? "font-semibold text-foreground"
                : "font-medium text-foreground/80"
            }`}
          >
            {conversation.customerName}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        <p
          className={`text-xs mt-0.5 truncate ${
            conversation.unreadCount > 0
              ? "text-foreground/90"
              : "text-muted-foreground"
          }`}
        >
          {truncate(lastMessage, 60)}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <StatusBadge
            status={statusBadgeMap[conversation.status]}
            label={conversation.status}
          />
          <span className="text-[10px] text-muted-foreground">
            {channelLabels[conversation.channel]}
          </span>
          {/* Sentiment dot */}
          <span
            className={`w-2 h-2 rounded-full ${sentimentColors[conversation.sentiment]}`}
            title={`Sentiment: ${conversation.sentiment}`}
          />
          {/* AI disclosure badge */}
          {conversation.aiDisclosureSent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 font-medium">
              AI
            </span>
          )}
        </div>
      </div>
      {/* Unread dot */}
      {conversation.unreadCount > 0 && (
        <span className="w-2.5 h-2.5 rounded-full bg-gold mt-2 shrink-0" />
      )}
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onApprove,
  onReject,
}: {
  msg: Message;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  if (msg.role === "system") {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-secondary/50 text-muted-foreground text-xs px-4 py-1.5 rounded-full border border-border">
          {msg.content}
        </div>
      </div>
    );
  }

  const isCustomer = msg.role === "customer";
  const isPending = msg.requiresApproval && msg.approved === undefined;

  return (
    <div
      className={`flex mb-3 ${
        isCustomer ? "justify-end" : "justify-start"
      }`}
    >
      <div className={`max-w-[70%] ${isPending ? "opacity-80" : ""}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isCustomer
              ? "bg-gold/15 text-foreground rounded-br-md"
              : "bg-secondary text-foreground rounded-bl-md border border-border"
          }`}
        >
          {msg.content}
        </div>
        <div
          className={`flex items-center gap-1.5 mt-1 px-1 ${
            isCustomer ? "justify-end" : "justify-start"
          }`}
        >
          {msg.aiGenerated && !isCustomer && (
            <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 font-medium">
              <Bot className="w-2.5 h-2.5" />
              AI
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <DeliveryIndicator msg={msg} />
        </div>
        {/* Approval buttons for pending messages */}
        {isPending && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-yellow-400 font-medium">
              Pending Approval
            </span>
            <Button
              variant="gold"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 text-red-400 hover:text-red-300"
              onClick={onReject}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Context Panel ─────────────────────────────────────────────────────────────

function ContextPanel({ conversation }: { conversation: Conversation }) {
  const allQuotes = useStore((s) => s.quotes);
  const allAppointments = useStore((s) => s.appointments);
  const allEscalations = useStore((s) => s.escalations);

  const quotes = useMemo(() =>
    allQuotes.filter((q) => q.conversationId === conversation.id)
  , [allQuotes, conversation.id]);

  const appointments = useMemo(() =>
    allAppointments.filter((a) => a.conversationId === conversation.id)
  , [allAppointments, conversation.id]);

  const escalation = useMemo(() =>
    allEscalations.find(
      (e) => e.conversationId === conversation.id && e.status !== "resolved"
    )
  , [allEscalations, conversation.id]);

  return (
    <div className="w-[300px] border-l border-border flex flex-col overflow-y-auto bg-background">
      {/* Customer Quick Info */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Customer
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
            <User className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {conversation.customerName}
            </p>
            {conversation.customerPhone && (
              <p className="text-xs text-muted-foreground">
                {conversation.customerPhone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Metadata */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Conversation Details
        </h3>
        <div className="space-y-2">
          <MetaRow
            label="Channel"
            value={channelLabels[conversation.channel]}
          />
          <MetaRow label="Started" value={timeAgo(conversation.startedAt)} />
          <MetaRow
            label="Messages"
            value={String(conversation.messages.length)}
          />
          <MetaRow
            label="Handler"
            value={`${conversation.handlerName} (${conversation.currentHandler.toUpperCase()})`}
          />
          <MetaRow label="Deal Stage" value={conversation.dealStage.replace(/_/g, " ")} />
        </div>
      </div>

      {/* Objection Markers */}
      {conversation.objectionCount > 0 && (
        <div className="px-4 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Objections
          </h3>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-foreground">
              {conversation.objectionCount} objection
              {conversation.objectionCount !== 1 ? "s" : ""} detected
            </span>
          </div>
        </div>
      )}

      {/* Escalation */}
      {escalation && (
        <div className="px-4 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Escalation
          </h3>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
            <p className="text-xs text-red-400 font-medium capitalize">
              {escalation.reason.replace(/_/g, " ")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Severity: {escalation.severity}
            </p>
            {escalation.assignedTo && (
              <p className="text-[11px] text-muted-foreground">
                Assigned to: {escalation.assignedTo}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Related Quotes */}
      {quotes.length > 0 && (
        <div className="px-4 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Quotes ({quotes.length})
          </h3>
          <div className="space-y-2">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {q.quoteNumber}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {q.status} - Rev {q.revision}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Appointments */}
      {appointments.length > 0 && (
        <div className="px-4 py-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Appointments ({appointments.length})
          </h3>
          <div className="space-y-2">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg"
              >
                <div>
                  <p className="text-xs font-medium text-foreground capitalize">
                    {a.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(a.scheduledAt).toLocaleDateString()} -{" "}
                    {a.status}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground font-medium capitalize">
        {value}
      </span>
    </div>
  );
}

// ─── Composer ──────────────────────────────────────────────────────────────────

function Composer({
  conversationId,
  optedOut,
  suppressionActive,
}: {
  conversationId: string;
  optedOut: boolean;
  suppressionActive: boolean;
}) {
  const [text, setText] = useState("");
  const [aiAutoRespond, setAiAutoRespond] = useState(false);

  function handleSend() {
    if (!text.trim()) return;
    addMessage(conversationId, {
      id: `msg-${Date.now()}`,
      conversationId,
      role: "agent",
      content: text.trim(),
      timestamp: new Date().toISOString(),
      channel: "web",
      delivered: true,
      read: false,
      aiGenerated: false,
      requiresApproval: false,
    });
    setText("");
  }

  return (
    <div className="border-t border-border bg-background">
      {/* Opt-out / Suppression warning */}
      {(optedOut || suppressionActive) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <Ban className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-400 font-medium">
            {optedOut
              ? "Customer has opted out of communications."
              : "Messaging is suppressed for this conversation."}
          </span>
        </div>
      )}

      {/* Template Buttons */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5 overflow-x-auto">
        <Button variant="ghost" size="sm" className="h-7 text-[11px] shrink-0">
          <FileText className="w-3 h-3 mr-1" />
          Insert Quote
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-[11px] shrink-0">
          <Car className="w-3 h-3 mr-1" />
          Send Vehicle
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-[11px] shrink-0">
          <CalendarPlus className="w-3 h-3 mr-1" />
          Book Appointment
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-[11px] shrink-0">
          <MailPlus className="w-3 h-3 mr-1" />
          Follow-Up Template
        </Button>
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2 px-4 pb-3 pt-1.5">
        <div className="flex-1 bg-secondary rounded-xl px-4 py-2.5 border border-border focus-within:border-gold/40 transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              optedOut
                ? "Customer opted out"
                : "Type a message..."
            }
            disabled={optedOut}
            rows={1}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none disabled:opacity-50"
          />
        </div>
        <Button
          variant="gold"
          size="sm"
          className="h-10 w-10 p-0 shrink-0"
          onClick={handleSend}
          disabled={!text.trim() || optedOut}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Auto-respond toggle */}
      <div className="flex items-center justify-between px-4 pb-3">
        <button
          onClick={() => setAiAutoRespond(!aiAutoRespond)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {aiAutoRespond ? (
            <ToggleRight className="w-5 h-5 text-gold" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          <span className={aiAutoRespond ? "text-gold font-medium" : ""}>
            AI Auto-respond
          </span>
          {aiAutoRespond && (
            <Sparkles className="w-3 h-3 text-gold" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Conversation Detail ───────────────────────────────────────────────────────

function ConversationDetail({
  conversation,
}: {
  conversation: Conversation;
}) {
  const storeMessages = useMessages(conversation.id);
  // Prefer store messages if available, fall back to conversation.messages
  const messages = storeMessages.length > 0 ? storeMessages : conversation.messages;

  const ChannelIcon = channelIcons[conversation.channel] || MessageSquare;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Escalation banner */}
      {conversation.escalationFlag && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border-b border-red-500/20">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400 font-medium">
            Escalated
            {conversation.escalationReason &&
              ` - ${conversation.escalationReason.replace(/_/g, " ")}`}
          </span>
        </div>
      )}

      {/* Opt-out notice */}
      {conversation.optedOut && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border-b border-yellow-500/20">
          <XCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-yellow-400 font-medium">
            Customer has opted out of automated communications.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center">
            <User className="w-4 h-4 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {conversation.customerName}
              </h2>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                <ChannelIcon className="w-3 h-3" />
                {channelLabels[conversation.channel]}
              </span>
              <StatusBadge
                status={statusBadgeMap[conversation.status]}
                label={conversation.status}
              />
              <span
                className={`w-2 h-2 rounded-full ${sentimentColors[conversation.sentiment]}`}
                title={`Sentiment: ${conversation.sentiment}`}
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {conversation.duration && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {conversation.duration}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                Handler: {conversation.handlerName} ({conversation.currentHandler})
              </span>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              updateConversationStatus(conversation.id, "closed")
            }
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Mark Resolved
          </Button>
          <Button
            variant="gold-outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              updateConversationStatus(conversation.id, "escalated")
            }
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Escalate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            Human Takeover
          </Button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages in this conversation yet.
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
      </div>

      {/* Composer */}
      <Composer
        conversationId={conversation.id}
        optedOut={conversation.optedOut}
        suppressionActive={conversation.suppressionActive}
      />
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
          <MessageCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground">
          Select a conversation
        </h3>
        <p className="text-xs text-muted-foreground max-w-[260px]">
          Choose a thread from the list to view the full conversation, send
          quotes, and manage the deal.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ConversationsPage = () => {
  const conversations = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ⚡ Bolt Performance Optimization: Defer search query
  // Prevents the expensive list filtering from blocking the main thread during rapid typing.
  // Expected impact: Keeps the search input responsive (60fps) even when filtering a large number of conversations.
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [channelFilter, setChannelFilter] = useState("all");

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  // ⚡ Bolt Performance Optimization: Single-pass array filtering
  // Replaced multiple chained `.filter()` calls with a single-pass filter
  // Expected impact: Reduces CPU cycles and memory allocations when filtering a large list of conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    const q = deferredSearchQuery.trim().toLowerCase();

    if (channelFilter !== "all" || q) {
      filtered = conversations.filter((c) => {
        if (channelFilter !== "all") {
          if (channelFilter === "social" && !(c.channel === "facebook" || c.channel === "instagram")) {
            return false;
          } else if (channelFilter !== "social" && c.channel !== channelFilter) {
            return false;
          }
        }

        if (q) {
          const matchesName = c.customerName.toLowerCase().includes(q);
          const matchesSummary = c.summary && c.summary.toLowerCase().includes(q);
          if (!matchesName && !matchesSummary) {
            return false;
          }
        }

        return true;
      });
    }

    // Sort by last message time, most recent first
    return [...filtered].sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );
  }, [conversations, channelFilter, deferredSearchQuery]);

  function handleSelectConversation(id: string) {
    setSelectedConversationId(id);
    setActiveConversation(id);
  }

  return (
    <AppLayout>
      <PageHeader
        title="Conversations"
        subtitle="Unified threads across all channels"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
            <Button variant="gold" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Conversation
            </Button>
          </div>
        }
      />

      <div className="flex h-[calc(100vh-73px)]">
        {/* ── LEFT: Thread List ───────────────────────────────────────────── */}
        <div className="w-[360px] border-r border-border flex flex-col shrink-0 bg-background">
          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center bg-secondary rounded-lg px-3 py-2 border border-border focus-within:border-gold/40 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Channel Tabs */}
          <Tabs
            value={channelFilter}
            onValueChange={setChannelFilter}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="w-full rounded-none border-b border-border bg-transparent px-3 pt-1 justify-start shrink-0">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="phone" className="text-xs">
                Phone
              </TabsTrigger>
              <TabsTrigger value="sms" className="text-xs">
                SMS
              </TabsTrigger>
              <TabsTrigger value="web" className="text-xs">
                Web
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs">
                Social
              </TabsTrigger>
            </TabsList>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No conversations found
                  </p>
                  {searchQuery && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Try a different search term
                    </p>
                  )}
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <ThreadItem
                    key={c.id}
                    conversation={c}
                    isActive={c.id === selectedConversationId}
                    onClick={() => handleSelectConversation(c.id)}
                  />
                ))
              )}
            </div>
          </Tabs>
        </div>

        {/* ── CENTER: Conversation Detail or Empty State ──────────────────── */}
        {selectedConversation ? (
          <>
            <ConversationDetail conversation={selectedConversation} />
            {/* ── RIGHT: Context Panel ─────────────────────────────────────── */}
            <ContextPanel conversation={selectedConversation} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </AppLayout>
  );
};

export default ConversationsPage;
