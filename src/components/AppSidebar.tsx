import { cn } from "@/lib/utils";
import {
  Headphones,
  MessageSquare,
  Users,
  Car,
  FileText,
  Shield,
  Settings,
  Zap,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { useConversations, useEscalations, useLeads } from "@/hooks/use-store";

const navItems = [
  { to: "/", icon: Headphones, label: "Live Agent" },
  { to: "/conversations", icon: MessageSquare, label: "Conversations" },
  { to: "/leads", icon: Users, label: "Leads" },
  { to: "/vehicles", icon: Car, label: "Vehicles & Quotes" },
  { to: "/finance", icon: FileText, label: "Finance" },
  { to: "/manager", icon: Shield, label: "Manager" },
  { to: "/integrations", icon: Settings, label: "Integrations" },
];

const AppSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const conversations = useConversations();
  const escalations = useEscalations();
  const leads = useLeads();

  const activeConvos = conversations.filter(c => c.status === 'active').length;
  const openEscalations = escalations.filter(e => e.status === 'open').length;
  const hotLeads = leads.filter(l => l.priority === 'hot').length;

  const getBadge = (to: string): number | null => {
    if (to === '/' && activeConvos > 0) return activeConvos;
    if (to === '/conversations') {
      const unread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      return unread > 0 ? unread : null;
    }
    if (to === '/leads' && hotLeads > 0) return hotLeads;
    if (to === '/manager' && openEscalations > 0) return openEscalations;
    return null;
  };

  return (
    <aside className="flex flex-col w-[220px] min-h-screen bg-sidebar border-r border-sidebar-border">
      {/* Logo Area */}
      <div className="flex items-center justify-center px-5 py-5 border-b border-sidebar-border">
        <img src="/logo.jpg" alt="Door Step Auto" className="h-12 w-auto object-contain rounded-md" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const badge = getBadge(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-gold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <item.icon onClick={onNavigate}
              className={cn("w-4 h-4 flex-shrink-0", isActive && "text-gold")} />
              <span className="flex-1">{item.label}</span>
              {badge !== null && (
                <span onClick={onNavigate}
              className={cn(
                  "min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center",
                  item.to === '/manager'
                    ? "bg-red-500/20 text-red-400"
                    : "bg-gold/15 text-gold"
                )}>
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2">
          <span className="status-dot status-active" />
          <span className="text-xs text-muted-foreground">AI Agent Online</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold/50" />
          <span className="text-[10px] text-muted-foreground">Supabase Connected</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-sidebar-border">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
