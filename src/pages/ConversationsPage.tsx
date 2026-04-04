import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Phone, MessageSquare, Globe, Instagram, Facebook,
  Search, Filter, MoreHorizontal, ArrowRight
} from "lucide-react";

const conversations = [
  { id: 1, name: "Sarah Mitchell", channel: "phone", lastMsg: "I'd like to come see the RAV4 this weekend.", time: "2 min", status: "active" as const, unread: true },
  { id: 2, name: "James Cooper", channel: "sms", lastMsg: "What's the trade-in value for a 2019 Civic?", time: "5 min", status: "active" as const, unread: true },
  { id: 3, name: "Maria Santos", channel: "web", lastMsg: "Can I get pre-approved online?", time: "8 min", status: "pending" as const, unread: false },
  { id: 4, name: "David Chen", channel: "instagram", lastMsg: "Is that F-150 still available?", time: "12 min", status: "active" as const, unread: false },
  { id: 5, name: "Lisa Park", channel: "facebook", lastMsg: "Thanks for the quote!", time: "25 min", status: "idle" as const, unread: false },
  { id: 6, name: "Robert Kim", channel: "sms", lastMsg: "I'll think about it and get back to you.", time: "1 hr", status: "idle" as const, unread: false },
  { id: 7, name: "Amanda Torres", channel: "phone", lastMsg: "Can you send me the Carfax report?", time: "2 hr", status: "pending" as const, unread: false },
];

const channelIcons: Record<string, typeof Phone> = { phone: Phone, sms: MessageSquare, web: Globe, instagram: Instagram, facebook: Facebook };

const ConversationsPage = () => (
  <AppLayout>
    <PageHeader
      title="Conversations"
      subtitle="Unified threads across all channels"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
          <Button variant="gold" size="sm">New Conversation</Button>
        </div>
      }
    />
    <div className="flex h-[calc(100vh-73px)]">
      {/* Thread List */}
      <div className="w-[360px] border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center bg-secondary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" placeholder="Search conversations…" />
          </div>
        </div>
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent px-3 pt-1 justify-start">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="phone" className="text-xs">Phone</TabsTrigger>
            <TabsTrigger value="sms" className="text-xs">SMS</TabsTrigger>
            <TabsTrigger value="web" className="text-xs">Web</TabsTrigger>
            <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="flex-1 overflow-auto mt-0">
            {conversations.map((c) => {
              const Icon = channelIcons[c.channel] || MessageSquare;
              return (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary mt-0.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${c.unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">{c.time}</span>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${c.unread ? "text-foreground/90" : "text-muted-foreground"}`}>{c.lastMsg}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={c.status} />
                      <span className="text-[10px] text-muted-foreground capitalize">{c.channel}</span>
                    </div>
                  </div>
                  {c.unread && <span className="w-2 h-2 rounded-full bg-gold mt-2" />}
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* Conversation Detail Placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground">Select a conversation</h3>
          <p className="text-xs text-muted-foreground max-w-[240px]">Choose a thread from the list to view the full conversation, send quotes, and manage the deal.</p>
        </div>
      </div>
    </div>
  </AppLayout>
);

export default ConversationsPage;
