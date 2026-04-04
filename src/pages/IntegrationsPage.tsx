import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Phone, MessageSquare, Globe, Instagram, Facebook,
  Database, Car, Mail, Calendar, Bot, Webhook,
  Key, Settings, CheckCircle, AlertCircle, ExternalLink,
  Link2
} from "lucide-react";

interface Integration {
  name: string;
  description: string;
  icon: typeof Phone;
  category: string;
  status: "connected" | "disconnected" | "pending";
  fields: { label: string; placeholder: string; type?: string }[];
}

const integrations: Integration[] = [
  { name: "Telephony (Twilio / Telnyx)", description: "Inbound and outbound voice calls", icon: Phone, category: "channels", status: "disconnected", fields: [{ label: "Account SID", placeholder: "Enter Account SID" }, { label: "Auth Token", placeholder: "Enter Auth Token", type: "password" }, { label: "Phone Number", placeholder: "+1 (555) 000-0000" }] },
  { name: "SMS Provider", description: "Two-way SMS messaging", icon: MessageSquare, category: "channels", status: "disconnected", fields: [{ label: "API Key", placeholder: "Enter API Key", type: "password" }, { label: "From Number", placeholder: "+1 (555) 000-0000" }] },
  { name: "Meta Business (Facebook)", description: "Facebook Messenger integration", icon: Facebook, category: "channels", status: "disconnected", fields: [{ label: "Page Access Token", placeholder: "Enter Page Access Token", type: "password" }, { label: "App ID", placeholder: "Enter App ID" }, { label: "Webhook Verify Token", placeholder: "Enter Verify Token" }] },
  { name: "Instagram Messaging", description: "Instagram DM automation", icon: Instagram, category: "channels", status: "disconnected", fields: [{ label: "Access Token", placeholder: "Enter Access Token", type: "password" }, { label: "Account ID", placeholder: "Enter Account ID" }] },
  { name: "Website Chat Widget", description: "Embedded chat for your dealership site", icon: Globe, category: "channels", status: "disconnected", fields: [{ label: "Website URL", placeholder: "https://doorstepauto.com" }, { label: "Widget Color", placeholder: "#C5A55A" }] },
  { name: "PBS Systems (CRM/DMS)", description: "Customer and deal management", icon: Database, category: "crm", status: "disconnected", fields: [{ label: "API Endpoint", placeholder: "https://api.pbssystems.com" }, { label: "Dealer ID", placeholder: "Enter Dealer ID" }, { label: "API Key", placeholder: "Enter API Key", type: "password" }] },
  { name: "Dealertrack", description: "Finance application routing", icon: Link2, category: "crm", status: "disconnected", fields: [{ label: "Partner ID", placeholder: "Enter Partner ID" }, { label: "API Key", placeholder: "Enter API Key", type: "password" }, { label: "Dealer Code", placeholder: "Enter Dealer Code" }] },
  { name: "Autovance", description: "Desking and deal structuring", icon: Settings, category: "crm", status: "disconnected", fields: [{ label: "API Key", placeholder: "Enter API Key", type: "password" }, { label: "Store ID", placeholder: "Enter Store ID" }] },
  { name: "vAuto / Inventory Feed", description: "Live vehicle inventory sync", icon: Car, category: "inventory", status: "disconnected", fields: [{ label: "Feed URL", placeholder: "https://feed.vauto.com/..." }, { label: "API Key", placeholder: "Enter API Key", type: "password" }, { label: "Refresh Interval", placeholder: "15 minutes" }] },
  { name: "Email (SMTP / SendGrid)", description: "Outbound email for quotes and follow-ups", icon: Mail, category: "other", status: "disconnected", fields: [{ label: "SMTP Host", placeholder: "smtp.sendgrid.net" }, { label: "API Key", placeholder: "Enter API Key", type: "password" }, { label: "From Address", placeholder: "sales@doorstepauto.com" }] },
  { name: "Calendar Booking", description: "Appointment scheduling integration", icon: Calendar, category: "other", status: "disconnected", fields: [{ label: "Calendar Provider", placeholder: "Google Calendar / Calendly" }, { label: "API Key", placeholder: "Enter API Key", type: "password" }] },
  { name: "AI Model Configuration", description: "Language model and voice settings", icon: Bot, category: "ai", status: "disconnected", fields: [{ label: "Model Provider", placeholder: "OpenAI / Anthropic" }, { label: "API Key", placeholder: "Enter API Key", type: "password" }, { label: "Model ID", placeholder: "gpt-4o" }, { label: "Voice Provider", placeholder: "ElevenLabs / Deepgram" }, { label: "Voice API Key", placeholder: "Enter Voice API Key", type: "password" }] },
  { name: "Webhooks", description: "Custom event notifications", icon: Webhook, category: "other", status: "disconnected", fields: [{ label: "Webhook URL", placeholder: "https://your-endpoint.com/webhook" }, { label: "Secret", placeholder: "Enter Webhook Secret", type: "password" }] },
];

const categories = [
  { value: "all", label: "All Integrations" },
  { value: "channels", label: "Channels" },
  { value: "crm", label: "CRM & DMS" },
  { value: "inventory", label: "Inventory" },
  { value: "ai", label: "AI" },
  { value: "other", label: "Other" },
];

const IntegrationsPage = () => (
  <AppLayout>
    <PageHeader
      title="Integrations & API Configuration"
      subtitle="Connect your channels, CRM, DMS, and AI providers"
    />
    <div className="p-6">
      <Tabs defaultValue="all">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start px-0">
          {categories.map((c) => (
            <TabsTrigger key={c.value} value={c.value} className="text-xs">{c.label}</TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value} className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {integrations
                .filter((i) => cat.value === "all" || i.category === cat.value)
                .map((integration) => (
                  <div key={integration.name} className="rounded-lg bg-card border border-border p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <integration.icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
                          <p className="text-xs text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <StatusBadge status={integration.status} />
                    </div>

                    <div className="space-y-3">
                      {integration.fields.map((field) => (
                        <div key={field.label} className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">{field.label}</label>
                          <input
                            type={field.type || "text"}
                            className="w-full bg-secondary rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-gold/40 transition-colors"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="gold" size="sm" className="flex-1 text-xs">
                        <Key className="w-3 h-3 mr-1" /> Connect
                      </Button>
                      <Button variant="secondary" size="sm" className="text-xs">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  </AppLayout>
);

export default IntegrationsPage;
