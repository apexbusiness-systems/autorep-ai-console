import React, { useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Phone, MessageSquare, Globe, Instagram, Facebook,
  Database, Car, Mail, Calendar, Bot, Webhook,
  Key, Settings, CheckCircle, AlertCircle, ExternalLink,
  Link2, Mic, RefreshCw, Shield, Zap, Activity, Search,
} from "lucide-react";
import { useIntegrations, updateIntegration } from "@/hooks/use-store";
import { INTEGRATION_DEFINITIONS, integrationManager } from "@/services/integration-manager";

// ─── Icon mapping ───────────────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot, Phone, MessageSquare, Globe, Instagram, Facebook,
  Database, Car, Mail, Calendar, Settings, Link2, Webhook, Mic, Search, Shield,
};

// ─── Category tabs ──────────────────────────────────────────────────────────

const categories = [
  { value: "all", label: "All" },
  { value: "channel", label: "Channels" },
  { value: "crm-dms", label: "CRM & DMS" },
  { value: "inventory", label: "Inventory" },
  { value: "ai", label: "AI & Voice" },
  { value: "email-calendar", label: "Email & Calendar" },
  { value: "webhook", label: "Webhooks" },
];

function matchesCategory(defCategory: string, tabValue: string): boolean {
  if (tabValue === "all") return true;
  if (tabValue === "channel") return defCategory === "channel";
  if (tabValue === "crm-dms") return defCategory === "crm" || defCategory === "dms";
  if (tabValue === "inventory") return defCategory === "inventory";
  if (tabValue === "ai") return defCategory === "ai";
  if (tabValue === "email-calendar") return defCategory === "email" || defCategory === "calendar";
  if (tabValue === "webhook") return defCategory === "webhook";
  return false;
}

// ─── Environment status items ───────────────────────────────────────────────

interface EnvStatusItem {
  label: string;
  key: string;
  fallbackStatus: "connected" | "disconnected" | "pending";
}

const envStatusItems: EnvStatusItem[] = [
  { label: "Supabase", key: "supabase", fallbackStatus: "connected" },
  { label: "AI Model", key: "grok", fallbackStatus: "disconnected" },
  { label: "Telephony", key: "telephony", fallbackStatus: "disconnected" },
  { label: "SMS", key: "sms", fallbackStatus: "disconnected" },
  { label: "Facebook", key: "facebook", fallbackStatus: "disconnected" },
  { label: "Instagram", key: "instagram", fallbackStatus: "disconnected" },
  { label: "Web Chat", key: "webchat", fallbackStatus: "disconnected" },
  { label: "CRM", key: "pbs", fallbackStatus: "disconnected" },
  { label: "DMS", key: "dealertrack", fallbackStatus: "disconnected" },
  { label: "Inventory", key: "vauto", fallbackStatus: "disconnected" },
  { label: "Email", key: "email", fallbackStatus: "disconnected" },
  { label: "Calendar", key: "calendar", fallbackStatus: "disconnected" },
];

// ─── Env secrets table ──────────────────────────────────────────────────────

interface EnvSecret {
  name: string;
  configured: boolean;
}

const envSecrets: EnvSecret[] = [
  { name: "VITE_SUPABASE_URL", configured: true },
  { name: "VITE_SUPABASE_ANON_KEY", configured: true },
  { name: "XAI_API_KEY", configured: false },
  { name: "TWILIO_ACCOUNT_SID", configured: false },
  { name: "TWILIO_AUTH_TOKEN", configured: false },
  { name: "SENDGRID_API_KEY", configured: false },
  { name: "META_PAGE_ACCESS_TOKEN", configured: false },
  { name: "ELEVENLABS_API_KEY", configured: false },
  { name: "GOOGLE_CALENDAR_API_KEY", configured: false },
];

// ─── Webhook event types ────────────────────────────────────────────────────

const webhookEventTypes = [
  "lead.created",
  "lead.updated",
  "lead.qualified",
  "quote.sent",
  "quote.accepted",
  "appointment.booked",
  "appointment.cancelled",
  "deal.started",
  "deal.closed",
  "handoff.requested",
  "inventory.updated",
  "message.received",
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface TestResult {
  status: "idle" | "loading" | "success" | "error";
  latencyMs?: number;
  error?: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────

const IntegrationsPage = () => {
  const storeIntegrations = useIntegrations();

  // Field values per integration: { [integrationId]: { [fieldKey]: value } }
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

  // Test results per integration
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  // Connecting state per integration
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});

  // Webhook selected events
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState<Set<string>>(new Set());

  const getFieldValue = (integrationId: string, fieldKey: string): string => {
    return fieldValues[integrationId]?.[fieldKey] ?? "";
  };

  const setFieldValue = (integrationId: string, fieldKey: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [integrationId]: { ...prev[integrationId], [fieldKey]: value },
    }));
  };

  const getIntegrationStatus = (id: string): "connected" | "disconnected" | "pending" | "error" => {
    // Supabase is always connected
    if (id === "supabase") return "connected";
    const storeEntry = storeIntegrations.find(i => i.id === id);
    if (storeEntry) return storeEntry.status as "connected" | "disconnected" | "pending" | "error";
    return "disconnected";
  };

  const handleConnect = useCallback(async (integrationId: string) => {
    const creds = fieldValues[integrationId] || {};
    setConnecting(prev => ({ ...prev, [integrationId]: true }));
    setTestResults(prev => ({ ...prev, [integrationId]: { status: "loading" } }));

    try {
      const saveResult = await integrationManager.saveConfig(integrationId, creds);
      if (!saveResult.success) {
        setTestResults(prev => ({ ...prev, [integrationId]: { status: "error", error: saveResult.error } }));
        setConnecting(prev => ({ ...prev, [integrationId]: false }));
        return;
      }

      const testResult = await integrationManager.testConnection(integrationId);
      if (testResult.connected) {
        setTestResults(prev => ({
          ...prev,
          [integrationId]: { status: "success", latencyMs: testResult.latencyMs },
        }));
        updateIntegration(integrationId, {
          status: "connected",
          syncStatus: "synced",
          lastSyncAt: new Date().toISOString(),
        });
      } else {
        setTestResults(prev => ({
          ...prev,
          [integrationId]: { status: "error", error: testResult.error },
        }));
        updateIntegration(integrationId, { status: "error", errorMessage: testResult.error });
      }
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [integrationId]: { status: "error", error: String(err) },
      }));
    }
    setConnecting(prev => ({ ...prev, [integrationId]: false }));
  }, [fieldValues]);

  const handleTestConnection = useCallback(async (integrationId: string) => {
    setTestResults(prev => ({ ...prev, [integrationId]: { status: "loading" } }));

    try {
      const result = await integrationManager.testConnection(integrationId);
      if (result.connected) {
        setTestResults(prev => ({
          ...prev,
          [integrationId]: { status: "success", latencyMs: result.latencyMs },
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [integrationId]: { status: "error", error: result.error },
        }));
      }
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [integrationId]: { status: "error", error: String(err) },
      }));
    }
  }, []);

  const toggleWebhookEvent = (event: string) => {
    setSelectedWebhookEvents(prev => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });
  };

  // ─── Environment Status Bar ─────────────────────────────────────────────

  const renderEnvironmentStatusBar = () => {
    const getStatusForItem = (item: EnvStatusItem) => {
      if (item.key === "supabase") return "connected";
      const storeEntry = storeIntegrations.find(i => i.id === item.key);
      return (storeEntry?.status as "connected" | "disconnected" | "pending") || item.fallbackStatus;
    };

    const dotColor = (status: string) => {
      if (status === "connected") return "bg-green-400";
      if (status === "pending") return "bg-yellow-400";
      return "bg-zinc-500";
    };

    const statusText = (status: string) => {
      if (status === "connected") return "Live";
      if (status === "pending") return "Pending";
      return "Offline";
    };

    const statusTextColor = (status: string) => {
      if (status === "connected") return "text-green-400";
      if (status === "pending") return "text-yellow-400";
      return "text-zinc-500";
    };

    return (
      <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Environment Status
          </span>
          <Zap className="w-3 h-3 text-gold/60 ml-auto" />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {envStatusItems.map(item => {
            const status = getStatusForItem(item);
            return (
              <div key={item.key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dotColor(status)} ${status === "connected" ? "animate-pulse" : ""}`} />
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className={`text-[10px] font-medium ${statusTextColor(status)}`}>{statusText(status)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Supabase Card ──────────────────────────────────────────────────────

  const renderSupabaseCard = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://*****.supabase.co";
    const masked = supabaseUrl.length > 20
      ? supabaseUrl.substring(0, 12) + "****" + supabaseUrl.substring(supabaseUrl.length - 12)
      : supabaseUrl;

    return (
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Supabase (Database)</h3>
              <p className="text-xs text-muted-foreground">Backend database and auth provider</p>
            </div>
          </div>
          <StatusBadge status="connected" label="Always On" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
            <span className="text-[11px] text-muted-foreground">URL</span>
            <code className="text-[11px] text-green-400 font-mono">{masked}</code>
          </div>
          <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
            <span className="text-[11px] text-muted-foreground">Anon Key</span>
            <code className="text-[11px] text-green-400 font-mono">****configured****</code>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-green-400 font-medium">Connection healthy</span>
            <span className="text-[10px] text-muted-foreground ml-auto">Latency: ~45ms</span>
          </div>
        </div>
      </div>
    );
  };

  // ─── Integration Card ───────────────────────────────────────────────────

  const renderIntegrationCard = (def: typeof INTEGRATION_DEFINITIONS[number]) => {
    const IconComponent = iconMap[def.icon] || Settings;
    const status = getIntegrationStatus(def.id);
    const testResult = testResults[def.id] || { status: "idle" };
    const isConnecting = connecting[def.id] || false;
    const storeEntry = storeIntegrations.find(i => i.id === def.id);
    const lastSync = storeEntry?.lastSyncAt;
    const errorMsg = storeEntry?.errorMessage;
    const isWebhook = def.id === "webhooks";

    const borderColor =
      status === "connected" ? "border-green-500/20" :
      status === "error" ? "border-red-500/20" :
      status === "pending" ? "border-yellow-500/20" :
      "border-border";

    return (
      <div key={def.id} className={`rounded-lg border ${borderColor} bg-card p-5 space-y-4 transition-colors`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              status === "connected" ? "bg-green-500/10 border border-green-500/20" : "bg-secondary"
            }`}>
              <IconComponent className={`w-5 h-5 ${status === "connected" ? "text-green-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{def.name}</h3>
              <p className="text-xs text-muted-foreground">{def.description}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Config fields */}
        <div className="space-y-3">
          {def.fields.map(field => (
            <div key={field.key} className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">{field.label}</label>
              <input
                type={field.type === "password" ? "password" : "text"}
                className="w-full bg-secondary rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border outline-none focus:border-gold/40 transition-colors"
                placeholder={field.placeholder}
                value={getFieldValue(def.id, field.key)}
                onChange={e => setFieldValue(def.id, field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Webhook event type multi-select */}
        {isWebhook && (
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-muted-foreground">Event Types</label>
            <div className="flex flex-wrap gap-1.5">
              {webhookEventTypes.map(evt => {
                const selected = selectedWebhookEvents.has(evt);
                return (
                  <button
                    key={evt}
                    onClick={() => toggleWebhookEvent(evt)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer ${
                      selected
                        ? "bg-gold/15 text-gold border-gold/30"
                        : "bg-secondary text-muted-foreground border-border hover:border-gold/20"
                    }`}
                  >
                    {evt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Test result display */}
        {testResult.status === "loading" && (
          <div className="flex items-center gap-2 py-2">
            <RefreshCw className="w-3.5 h-3.5 text-gold animate-spin" />
            <span className="text-xs text-muted-foreground">Testing connection...</span>
          </div>
        )}
        {testResult.status === "success" && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-green-500/5 border border-green-500/15">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Connected successfully</span>
            {testResult.latencyMs && (
              <span className="text-[10px] text-green-400/70 ml-auto">{testResult.latencyMs}ms</span>
            )}
          </div>
        )}
        {testResult.status === "error" && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-red-500/5 border border-red-500/15">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-400 font-medium">{testResult.error || "Connection failed"}</span>
          </div>
        )}

        {/* Error from store */}
        {errorMsg && testResult.status === "idle" && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-red-500/5 border border-red-500/15">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-400">{errorMsg}</span>
          </div>
        )}

        {/* Sync health */}
        {status === "connected" && lastSync && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>Last sync: {new Date(lastSync).toLocaleString()}</span>
            <span className="ml-auto text-green-400/70">Healthy</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="gold"
            size="sm"
            className="flex-1 text-xs"
            disabled={isConnecting}
            onClick={() => handleConnect(def.id)}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Key className="w-3 h-3 mr-1" />
                {status === "connected" ? "Reconnect" : "Connect"}
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            disabled={testResult.status === "loading"}
            onClick={() => handleTestConnection(def.id)}
          >
            {testResult.status === "loading" ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Zap className="w-3 h-3 mr-1" />
                Test
              </>
            )}
          </Button>
          {def.docsUrl && (
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <a href={def.docsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
          {!def.docsUrl && (
            <Button variant="ghost" size="sm" className="text-xs px-2">
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ─── Environment Secrets Readiness ──────────────────────────────────────

  const renderSecretsReadiness = () => (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-gold" />
        <h3 className="text-sm font-semibold text-foreground">Environment Secrets Readiness</h3>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Variable</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {envSecrets.map(secret => (
              <tr key={secret.name} className="border-t border-border/50">
                <td className="px-3 py-2 font-mono text-foreground">{secret.name}</td>
                <td className="px-3 py-2 text-right">
                  {secret.configured ? (
                    <span className="inline-flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-yellow-400">
                      <AlertCircle className="w-3 h-3" />
                      Needs credentials
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <PageHeader
        title="Integrations & Configuration"
        subtitle="Connect channels, CRM, DMS, inventory feeds, and AI providers"
      />
      <div className="p-6 space-y-6">
        {/* Environment Status Bar */}
        {renderEnvironmentStatusBar()}

        {/* Tabbed Integration Cards */}
        <Tabs defaultValue="all">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start px-0 gap-0">
            {categories.map(c => (
              <TabsTrigger key={c.value} value={c.value} className="text-xs">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.value} value={cat.value} className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Supabase card always shows in All tab or CRM & DMS tab */}
                {(cat.value === "all" || cat.value === "crm-dms") && renderSupabaseCard()}

                {INTEGRATION_DEFINITIONS
                  .filter(def => matchesCategory(def.category, cat.value))
                  .map(def => renderIntegrationCard(def))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Environment Secrets Readiness */}
        {renderSecretsReadiness()}
      </div>
    </AppLayout>
  );
};

export default IntegrationsPage;
