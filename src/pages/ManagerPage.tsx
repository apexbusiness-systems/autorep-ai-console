import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Shield, Eye, HandMetal, MessageSquare, AlertTriangle,
  BarChart3, Users, Clock, Bot, PhoneOff
} from "lucide-react";

const liveConversations = [
  { id: 1, customer: "Sarah Mitchell", agent: "AI", channel: "Phone", stage: "Quote", duration: "8:32", sentiment: "Positive", handoffRequested: false },
  { id: 2, customer: "James Cooper", agent: "AI", channel: "SMS", stage: "Interest", duration: "3:15", sentiment: "Neutral", handoffRequested: false },
  { id: 3, customer: "David Chen", agent: "AI", channel: "Instagram", stage: "First Contact", duration: "1:45", sentiment: "Neutral", handoffRequested: false },
  { id: 4, customer: "Amanda Torres", agent: "AI", channel: "Phone", stage: "Objection", duration: "12:08", sentiment: "Frustrated", handoffRequested: true },
];

const recentHandoffs = [
  { customer: "Tom Bradley", reason: "Customer requested human agent", handedTo: "Mike R.", time: "35 min ago" },
  { customer: "Karen Lee", reason: "Complex trade-in negotiation", handedTo: "Sarah K.", time: "2 hr ago" },
];

const ManagerPage = () => (
  <AppLayout>
    <PageHeader
      title="Manager Supervision"
      subtitle="Monitor AI conversations, review sentiment, and manage handoffs"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><BarChart3 className="w-4 h-4 mr-1" /> Reports</Button>
        </div>
      }
    />
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard icon={Bot} label="Active AI Conversations" value="4" />
        <SummaryCard icon={Users} label="Human-Handled" value="2" />
        <SummaryCard icon={HandMetal} label="Handoff Requests" value="1" accent />
        <SummaryCard icon={Clock} label="Avg Response Time" value="1.2s" />
      </div>

      {/* Live Conversation Monitor */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 bg-secondary/30 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-gold" /> Live Conversation Monitor
          </h3>
          <span className="text-xs text-muted-foreground">Auto-refreshing</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/20 border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Customer</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Handler</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Channel</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Stage</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Duration</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Sentiment</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {liveConversations.map((c) => (
              <tr key={c.id} className={`border-b border-border transition-colors ${c.handoffRequested ? "bg-red-500/5" : "hover:bg-secondary/20"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.customer}</span>
                    {c.handoffRequested && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status="active" label={c.agent} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.channel}</td>
                <td className="px-4 py-3 text-xs text-foreground">{c.stage}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.duration}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${
                    c.sentiment === "Positive" ? "text-green-400" :
                    c.sentiment === "Frustrated" ? "text-red-400" : "text-muted-foreground"
                  }`}>{c.sentiment}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs"><Eye className="w-3 h-3 mr-1" /> Listen</Button>
                    <Button variant={c.handoffRequested ? "gold" : "secondary"} size="sm" className="text-xs">
                      <HandMetal className="w-3 h-3 mr-1" /> {c.handoffRequested ? "Take Over" : "Handoff"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Handoff Alert */}
      <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-gold mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-foreground">Handoff Requested — Amanda Torres</h4>
            <p className="text-xs text-muted-foreground mt-1">Customer showing frustration during phone call. AI detected objection pattern. Duration: 12:08. Recommended action: assign to experienced closer.</p>
            <div className="flex gap-2 mt-3">
              <Button variant="gold" size="sm" className="text-xs">Assign to Mike R.</Button>
              <Button variant="secondary" size="sm" className="text-xs">Assign to Other</Button>
              <Button variant="ghost" size="sm" className="text-xs"><MessageSquare className="w-3 h-3 mr-1" /> View Transcript</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Handoffs */}
      <div className="rounded-lg bg-card border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Handoffs</h3>
        <div className="space-y-3">
          {recentHandoffs.map((h, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm text-foreground">{h.customer}</p>
                <p className="text-xs text-muted-foreground">{h.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-foreground">→ {h.handedTo}</p>
                <p className="text-[10px] text-muted-foreground">{h.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </AppLayout>
);

const SummaryCard = ({ icon: Icon, label, value, accent }: { icon: typeof Bot; label: string; value: string; accent?: boolean }) => (
  <div className={`p-4 rounded-lg border ${accent ? "bg-gold/5 border-gold/20" : "bg-card border-border"}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${accent ? "text-gold" : "text-muted-foreground"}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${accent ? "text-gold" : "text-foreground"}`}>{value}</p>
  </div>
);

export default ManagerPage;
