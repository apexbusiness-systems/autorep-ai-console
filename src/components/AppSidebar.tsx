import { cn } from "@/lib/utils";
import {
  Headphones,
  MessageSquare,
  Users,
  Car,
  FileText,
  Shield,
  Settings,
  Bot,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", icon: Headphones, label: "Live Agent" },
  { to: "/conversations", icon: MessageSquare, label: "Conversations" },
  { to: "/leads", icon: Users, label: "Leads" },
  { to: "/vehicles", icon: Car, label: "Vehicles & Quotes" },
  { to: "/finance", icon: FileText, label: "Finance" },
  { to: "/manager", icon: Shield, label: "Manager" },
  { to: "/integrations", icon: Settings, label: "Integrations" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="flex flex-col w-[220px] min-h-screen bg-sidebar border-r border-sidebar-border">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold/10">
          <Bot className="w-5 h-5 text-gold" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground tracking-tight">AutoRep AI</span>
          <span className="text-[10px] text-muted-foreground tracking-wide uppercase">Door Step Auto</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-gold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive && "text-gold")} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <span className="status-dot status-active" />
          <span className="text-xs text-muted-foreground">Agent Online</span>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
