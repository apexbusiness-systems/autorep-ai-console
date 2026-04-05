import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText, CheckCircle, AlertCircle, Clock, Send,
  Lock, Shield, Eye, ChevronRight, Upload, FileCheck,
  ChevronDown, RefreshCw, XCircle, Package,
} from "lucide-react";
import { useFinancePackets, useAuditEvents, useLeads } from "@/hooks/use-store";
import type { FinancePacket, SupportingDocument } from "@/types/domain";

const FinancePage = () => {
  const packets = useFinancePackets();
  const auditEvents = useAuditEvents();
  const leads = useLeads();
  const [expandedPacket, setExpandedPacket] = useState<string | null>(null);

  const financeAudits = useMemo(() =>
    auditEvents.filter(e => ['consent_captured', 'disclosure_sent', 'finance_submitted', 'document_received', 'packet_routed'].includes(e.action)),
  [auditEvents]);

  const summaryCards = useMemo(() => ({
    active: packets.filter(p => p.status === 'in_progress').length,
    awaitingConsent: packets.filter(p => p.status === 'pending_consent').length,
    ready: packets.filter(p => p.status === 'ready').length,
    submitted: packets.filter(p => p.routingStatus === 'submitted' || p.routingStatus === 'accepted').length,
  }), [packets]);

  const getLeadName = (leadId: string) => leads.find(l => l.id === leadId)?.name || 'Unknown';

  return (
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
        {/* Compliance Banner */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center gap-3">
          <Shield className="w-4 h-4 text-gold flex-shrink-0" />
          <span className="text-xs text-muted-foreground">This system collects and routes finance applications. It does not make lending decisions, perform credit scoring, or approve financing.</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard icon={FileText} label="Active Applications" value={String(summaryCards.active)} />
          <SummaryCard icon={Clock} label="Awaiting Consent" value={String(summaryCards.awaitingConsent)} accent={summaryCards.awaitingConsent > 0} />
          <SummaryCard icon={CheckCircle} label="Ready to Route" value={String(summaryCards.ready)} />
          <SummaryCard icon={Send} label="Submitted to DMS" value={String(summaryCards.submitted)} />
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start px-0">
            <TabsTrigger value="applications" className="text-xs">Applications ({packets.length})</TabsTrigger>
            <TabsTrigger value="routing" className="text-xs">Routing Status</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-4 space-y-4">
            {packets.map((packet) => (
              <PacketCard
                key={packet.id}
                packet={packet}
                customerName={getLeadName(packet.leadId)}
                expanded={expandedPacket === packet.id}
                onToggle={() => setExpandedPacket(expandedPacket === packet.id ? null : packet.id)}
              />
            ))}
          </TabsContent>

          <TabsContent value="routing" className="mt-4 space-y-4">
            {packets.map((packet) => (
              <div key={packet.id} className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gold" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{getLeadName(packet.leadId)}</p>
                      <p className="text-xs text-muted-foreground">Packet {packet.id}</p>
                    </div>
                  </div>
                  <StatusBadge
                    status={packet.routingStatus === 'submitted' ? 'active' : packet.routingStatus === 'accepted' ? 'connected' : packet.routingStatus === 'error' ? 'error' : packet.routingStatus === 'rejected' ? 'error' : 'idle'}
                    label={packet.routingStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Target</span>
                    <p className="text-xs text-foreground mt-0.5">{packet.routingTarget || 'Not selected'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Submitted</span>
                    <p className="text-xs text-foreground mt-0.5">{packet.routedAt ? new Date(packet.routedAt).toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Completion</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${packet.completionPercentage}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{packet.completionPercentage}%</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-end gap-2">
                    {packet.status === 'ready' && packet.routingStatus === 'not_started' && (
                      <Button variant="gold" size="sm" className="text-xs"><Send className="w-3 h-3 mr-1" /> Submit to DMS</Button>
                    )}
                    {packet.routingStatus === 'error' && (
                      <Button variant="gold-outline" size="sm" className="text-xs"><RefreshCw className="w-3 h-3 mr-1" /> Retry</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <div className="rounded-lg bg-card border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" /> Audit Trail
              </h3>
              <div className="space-y-3">
                {financeAudits.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-gold/50 mt-1.5" />
                      {i < financeAudits.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs text-foreground">{entry.details}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{new Date(entry.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={`text-[10px] ${entry.performedBy === 'AI Agent' ? 'text-gold' : entry.performedBy === 'System' ? 'text-muted-foreground' : 'text-blue-400'}`}>{entry.performedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                <Eye className="w-3 h-3" /> No autonomous credit decisions are made by this system.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

const PacketCard = ({ packet, customerName, expanded, onToggle }: {
  packet: FinancePacket; customerName: string; expanded: boolean; onToggle: () => void;
}) => {
  const statusMap: Record<string, 'active' | 'pending' | 'idle' | 'connected'> = {
    in_progress: 'pending', ready: 'active', pending_consent: 'idle', submitted: 'connected', approved: 'connected',
  };

  const docsReceived = packet.documents.filter(d => d.status === 'received').length;
  const docsTotal = packet.documents.length;

  return (
    <div className="rounded-lg bg-card border border-border hover:border-gold/20 transition-colors">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{customerName}</h3>
              <span className="text-xs text-muted-foreground">{new Date(packet.updatedAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={statusMap[packet.status] || 'idle'} label={packet.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
            <button onClick={onToggle} className="p-1 rounded hover:bg-secondary/50 transition-colors">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Consent</span>
            <div className="space-y-0.5">
              {packet.consentRecords.length > 0 ? packet.consentRecords.map(cr => (
                <div key={cr.id} className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-400">{cr.type.replace(/_/g, ' ')}</span>
                </div>
              )) : (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Pending</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Documents</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full" style={{ width: `${(docsReceived / docsTotal) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{docsReceived}/{docsTotal}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Routing</span>
            <p className="text-xs text-foreground">{packet.routingTarget ? `${packet.routingStatus.replace(/_/g, ' ')} — ${packet.routingTarget}` : packet.routingStatus.replace(/_/g, ' ')}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Blockers</span>
            {packet.blockers.length === 0 ? (
              <span className="text-xs text-green-400">None</span>
            ) : (
              <div className="space-y-0.5">
                {packet.blockers.map((b, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-[10px] text-red-400">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-border p-5 space-y-5">
          <div className="grid grid-cols-2 gap-6">
            {/* Document Checklist */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-gold" /> Document Checklist
              </h4>
              <div className="space-y-2">
                {packet.documents.map((doc) => (
                  <DocRow key={doc.id} doc={doc} />
                ))}
              </div>
            </div>

            {/* Consent & Disclosures */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" /> Consent & Disclosures
              </h4>
              <div className="space-y-2">
                {['credit_check', 'data_sharing', 'electronic_signature', 'marketing'].map(type => {
                  const record = packet.consentRecords.find(cr => cr.type === type);
                  return (
                    <div key={type} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-xs text-foreground capitalize">{type.replace(/_/g, ' ')}</span>
                      {record?.granted ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-400"><CheckCircle className="w-3 h-3" /> Signed</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-400"><Clock className="w-3 h-3" /> Pending</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 space-y-2">
                <h5 className="text-[11px] font-semibold text-muted-foreground uppercase">Disclosures Sent</h5>
                {packet.disclosureRecords.length > 0 ? packet.disclosureRecords.map(dr => (
                  <div key={dr.id} className="flex items-center justify-between py-1">
                    <span className="text-[10px] text-foreground capitalize">{dr.type.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{dr.channel}</span>
                      {dr.acknowledgedAt ? (
                        <span className="text-[10px] text-green-400">Acknowledged</span>
                      ) : (
                        <span className="text-[10px] text-yellow-400">Sent</span>
                      )}
                    </div>
                  </div>
                )) : (
                  <span className="text-[10px] text-muted-foreground">No disclosures sent yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocRow = ({ doc }: { doc: SupportingDocument }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <span className="text-sm text-foreground">{doc.label}</span>
    {doc.status === 'received' ? (
      <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3.5 h-3.5" /> Received</span>
    ) : doc.status === 'pending' ? (
      <span className="flex items-center gap-1 text-xs text-yellow-400"><Clock className="w-3.5 h-3.5" /> Pending</span>
    ) : doc.status === 'rejected' ? (
      <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
    ) : (
      <Button variant="gold-outline" size="sm" className="text-xs"><Upload className="w-3 h-3 mr-1" /> Request</Button>
    )}
  </div>
);

const SummaryCard = ({ icon: Icon, label, value, accent }: { icon: typeof FileText; label: string; value: string; accent?: boolean }) => (
  <div className={`p-4 rounded-lg border ${accent ? 'bg-gold/5 border-gold/20' : 'bg-card border-border'}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${accent ? 'text-gold' : 'text-muted-foreground'}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${accent ? 'text-gold' : 'text-foreground'}`}>{value}</p>
  </div>
);

export default FinancePage;
