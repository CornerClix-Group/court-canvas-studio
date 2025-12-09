import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, CheckCircle2, AlertCircle, Send, Clock, RefreshCw } from "lucide-react";

export interface EmailLog {
  id: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  failed_at: string | null;
  error_message: string | null;
}

interface EmailStatusBadgeProps {
  emailLog?: EmailLog | null;
  fallbackSentAt?: string | null;
  showResendHint?: boolean;
}

export function EmailStatusBadge({ emailLog, fallbackSentAt, showResendHint }: EmailStatusBadgeProps) {
  if (!fallbackSentAt && !emailLog) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  // If we have email log with tracking info
  if (emailLog) {
    const status = emailLog.status;
    
    if (status === "opened" && emailLog.opened_at) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-purple-600">
                <Eye className="w-4 h-4" />
                <span className="text-xs">Opened</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p>Opened {format(new Date(emailLog.opened_at), "MMM d, yyyy 'at' h:mm a")}</p>
                {emailLog.delivered_at && (
                  <p className="text-muted-foreground">Delivered {format(new Date(emailLog.delivered_at), "MMM d 'at' h:mm a")}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (status === "delivered" && emailLog.delivered_at) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">Delivered</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delivered {format(new Date(emailLog.delivered_at), "MMM d, yyyy 'at' h:mm a")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (status === "bounced" || status === "failed") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Failed</span>
                {showResendHint && <RefreshCw className="w-3 h-3 ml-1" />}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-destructive">{emailLog.error_message || "Email delivery failed"}</p>
              {showResendHint && <p className="text-xs mt-1">Click to resend</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // Status is "sent" - waiting for delivery confirmation
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-blue-600">
              <Send className="w-4 h-4" />
              <span className="text-xs">Sent</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sent {emailLog.sent_at ? format(new Date(emailLog.sent_at), "MMM d, yyyy 'at' h:mm a") : ""}</p>
            <p className="text-muted-foreground text-xs">Awaiting delivery confirmation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback: legacy behavior using sent_at only
  if (fallbackSentAt) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Sent</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sent {format(new Date(fallbackSentAt), "MMM d, yyyy 'at' h:mm a")}</p>
            <p className="text-muted-foreground text-xs">Tracking not available</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}
