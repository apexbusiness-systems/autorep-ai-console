import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone, MessageSquare, Globe, Instagram, Send,
  User, Car, Calendar, ArrowRight, Clock,
  HandMetal, FileText, ChevronRight, Mic
} from "lucide-react";

const mockQueue = [
  { id: 1, name: "Sarah Mitchell", channel: "phone" as const, topic: "2024 RAV4 inquiry", time: "2m ago", priority: "hot" as const },
  { id: 2, name: "James Cooper", channel: "sms" as const, topic: "Trade-in value question", time: "5m ago", priority: "warm" as const },
  { id: 3, name: "Maria Santos", channel: "web" as const, topic: "Payment calculator", time: "8m ago", priority: "new" as const },
  { id: 4, name: "David Chen", channel: "instagram" as const, topic: "Used truck inventory", time: "12m ago", priority: "warm" as const },
];

const channelIcons = { phone: Phone, sms: MessageSquare, web: Globe, instagram: Instagram, facebook: MessageSquare };

const mockMessages = [
  { role: "customer" as const, text: "Hi, I'm looking for a reliable SUV for my family. Budget is around $35,000.", time: "2:14 PM" },
  { role: "agent" as const, text: "Welcome to Door Step Auto! I'd love to help you find the perfect family SUV. With a $35K budget, I have several great options. Could you tell me if you have a preference for new or pre-owned?", time: "2:14 PM" },
  { role: "customer" as const, text: "I'm open to either. What do you recommend?", time: "2:15 PM" },
  { role: "agent" as const, text: "Great! Based on your budget, I'd recommend looking at the 2024 Toyota RAV4 XLE — it's one of our best sellers for families. I also have a low-mileage 2023 Honda CR-V that's well within budget. Would you like me to pull up details and pricing on both?", time: "2:15 PM" },
];

const mockInventory = [
  { year: 2024, make: "Toyota", model: "RAV4 XLE", price: 33450, mileage: "New", stock: "T-4892" },
  { year: 2023, make: "Honda", model: "CR-V EX", price: 29900, mileage: "12,400 mi", stock: "H-3201" },
  { year: 2024, make: "Hyundai", model: "Tucson SEL", price: 31200, mileage: "New", stock: "HY-1055" },
];

const LiveAgentConsole = () => {
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
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inbound Queue</h3>
          </div>
          <div className="flex-1 overflow-auto">
            {mockQueue.map((item, i) => {
              const Icon = channelIcons[item.channel];
              return (
                <div key={item.id} className={`flex items-start gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors ${i === 0 ? "bg-secondary/50" : "hover:bg-secondary/30"}`}>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary mt-0.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                      <StatusBadge status={item.priority} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.topic}</p>
                    <span className="text-[10px] text-muted-foreground">{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Conversation Workspace */}
        <div className="flex-1 flex flex-col">
          {/* Conversation Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
                <User className="w-4 h-4 text-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Sarah Mitchell</span>
                  <StatusBadge status="active" label="Live" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" /> Inbound Call · (555) 234-8901
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm"><Mic className="w-4 h-4" /></Button>
              <Button variant="gold-outline" size="sm">Send Quote</Button>
              <Button variant="ghost" size="sm"><Calendar className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
            {mockMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${msg.role === "agent" ? "bg-secondary text-secondary-foreground" : "bg-gold/15 text-foreground border border-gold/20"}`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-5 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-secondary rounded-lg px-4 py-2.5">
                <input
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  placeholder="AI is composing response… or type to override"
                />
              </div>
              <Button variant="gold" size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <span className="status-dot status-active" /> AI handling · Will auto-respond in 3s unless you type
            </p>
          </div>
        </div>

        {/* Right Panel - Customer & Deal Info */}
        <div className="w-[320px] border-l border-border overflow-auto">
          <Tabs defaultValue="snapshot" className="w-full">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent px-2 pt-2">
              <TabsTrigger value="snapshot" className="text-xs">Snapshot</TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs">Matches</TabsTrigger>
              <TabsTrigger value="transcript" className="text-xs">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="snapshot" className="p-4 space-y-4">
              {/* Customer Snapshot */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</h4>
                <div className="space-y-2">
                  <InfoRow label="Name" value="Sarah Mitchell" />
                  <InfoRow label="Phone" value="(555) 234-8901" />
                  <InfoRow label="Source" value="Google Ads" />
                  <InfoRow label="First Contact" value="Today, 2:14 PM" />
                </div>
              </div>

              {/* Deal Stage */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deal Stage</h4>
                <div className="space-y-1.5">
                  <DealStep label="First Contact" done />
                  <DealStep label="Vehicle Interest" done />
                  <DealStep label="Quote Sent" active />
                  <DealStep label="Appointment Set" />
                  <DealStep label="Finance Intake" />
                  <DealStep label="Closed" />
                </div>
              </div>

              {/* Recommended Next Step */}
              <div className="p-3 rounded-lg bg-gold/5 border border-gold/15">
                <h4 className="text-xs font-semibold text-gold mb-1">Recommended Next Step</h4>
                <p className="text-xs text-foreground">Send comparison quote for RAV4 XLE vs CR-V EX with monthly payment breakdown.</p>
                <Button variant="gold" size="sm" className="mt-2 w-full text-xs">
                  Generate Quote <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              {/* Quick Actions */}
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
              {mockInventory.map((v) => (
                <div key={v.stock} className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-foreground">{v.year} {v.make} {v.model}</p>
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
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Call Transcript</h4>
              <div className="space-y-3">
                {mockMessages.map((msg, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gold uppercase">{msg.role === "agent" ? "AI Agent" : "Customer"}</span>
                      <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <h5 className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">AI Summary</h5>
                <p className="text-xs text-foreground/80">Customer seeking family SUV under $35K. Open to new or used. AI recommended RAV4 XLE and CR-V EX. Awaiting quote comparison.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs text-foreground font-medium">{value}</span>
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
