import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { initializeStore } from "@/hooks/use-store";
import {
  demoLeads, demoConversations, demoMessages, demoVehicles,
  demoQuotes, demoFollowUpTasks, demoFinancePackets,
  demoAppointments, demoAuditEvents, demoEscalations,
} from "@/data/seed";
import LiveAgentConsole from "./pages/LiveAgentConsole";
import ConversationsPage from "./pages/ConversationsPage";
import LeadsPage from "./pages/LeadsPage";
import VehiclesPage from "./pages/VehiclesPage";
import FinancePage from "./pages/FinancePage";
import ManagerPage from "./pages/ManagerPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function StoreInitializer() {
  useEffect(() => {
    initializeStore({
      leads: demoLeads,
      conversations: demoConversations,
      messages: demoMessages,
      vehicles: demoVehicles,
      quotes: demoQuotes,
      followUpTasks: demoFollowUpTasks,
      financePackets: demoFinancePackets,
      appointments: demoAppointments,
      auditEvents: demoAuditEvents,
      escalations: demoEscalations,
      activeConversationId: 'conv-1',
    });
  }, []);
  return null;
}

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreInitializer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LiveAgentConsole />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
