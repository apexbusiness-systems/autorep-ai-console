import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  FileText, CheckCircle, AlertCircle, Clock, Send,
  Lock, Shield, Eye, ChevronRight, Upload, FileCheck
} from "lucide-react";

const applications = [
  {
    id: 1, customer: "Sarah Mitchell", status: "In Progress" as const, consent: true,
    docs: { completed: 3, total: 5 }, routing: "Not submitted", blockers: ["Missing proof of income", "Missing insurance"],
    lastUpdate: "5 min ago"
  },
  {
    id: 2, customer: "Jennifer Wu", status: "Ready" as const, consent: true,
    docs: { completed: 5, total: 5 }, routing: "Submitted to Dealertrack", blockers: [],
    lastUpdate: "1 hr ago"
  },
  {
    id: 3, customer: "James Cooper", status: "Pending Consent" as const, consent: false,
    docs: { completed: 0, total: 5 }, routing: "Not started", blockers: ["Awaiting customer consent"],
    lastUpdate: "2 hr ago"
  },
];

const docChecklist = [
  { name: "Driver's License", status: "received" },
  { name: "Proof of Income", status: "missing" },
  { name: "Proof of Residence", status: "received" },
  { name: "Insurance Card", status: "missing" },
  { name: "Credit Application", status: "received" },
];

const auditTrail = [
  { time: "2:45 PM", action: "Credit application submitted by customer via secure link", user: "System" },
  { time: "2:40 PM", action: "Consent form signed electronically", user: "Sarah Mitchell" },
  { time: "2:35 PM", action: "Finance intake initiated by AI agent", user: "AI Agent" },
  { time: "2:30 PM", action: "Quote Q-1001 accepted by customer", user: "Sarah Mitchell" },
];

const FinancePage = () => (
  <AppLayout>
    <PageHeader
      title="Finance Intake & Routing"
      subtitle="Secure document collection, packet assembly, and DMS routing"
      actions={
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gold" />
          <span className="text-xs text-muted-foreground">End-to-end encrypted</span>
        </div>
      }
    />
    <div className="p-6 space-y-6">
      {/* Application Cards */}
      <div className="grid gap-4">
        {applications.map((app) => (
          <div key={app.id} className="p-5 rounded-lg bg-card border border-border hover:border-gold/20 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{app.customer}</h3>
                  <span className="text-xs text-muted-foreground">{app.lastUpdate}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={app.status === "Ready" ? "active" : app.status === "In Progress" ? "pending" : "idle"}
                  label={app.status}
                />
                <Button variant="ghost" size="sm" className="text-xs">
                  View <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* Consent */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Consent</span>
                <div className="flex items-center gap-1.5">
                  {app.consent ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Signed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-yellow-400">Pending</span>
                    </>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Documents</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${(app.docs.completed / app.docs.total) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{app.docs.completed}/{app.docs.total}</span>
                </div>
              </div>

              {/* Routing */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Routing</span>
                <p className="text-xs text-foreground">{app.routing}</p>
              </div>

              {/* Blockers */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Blockers</span>
                {app.blockers.length === 0 ? (
                  <span className="text-xs text-green-400">None</span>
                ) : (
                  <div className="space-y-0.5">
                    {app.blockers.map((b, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span className="text-xs text-red-400">{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Checklist and Audit Trail side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Doc Checklist */}
        <div className="rounded-lg bg-card border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-gold" /> Document Checklist — Sarah Mitchell
          </h3>
          <div className="space-y-2">
            {docChecklist.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{doc.name}</span>
                {doc.status === "received" ? (
                  <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3.5 h-3.5" /> Received</span>
                ) : (
                  <Button variant="gold-outline" size="sm" className="text-xs"><Upload className="w-3 h-3 mr-1" /> Request</Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="rounded-lg bg-card border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold" /> Audit Trail
          </h3>
          <div className="space-y-3">
            {auditTrail.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-gold/50 mt-1.5" />
                  {i < auditTrail.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-xs text-foreground">{entry.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                    <span className="text-[10px] text-gold">{entry.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
            <Eye className="w-3 h-3" /> No autonomous credit decisions are made by the AI agent.
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
);

export default FinancePage;
