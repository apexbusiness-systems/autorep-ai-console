import { supabase } from '@/integrations/supabase/client';

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

const pendingFlush: ErrorReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    const batch = pendingFlush.splice(0);
    if (!batch.length) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) return;

    for (const report of batch) {
      await supabase.from('audit_events').insert({
        action: 'manager_override',
        entity_type: 'client_error',
        entity_id: 'browser',
        performed_by: 'ErrorReporter',
        details: report.message.slice(0, 500),
        metadata: report,
      }).then(({ error }) => {
        if (error) console.warn('[ErrorReporter] Failed to log:', error.message);
      });
    }
  }, 2000);
}

export function reportError(error: Error, extra?: Partial<ErrorReport>) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack?.slice(0, 2000),
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...extra,
  };

  pendingFlush.push(report);
  scheduleFlush();

  if (import.meta.env.DEV) {
    console.error('[ErrorReporter]', report);
  }
}

export function installGlobalHandlers() {
  window.addEventListener('error', (e) => {
    if (e.error instanceof Error) reportError(e.error);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
    reportError(err);
  });
}
