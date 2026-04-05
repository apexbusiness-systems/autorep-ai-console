import { useState, useMemo } from "react";
import { getVehicleImage } from "@/data/vehicle-images";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone, MessageSquare, Globe, Instagram, Send,
  User, Car, Calendar, ArrowRight, ChevronRight,
  Mic, FileText, HandMetal, AlertTriangle, Facebook,
  Shield, CheckCircle, Clock,
} from "lucide-react";
import {
  useConversations, useMessages, useVehicles, useStore,
  setActiveConversation, addMessage, useLeads, useQuotes,
} from "@/hooks/use-store";
import type { Message, Channel } from "@/types/domain";

const channelIcons: Record<Channel, typeof Phone> = {
  phone: Phone, sms: MessageSquare, web: Globe,
  instagram: Instagram, facebook: Facebook, email: MessageSquare,
};

const priorityMap = (stage: string) => {
  if (stage === 'negotiation' || stage === 'quote_sent') return 'hot' as const;
  if (stage === 'vehicle_interest' || stage === 'first_contact') return 'warm' as const;
  if (stage === 'stale') return 'cold' as const;
  return 'new' as const;
};

const timeAgo = (ts: string) => {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 1) return 'now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const objections = [
  { trigger: 'Price too high', response: 'Acknowledge the concern, then reframe around total value of ownership, included features, and warranty coverage. Offer a payment-focused comparison.' },
  { trigger: 'Need to think about it', response: "Respect the timeline. Offer to send a summary with all options. Suggest a specific callback time to maintain momentum." },
  { trigger: 'Found it cheaper elsewhere', response: "Ask for specifics to verify it's an apples-to-apples comparison. Highlight your dealer's service, warranty, and proximity advantages." },
];

const LiveAgentConsole = () => {
  const conversations = useConversations();
  const activeConvId = useStore(s => s.activeConversationId);
  const messages = useMessages(activeConvId);
  const vehicles = useVehicles();
  const leads = useLeads();
  const quotes = useQuotes();
  const [inputValue, setInputValue] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const activeConv = useMemo(() =>
    conversations.find(c => c.id === activeConvId) || null,
  [conversations, activeConvId]);

  const activeLead = useMemo(() =>
    activeConv ? leads.find(l => l.id === activeConv.leadId) : null,
  [activeConv, leads]);

  const activeQuotes = useMemo(() =>
    activeLead ? quotes.filter(q => q.leadId === activeLead.id) : [],
  [activeLead, quotes]);

  const filteredConversations = useMemo(() => {
    if (channelFilter === 'all') return conversations;
    if (channelFilter === 'social') return conversations.filter(c => c.channel === 'facebook' || c.channel === 'instagram');
    return conversations.filter(c => c.channel === channelFilter);
  }, [conversations, channelFilter]);

  const matchedVehicles = useMemo(() =>
    vehicles.filter(v => v.status === 'available').slice(0, 3),
  [vehicles]);

  const handleSend = () => {
    if (!inputValue.trim() || !activeConvId) return;
    const msg: Message = {
      id: `msg-${Date.now()}`, conversationId: activeConvId, role: 'manager',
      content: inputValue, timestamp: new Date().toISOString(), channel: activeConv?.channel || 'web',
      delivered: true, read: false, aiGenerated: false, requiresApproval: false,
    };
    addMessage(activeConvId, msg);
    setInputValue('');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Live Agent Console"
        subtitle="Active AI conversations and inbound queue"
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status="active" label="AI Agent Online" />
            <Button variant="gold" size="sm">
              <HandMetal className="w-4 h-4 mr-1" /> Take Over
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 h-[calc(100vh-73px)]">
        {/* Inbound Queue */}
        <div className="w-[280px] border-r border-border flex flex-col">
          <div className="px-3 pt-3 pb-2 border-b border-border space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Inbound Queue</h3>
            <div className="flex gap-1">
              {['all','phone','sms','web','social'].map(f => (
                <button key={f} onClick={() => setChannelFilter(f)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${channelFilter === f ? 'bg-gold/15 text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {filteredConversations.map((conv) => {
              const Icon = channelIcons[conv.channel];
              const isActive = conv.id === activeConvId;
              return (
                <div key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors ${isActive ? 'bg-gold/5 border-l-2 border-l-gold' : 'hover:bg-secondary/30'}`}>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary mt-0.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>{conv.customerName}</span>
                      <StatusBadge status={priorityMap(conv.dealStage)} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{conv.summary?.split('.')[0]}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{timeAgo(conv.lastMessageAt)}</span>
                      {conv.escalationFlag && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                      {conv.unreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Conversation */}
        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{activeConv.customerName}</span>
                      <StatusBadge status={activeConv.status === 'active' ? 'active' : activeConv.status === 'escalated' ? 'error' : 'pending'} label={activeConv.status === 'escalated' ? 'Escalated' : 'Live'} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {(() => { const I = channelIcons[activeConv.channel]; return <I className="w-3 h-3" />; })()}
                      {activeConv.channel === 'phone' ? 'Inbound Call' : activeConv.channel.toUpperCase()} · {activeConv.customerPhone}
                      {activeConv.duration && <span>· {activeConv.duration}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm"><Mic className="w-4 h-4" /></Button>
                  <Button variant="gold-outline" size="sm">Send Quote</Button>
                  <Button variant="ghost" size="sm"><Calendar className="w-4 h-4" /></Button>
                </div>
              </div>

              {activeConv.escalationFlag && (
                <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Escalation: {activeConv.escalationReason?.replace(/_/g, ' ')} — Manager review recommended</span>
                  <Button variant="gold" size="sm" className="ml-auto text-xs">Assign to Closer</Button>
                </div>
              )}

              <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'agent' || msg.role === 'manager' ? 'justify-start' : msg.role === 'system' ? 'justify-center' : 'justify-end'}`}>
                    {msg.role === 'system' ? (
                      <div className="px-3 py-1.5 rounded-full bg-secondary/50 text-[10px] text-muted-foreground">{msg.content}</div>
                    ) : (
                      <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${msg.role === 'customer' ? 'bg-gold/10 text-foreground border border-gold/15' : 'bg-secondary text-secondary-foreground'}`}>
                        {msg.aiGenerated && <span className="text-[9px] font-semibold text-gold/60 uppercase tracking-wider">AI</span>}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.delivered && <CheckCircle className="w-2.5 h-2.5 text-muted-foreground/50" />}
                        </div>
                        {msg.requiresApproval && !msg.approved && (
                          <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                            <Button variant="gold" size="sm" className="text-[10px] h-6 px-2">Approve</Button>
                            <Button variant="secondary" size="sm" className="text-[10px] h-6 px-2">Edit</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-secondary rounded-lg px-4 py-2.5">
                    <input
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      placeholder="AI is composing response… or type to override"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                  </div>
                  <Button variant="gold" size="icon" onClick={handleSend}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span className="status-dot status-active" /> AI handling · Will auto-respond in 3s unless you type
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">Select a conversation</h3>
                <p className="text-xs text-muted-foreground max-w-[240px]">Choose from the inbound queue to view the live conversation and assist the AI agent.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        {activeConv && (
          <div className="w-[340px] border-l border-border overflow-auto">
            <Tabs defaultValue="snapshot" className="w-full">
              <TabsList className="w-full rounded-none border-b border-border bg-transparent px-2 pt-2">
                <TabsTrigger value="snapshot" className="text-xs">Snapshot</TabsTrigger>
                <TabsTrigger value="inventory" className="text-xs">Matches</TabsTrigger>
                <TabsTrigger value="transcript" className="text-xs">Transcript</TabsTrigger>
                <TabsTrigger value="objections" className="text-xs">Objections</TabsTrigger>
              </TabsList>

              <TabsContent value="snapshot" className="p-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</h4>
                  <div className="space-y-2">
                    <InfoRow label="Name" value={activeConv.customerName} />
                    <InfoRow label="Phone" value={activeConv.customerPhone || '—'} />
                    <InfoRow label="Source" value={activeLead?.source.replace(/_/g, ' ') || '—'} />
                    <InfoRow label="Channel" value={activeConv.channel} />
                    <InfoRow label="Sentiment" value={activeConv.sentiment} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deal Stage</h4>
                  <div className="space-y-1.5">
                    {['first_contact','vehicle_interest','quote_sent','appointment_set','finance_intake','closed_won'].map((stage) => {
                      const order = ['new','first_contact','vehicle_interest','quote_sent','appointment_set','finance_intake','negotiation','closed_won'];
                      const ci = order.indexOf(activeConv.dealStage);
                      const si = order.indexOf(stage);
                      return <DealStep key={stage} label={stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} done={si < ci} active={si === ci} />;
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gold/5 border border-gold/15">
                  <h4 className="text-xs font-semibold text-gold mb-1">Recommended Next Step</h4>
                  <p className="text-xs text-foreground">
                    {activeConv.dealStage === 'quote_sent'
                      ? `Send comparison quote for ${activeLead?.vehicleInterests.join(' vs ') || 'matched vehicles'} with monthly payment breakdown.`
                      : activeConv.dealStage === 'first_contact'
                      ? 'Qualify customer needs: budget, vehicle type, timeline.'
                      : activeConv.dealStage === 'negotiation'
                      ? 'Address price objection with alternative payment scenarios.'
                      : 'Continue engagement and move toward next milestone.'}
                  </p>
                  <Button variant="gold" size="sm" className="mt-2 w-full text-xs">
                    Execute <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Finance Readiness</h4>
                  <div className="flex items-center gap-2">
                    {activeConv.aiDisclosureSent ? (
                      <><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-green-400">AI Disclosed</span></>
                    ) : (
                      <><Clock className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs text-yellow-400">Disclosure Pending</span></>
                    )}
                  </div>
                  {activeQuotes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-gold" />
                      <span className="text-xs text-muted-foreground">{activeQuotes.length} quote(s) — {activeQuotes[0].status}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" className="text-xs justify-start"><Calendar className="w-3 h-3 mr-1" /> Book Apt</Button>
                    <Button variant="secondary" size="sm" className="text-xs justify-start"><FileText className="w-3 h-3 mr-1" /> Finance</Button>
                    <Button variant="secondary" size="sm" className="text-xs justify-start"><Car className="w-3 h-3 mr-1" /> Add Vehicle</Button>
                    <Button variant="secondary" size="sm" className="text-xs justify-start"><HandMetal className="w-3 h-3 mr-1" /> Handoff</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matched Vehicles</h4>
                {matchedVehicles.map((v) => (
                  <div key={v.id} className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                    {getVehicleImage(v.id) && (
                      <img src={getVehicleImage(v.id)} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-24 rounded-md object-cover" loading="lazy" />
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">{v.year} {v.make} {v.model} {v.trim}</p>
                        <p className="text-xs text-muted-foreground">{v.mileage} · Stock #{v.stock}</p>
                      </div>
                      <span className="text-sm font-semibold text-gold">${v.price.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="gold-outline" size="sm" className="text-xs flex-1">Quote</Button>
                      <Button variant="secondary" size="sm" className="text-xs flex-1">Send</Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="transcript" className="p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transcript</h4>
                <div className="space-y-3">
                  {messages.filter(m => m.role !== 'system').map((msg) => (
                    <div key={msg.id} className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-gold uppercase">{msg.role === 'agent' ? 'AI Agent' : msg.role === 'manager' ? 'Manager' : 'Customer'}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                </div>
                {activeConv.summary && (
                  <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <h5 className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">AI Summary</h5>
                    <p className="text-xs text-foreground/80">{activeConv.summary}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="objections" className="p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objection Handling</h4>
                {activeConv.objectionCount > 0 && (
                  <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <span className="text-xs text-yellow-400 font-medium">{activeConv.objectionCount} objection(s) detected</span>
                  </div>
                )}
                {objections.map((o, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-gold" />
                      <span className="text-xs font-semibold text-foreground">{o.trigger}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{o.response}</p>
                    <Button variant="gold-outline" size="sm" className="text-[10px] w-full">Use This Response</Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs text-foreground font-medium capitalize">{value}</span>
  </div>
);

const DealStep = ({ label, done, active }: { label: string; done?: boolean; active?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
      done ? "bg-green-500/20 text-green-400" : active ? "bg-gold/20 text-gold ring-1 ring-gold/40" : "bg-secondary text-muted-foreground"
    }`}>
      {done ? "✓" : active ? <ChevronRight className="w-3 h-3" /> : "○"}
    </div>
    <span className={`text-xs ${done ? "text-muted-foreground line-through" : active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
  </div>
);

export default LiveAgentConsole;
