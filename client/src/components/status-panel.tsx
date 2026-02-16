import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Clock,
  MessageSquare,
  Send,
  Phone,
  User,
} from "lucide-react";
import type { BotStatus } from "@shared/schema";

function formatUptime(seconds: number): string {
  if (seconds === 0) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

const stateConfig: Record<
  string,
  { label: string; color: string }
> = {
  disconnected: { label: "Disconnected", color: "bg-gray-400 dark:bg-gray-600" },
  connecting: { label: "Connecting", color: "bg-yellow-500" },
  qr: { label: "Awaiting QR Scan", color: "bg-yellow-500" },
  connected: { label: "Connected", color: "bg-green-500" },
};

export function StatusPanel({ status }: { status: BotStatus }) {
  const cfg = stateConfig[status.state] || stateConfig.disconnected;

  const stats = [
    {
      label: "Status",
      value: (
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
          <span className="font-medium">{cfg.label}</span>
        </div>
      ),
      icon: Activity,
    },
    {
      label: "Uptime",
      value: formatUptime(status.uptime),
      icon: Clock,
    },
    {
      label: "Messages In",
      value: status.messagesReceived.toLocaleString(),
      icon: MessageSquare,
    },
    {
      label: "Messages Out",
      value: status.messagesSent.toLocaleString(),
      icon: Send,
    },
  ];

  return (
    <div className="space-y-4">
      {status.state === "connected" && (status.phoneNumber || status.name) && (
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 text-primary">
              <User className="w-6 h-6" />
            </div>
            <div>
              {status.name && (
                <p className="font-semibold text-sm" data-testid="text-bot-name">{status.name}</p>
              )}
              {status.phoneNumber && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5" data-testid="text-phone-number">
                  <Phone className="w-3.5 h-3.5" />
                  +{status.phoneNumber}
                </p>
              )}
            </div>
            <Badge className="ml-auto" variant="secondary">
              Online
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
