import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "completed";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    pending: {
      label: "Pending",
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-gradient-warning text-warning-foreground",
    },
    approved: {
      label: "Approved",
      variant: "default" as const,
      icon: CheckCircle,
      className: "bg-gradient-success text-success-foreground",
    },
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
      icon: XCircle,
      className: "bg-destructive text-destructive-foreground",
    },
    completed: {
      label: "Completed",
      variant: "default" as const,
      icon: CheckCircle,
      className: "bg-primary text-primary-foreground",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} flex items-center gap-1 ${className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};