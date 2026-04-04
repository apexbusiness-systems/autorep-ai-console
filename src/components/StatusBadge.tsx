import { cn } from "@/lib/utils";

type StatusType = "active" | "pending" | "idle" | "error" | "connected" | "disconnected" | "new" | "hot" | "warm" | "cold";

const statusStyles: Record<StatusType, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  idle: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  error: "bg-red-500/15 text-red-400 border-red-500/20",
  connected: "bg-green-500/15 text-green-400 border-green-500/20",
  disconnected: "bg-red-500/15 text-red-400 border-red-500/20",
  new: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  hot: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  warm: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  cold: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const StatusBadge = ({ status, label, className }: StatusBadgeProps) => (
  <span className={cn(
    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
    statusStyles[status],
    className
  )}>
    <span className={cn("w-1.5 h-1.5 rounded-full", {
      "bg-green-400": status === "active" || status === "connected",
      "bg-yellow-400": status === "pending" || status === "warm",
      "bg-gray-400": status === "idle",
      "bg-red-400": status === "error" || status === "disconnected",
      "bg-blue-400": status === "new",
      "bg-orange-400": status === "hot",
      "bg-slate-400": status === "cold",
    })} />
    {label || status}
  </span>
);

export default StatusBadge;
