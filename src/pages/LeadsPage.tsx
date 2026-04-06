import { useCallback, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Filter, UserPlus, MoreHorizontal, Phone,
  MessageSquare, Globe, AlertCircle, RefreshCw, Copy,
  Users, Flame, Clock, ArchiveRestore, CheckCircle2,
  Mail, Calendar, PhoneCall, Ban, ChevronRight,
  MessageCircle, Instagram, Facebook,
} from "lucide-react";
import {
  useLeads,
  useFollowUpTasks,
  updateLeadStage,
  markFollowUpComplete,
  setActiveLead,
} from "@/hooks/use-store";
import type { Lead, FollowUpTask, LeadSource, LeadStage, Channel } from "@/types/domain";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<LeadSource, string> = {
  google_ads: "Google Ads",
  facebook: "Facebook",
  instagram: "Instagram",
  website: "Website",
  walk_in: "Walk-In",
  referral: "Referral",
  phone: "Phone",
  email: "Email",
  other: "Other",
};

const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  first_contact: "First Contact",
  vehicle_interest: "Vehicle Interest",
  quote_sent: "Quote Sent",
  appointment_set: "Appointment Set",
  finance_intake: "Finance Intake",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  stale: "Stale",
};

const STAGE_STYLES: Record<LeadStage, string> = {
  new: "text-blue-400",
  first_contact: "text-sky-400",
  vehicle_interest: "text-cyan-400",
  quote_sent: "text-amber-400",
  appointment_set: "text-emerald-400",
  finance_intake: "text-violet-400",
  negotiation: "text-orange-400",
  closed_won: "text-green-400",
  closed_lost: "text-red-400/60",
  stale: "text-slate-500",
};

const TASK_TYPE_LABELS: Record<FollowUpTask["type"], string> = {
  follow_up: "Follow-Up",
  callback: "Callback",
  quote_follow_up: "Quote Follow-Up",
  appointment_reminder: "Appt. Reminder",
  reactivation: "Reactivation",
  document_request: "Doc Request",
};

const CHANNEL_ICONS: Record<Channel, typeof Phone> = {
  phone: PhoneCall,
  sms: MessageSquare,
  web: Globe,
  facebook: Facebook,
  instagram: Instagram,
  email: Mail,
};

function formatRelativeDate(iso: string): { label: string; isOverdue: boolean } {
  const target = new Date(iso);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(diffHours);
    if (absDays >= 1) return { label: `Overdue ${absDays}d`, isOverdue: true };
    if (absHours >= 1) return { label: `Overdue ${absHours}h`, isOverdue: true };
    return { label: "Overdue", isOverdue: true };
  }

  if (diffDays === 0) {
    if (diffHours < 1) return { label: `In ${Math.max(1, diffMins)}m`, isOverdue: false };
    return { label: `Today, ${target.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`, isOverdue: false };
  }
  if (diffDays === 1) return { label: "Tomorrow", isOverdue: false };
  return { label: `In ${diffDays} days`, isOverdue: false };
}

function daysInactive(lastActivity: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(lastActivity).getTime()) / 86400000));
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-lg border px-5 py-4 transition-colors ${
        accent
          ? "border-gold/25 bg-gold/5"
          : "border-border bg-secondary/30"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          accent ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold tracking-tight ${accent ? "text-gold" : "text-foreground"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Leads Table ──────────────────────────────────────────────────────────────

function LeadsTable({ leads, onSelectLead }: { leads: Lead[]; onSelectLead: (id: string) => void }) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Users className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No leads match this filter.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-secondary/50 border-b border-border">
            {["Lead", "Source", "Stage", "Priority", "Follow-Up", "Assigned", "CRM Sync", ""].map((h) => (
              <th
                key={h || "actions"}
                className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const followUp = lead.nextFollowUp
              ? formatRelativeDate(lead.nextFollowUp)
              : lead.followUpOverdue
              ? { label: "Overdue", isOverdue: true }
              : { label: "---", isOverdue: false };

            const crmStatus =
              lead.crmSyncStatus === "synced"
                ? "connected"
                : lead.crmSyncStatus === "pending"
                ? "pending"
                : "disconnected";

            const crmLabel =
              lead.crmSyncStatus === "synced"
                ? "Synced"
                : lead.crmSyncStatus === "pending"
                ? "Pending"
                : lead.crmSyncStatus === "not_synced"
                ? "Not synced"
                : lead.crmSyncStatus === "error"
                ? "Error"
                : "Stale";

            return (
              <tr
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{lead.name}</span>
                    {lead.isDuplicate && (
                      <span className="inline-flex items-center gap-1 rounded bg-yellow-500/15 border border-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                        <Copy className="w-3 h-3" /> Dup?
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{lead.phone}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${STAGE_STYLES[lead.stage]}`}>
                    {STAGE_LABELS[lead.stage] ?? lead.stage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.priority} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs ${
                      followUp.isOverdue ? "text-red-400 font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {followUp.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {lead.assignedTo || "Unassigned"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={crmStatus} label={crmLabel} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Follow-Up Queue ──────────────────────────────────────────────────────────

function FollowUpQueue({ tasks }: { tasks: FollowUpTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No follow-up tasks in queue.</p>
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    const statusOrder = { overdue: 0, due: 1, scheduled: 2, completed: 3, cancelled: 4, suppressed: 5 };
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
  });

  return (
    <div className="space-y-2">
      {sorted.map((task) => {
        const isOverdue = task.status === "overdue";
        const isDue = task.status === "due";
        const isComplete = task.status === "completed";
        const ChannelIcon = CHANNEL_ICONS[task.channel] ?? MessageSquare;
        const scheduled = formatRelativeDate(task.scheduledFor);

        return (
          <div
            key={task.id}
            className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${
              isOverdue
                ? "border-red-500/25 bg-red-500/5"
                : isDue
                ? "border-amber-500/20 bg-amber-500/5"
                : isComplete
                ? "border-border bg-secondary/20 opacity-60"
                : "border-border bg-secondary/30 hover:bg-secondary/40"
            }`}
          >
            {/* Channel icon */}
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isOverdue ? "bg-red-500/15 text-red-400" : "bg-secondary text-muted-foreground"
              }`}
            >
              <ChannelIcon className="h-4 w-4" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {task.customerName}
                </span>
                <span className="shrink-0 text-[10px] font-medium rounded bg-secondary border border-border px-1.5 py-0.5 text-muted-foreground">
                  {TASK_TYPE_LABELS[task.type]}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span
                  className={`text-xs ${
                    isOverdue ? "text-red-400 font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {scheduled.label}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{task.channel}</span>
                <span className="text-xs text-muted-foreground">
                  {task.assignedTo || "Unassigned"}
                </span>
              </div>
            </div>

            {/* Priority */}
            <StatusBadge status={task.priority} />

            {/* Status */}
            <StatusBadge
              status={
                isOverdue
                  ? "error"
                  : isDue
                  ? "pending"
                  : isComplete
                  ? "active"
                  : "idle"
              }
              label={task.status}
            />

            {/* Action */}
            {!isComplete && task.status !== "cancelled" && task.status !== "suppressed" && (
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => markFollowUpComplete(task.id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Complete
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stale Lead Reactivation ──────────────────────────────────────────────────

function StaleReactivationSection({ leads }: { leads: Lead[] }) {
  const [suppressedIds, setSuppressedIds] = useState<Set<string>>(new Set());

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ArchiveRestore className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No stale leads require reactivation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gold/20 bg-gold/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-gold shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {leads.length} Stale Lead{leads.length !== 1 ? "s" : ""} Ready for Reactivation
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI can automatically send personalized follow-up outreach to re-engage these leads.
            </p>
          </div>
        </div>
      </div>

      {leads.map((lead) => {
        const inactive = daysInactive(lead.lastActivityAt);
        const isSuppressed = suppressedIds.has(lead.id);

        return (
          <div
            key={lead.id}
            className={`flex items-center gap-4 rounded-lg border px-4 py-3.5 transition-colors ${
              isSuppressed
                ? "border-border bg-secondary/10 opacity-50"
                : "border-border bg-secondary/30 hover:bg-secondary/40"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{lead.name}</span>
                <span className="text-[10px] rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-red-400 font-medium">
                  {inactive}d inactive
                </span>
                {lead.isDuplicate && (
                  <span className="inline-flex items-center gap-1 rounded bg-yellow-500/15 border border-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                    <Copy className="w-3 h-3" /> Dup?
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground">{lead.phone}</span>
                <span className="text-xs text-muted-foreground">
                  {SOURCE_LABELS[lead.source]}
                </span>
                <span className="text-xs text-muted-foreground">
                  Last: {new Date(lead.lastActivityAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Suppress / Allow toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs shrink-0 ${isSuppressed ? "text-red-400" : "text-muted-foreground"}`}
              onClick={() =>
                setSuppressedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(lead.id)) next.delete(lead.id);
                  else next.add(lead.id);
                  return next;
                })
              }
            >
              <Ban className="h-3.5 w-3.5 mr-1" />
              {isSuppressed ? "Suppressed" : "Suppress"}
            </Button>

            {/* Reactivate */}
            <Button
              variant="gold-outline"
              size="sm"
              className="shrink-0 text-xs"
              disabled={isSuppressed}
              onClick={() => updateLeadStage(lead.id, "first_contact")}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reactivate
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Proactive Outreach Queue ─────────────────────────────────────────────────

function ProactiveOutreachQueue({ tasks }: { tasks: FollowUpTask[] }) {
  const grouped = useMemo(() => {
    const callbacks = tasks.filter((t) => t.type === "callback");
    const quotes = tasks.filter((t) => t.type === "quote_follow_up");
    const appointments = tasks.filter((t) => t.type === "appointment_reminder");
    const other = tasks.filter(
      (t) => !["callback", "quote_follow_up", "appointment_reminder"].includes(t.type)
    );
    return { callbacks, quotes, appointments, other };
  }, [tasks]);

  const sections = [
    { title: "Scheduled Callbacks", icon: PhoneCall, items: grouped.callbacks },
    { title: "Quote Follow-Ups", icon: MessageCircle, items: grouped.quotes },
    { title: "Appointment Reminders", icon: Calendar, items: grouped.appointments },
    { title: "Other Outreach", icon: Mail, items: grouped.other },
  ];

  const nonEmpty = sections.filter((s) => s.items.length > 0);

  if (nonEmpty.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No proactive outreach items scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {nonEmpty.map(({ title, icon: Icon, items }) => (
        <div key={title}>
          <div className="flex items-center gap-2 mb-3">
            <Icon className="h-4 w-4 text-gold" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </h4>
            <span className="text-[10px] bg-secondary border border-border rounded-full px-2 py-0.5 text-muted-foreground">
              {items.length}
            </span>
          </div>
          <div className="space-y-2">
            {items.map((task) => {
              const scheduled = formatRelativeDate(task.scheduledFor);
              const isOverdue = task.status === "overdue";
              const ChannelIcon = CHANNEL_ICONS[task.channel] ?? MessageSquare;

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    isOverdue
                      ? "border-red-500/25 bg-red-500/5"
                      : "border-border bg-secondary/30"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-secondary text-muted-foreground">
                    <ChannelIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">
                      {task.customerName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {task.assignedTo || "AI Agent"}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      isOverdue ? "text-red-400 font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {scheduled.label}
                  </span>
                  <span className="text-[10px] capitalize bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                    {task.channel}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => markFollowUpComplete(task.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LeadsPage = () => {
  const leads = useLeads();
  const followUpTasks = useFollowUpTasks();
  const [searchQuery, setSearchQuery] = useState("");

  // Derived counts & filters
  const hotLeads = useMemo(() => leads.filter((l) => l.priority === "hot"), [leads]);
  const staleLeads = useMemo(() => leads.filter((l) => l.stage === "stale"), [leads]);
  const followUpsDue = useMemo(
    () => followUpTasks.filter((t) => t.status === "overdue" || t.status === "due"),
    [followUpTasks]
  );

  const activeTasks = useMemo(
    () => followUpTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled"),
    [followUpTasks]
  );

  const reactivationTasks = useMemo(
    () => followUpTasks.filter((t) => t.type === "reactivation" && t.status !== "completed" && t.status !== "cancelled"),
    [followUpTasks]
  );

  const proactiveTasks = useMemo(
    () =>
      followUpTasks.filter(
        (t) =>
          ["callback", "quote_follow_up", "appointment_reminder"].includes(t.type) &&
          t.status !== "completed" &&
          t.status !== "cancelled"
      ),
    [followUpTasks]
  );

  // Search filtering
  // ⚡ Bolt Performance Optimization: Memoized array filter operations
  // Prevents running search filter multiple times on every render (e.g., when switching tabs)
  // Expected impact: Eliminates O(N) recalculations on unrelated state changes
  const filterBySearch = useCallback(
    (list: Lead[]) => {
      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (SOURCE_LABELS[l.source] ?? l.source).toLowerCase().includes(q)
      );
    },
    [searchQuery]
  );

  const filteredAll = useMemo(() => filterBySearch(leads), [filterBySearch, leads]);
  const filteredHot = useMemo(() => filterBySearch(hotLeads), [filterBySearch, hotLeads]);
  const filteredStale = useMemo(() => filterBySearch(staleLeads), [filterBySearch, staleLeads]);

  const handleSelectLead = (id: string) => {
    setActiveLead(id);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Leads & Follow-Up"
        subtitle="Lead inbox, prioritization, and follow-up queue"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-1" /> Filter
            </Button>
            <Button variant="gold" size="sm">
              <UserPlus className="w-4 h-4 mr-1" /> Add Lead
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* ── Summary Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={Users} label="Total Leads" value={leads.length} />
          <SummaryCard icon={Flame} label="Hot Leads" value={hotLeads.length} accent />
          <SummaryCard icon={Clock} label="Follow-Ups Due" value={followUpsDue.length} />
          <SummaryCard icon={ArchiveRestore} label="Stale Leads" value={staleLeads.length} />
        </div>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-secondary rounded-lg px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              placeholder="Search leads by name, phone, source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <Tabs defaultValue="all">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start px-0">
            <TabsTrigger value="all" className="text-xs">
              All Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="hot" className="text-xs">
              Hot ({hotLeads.length})
            </TabsTrigger>
            <TabsTrigger value="followup" className="text-xs">
              Follow-Up Due ({followUpsDue.length})
            </TabsTrigger>
            <TabsTrigger value="stale" className="text-xs">
              Stale ({staleLeads.length})
            </TabsTrigger>
            <TabsTrigger value="reactivation" className="text-xs">
              Reactivation Queue ({reactivationTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* ── All Leads ─────────────────────────────────────────────── */}
          <TabsContent value="all" className="mt-4">
            <LeadsTable leads={filteredAll} onSelectLead={handleSelectLead} />
          </TabsContent>

          {/* ── Hot Leads ─────────────────────────────────────────────── */}
          <TabsContent value="hot" className="mt-4">
            <LeadsTable leads={filteredHot} onSelectLead={handleSelectLead} />
          </TabsContent>

          {/* ── Follow-Up Due ─────────────────────────────────────────── */}
          <TabsContent value="followup" className="mt-4">
            <FollowUpQueue tasks={followUpsDue} />
          </TabsContent>

          {/* ── Stale Leads ───────────────────────────────────────────── */}
          <TabsContent value="stale" className="mt-4">
            <StaleReactivationSection leads={filteredStale} />
          </TabsContent>

          {/* ── Reactivation Queue ────────────────────────────────────── */}
          <TabsContent value="reactivation" className="mt-4">
            <div className="space-y-6">
              <StaleReactivationSection leads={staleLeads} />
              {reactivationTasks.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-gold" />
                      Scheduled Reactivation Outreach
                    </h3>
                    <FollowUpQueue tasks={reactivationTasks} />
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Proactive Outreach Queue ──────────────────────────────────── */}
        {proactiveTasks.length > 0 && (
          <div className="rounded-lg border border-border bg-secondary/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gold" />
                <h3 className="text-sm font-semibold text-foreground">Proactive Outreach Queue</h3>
                <span className="text-[10px] bg-gold/15 text-gold border border-gold/20 rounded-full px-2 py-0.5 font-medium">
                  {proactiveTasks.length} pending
                </span>
              </div>
            </div>
            <ProactiveOutreachQueue tasks={proactiveTasks} />
          </div>
        )}

        {/* ── Stale Lead Reactivation Banner (always visible if stale leads exist) ── */}
        {staleLeads.length > 0 && (
          <div className="rounded-lg border border-gold/20 bg-gold/5 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-gold shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {staleLeads.length} Stale Lead{staleLeads.length !== 1 ? "s" : ""} Ready for
                    Reactivation
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI can send personalized follow-up outreach to re-engage dormant leads.
                  </p>
                </div>
              </div>
              <Button variant="gold-outline" size="sm">
                <ChevronRight className="h-3.5 w-3.5 mr-1" />
                View Queue
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default LeadsPage;
