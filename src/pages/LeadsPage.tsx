import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Filter, UserPlus, MoreHorizontal, Phone,
  MessageSquare, Globe, AlertCircle, RefreshCw, Copy
} from "lucide-react";

const leads = [
  { id: 1, name: "Sarah Mitchell", source: "Google Ads", phone: "(555) 234-8901", stage: "Quote Sent", priority: "hot" as const, followUp: "Today, 4:00 PM", assigned: "AI Agent", crm: "Synced", duplicate: false },
  { id: 2, name: "James Cooper", source: "Website", phone: "(555) 876-5432", stage: "First Contact", priority: "warm" as const, followUp: "Today, 5:30 PM", assigned: "AI Agent", crm: "Synced", duplicate: false },
  { id: 3, name: "Maria Santos", source: "Facebook", phone: "(555) 345-6789", stage: "Vehicle Interest", priority: "new" as const, followUp: "Tomorrow", assigned: "Unassigned", crm: "Pending", duplicate: false },
  { id: 4, name: "David Chen", source: "Instagram", phone: "(555) 901-2345", stage: "First Contact", priority: "warm" as const, followUp: "Tomorrow", assigned: "AI Agent", crm: "Synced", duplicate: false },
  { id: 5, name: "Tom Bradley", source: "Walk-in Ref", phone: "(555) 567-8901", stage: "Stale", priority: "cold" as const, followUp: "Overdue 3d", assigned: "Unassigned", crm: "Not synced", duplicate: true },
  { id: 6, name: "Jennifer Wu", source: "Google Ads", phone: "(555) 432-1098", stage: "Appointment Set", priority: "hot" as const, followUp: "Today, 2:00 PM", assigned: "Mike R.", crm: "Synced", duplicate: false },
];

const LeadsPage = () => (
  <AppLayout>
    <PageHeader
      title="Leads & Follow-Up"
      subtitle="Lead inbox, prioritization, and follow-up queue"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
          <Button variant="gold" size="sm"><UserPlus className="w-4 h-4 mr-1" /> Add Lead</Button>
        </div>
      }
    />
    <div className="p-6 space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center bg-secondary rounded-lg px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" placeholder="Search leads by name, phone, source…" />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start px-0">
          <TabsTrigger value="all" className="text-xs">All Leads (6)</TabsTrigger>
          <TabsTrigger value="hot" className="text-xs">Hot (2)</TabsTrigger>
          <TabsTrigger value="followup" className="text-xs">Follow-Up Due (3)</TabsTrigger>
          <TabsTrigger value="stale" className="text-xs">Stale (1)</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Lead</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Source</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Stage</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Priority</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Follow-Up</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Assigned</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">CRM</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{lead.name}</span>
                        {lead.duplicate && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-yellow-400">
                            <Copy className="w-3 h-3" /> Dup?
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{lead.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{lead.source}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{lead.stage}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.priority} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${lead.followUp.includes("Overdue") ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
                        {lead.followUp}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{lead.assigned}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.crm === "Synced" ? "connected" : lead.crm === "Pending" ? "pending" : "disconnected"} label={lead.crm} />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Stale Lead Reactivation */}
      <div className="p-4 rounded-lg bg-gold/5 border border-gold/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-gold" />
            <div>
              <h4 className="text-sm font-medium text-foreground">1 Stale Lead Ready for Reactivation</h4>
              <p className="text-xs text-muted-foreground">Tom Bradley hasn't responded in 3 days. AI can send a follow-up.</p>
            </div>
          </div>
          <Button variant="gold-outline" size="sm">Reactivate</Button>
        </div>
      </div>
    </div>
  </AppLayout>
);

export default LeadsPage;
