import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LiveAgentConsole from "./pages/LiveAgentConsole";
import ConversationsPage from "./pages/ConversationsPage";
import LeadsPage from "./pages/LeadsPage";
import VehiclesPage from "./pages/VehiclesPage";
import FinancePage from "./pages/FinancePage";
import ManagerPage from "./pages/ManagerPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
);

export default App;
