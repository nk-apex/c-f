import { useWebSocket } from "@/lib/useWebSocket";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { StatusPanel } from "@/components/status-panel";
import { QRCodePanel } from "@/components/qr-panel";
import { CommandsPanel } from "@/components/commands-panel";
import { LogsPanel } from "@/components/logs-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  RotateCcw,
  Wifi,
  WifiOff,
  Terminal,
  Settings,
  List,
  LayoutDashboard,
} from "lucide-react";
import type { BotConfig, BotCommand } from "@shared/schema";

export default function Dashboard() {
  const { status, qrCode, logs, connected } = useWebSocket();

  const { data: commands = [] } = useQuery<BotCommand[]>({
    queryKey: ["/api/bot/commands"],
  });

  const { data: config } = useQuery<BotConfig>({
    queryKey: ["/api/bot/config"],
  });

  const startBot = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/start"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] }),
  });

  const stopBot = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/stop"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] }),
  });

  const restartBot = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/restart"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] }),
  });

  const isLoading = startBot.isPending || stopBot.isPending || restartBot.isPending;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 px-4 py-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground font-bold text-lg">
              F
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Foxy Bot</h1>
              <p className="text-xs text-muted-foreground leading-tight">WhatsApp Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
              {connected ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-destructive" />
              )}
              <span>{connected ? "Live" : "Offline"}</span>
            </div>

            {status.state === "disconnected" && (
              <Button
                data-testid="button-start-bot"
                size="sm"
                onClick={() => startBot.mutate()}
                disabled={isLoading}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Start Bot
              </Button>
            )}
            {(status.state === "connected" || status.state === "qr") && (
              <>
                <Button
                  data-testid="button-restart-bot"
                  size="sm"
                  variant="outline"
                  onClick={() => restartBot.mutate()}
                  disabled={isLoading}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Restart
                </Button>
                <Button
                  data-testid="button-stop-bot"
                  size="sm"
                  variant="destructive"
                  onClick={() => stopBot.mutate()}
                  disabled={isLoading}
                >
                  <Square className="w-4 h-4 mr-1.5" />
                  Stop
                </Button>
              </>
            )}
            {status.state === "connecting" && (
              <Button size="sm" disabled>
                Connecting...
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="commands" data-testid="tab-commands">
              <List className="w-4 h-4 mr-1.5" />
              Commands
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Terminal className="w-4 h-4 mr-1.5" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-1.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <StatusPanel status={status} />
            {(status.state === "qr" || qrCode) && status.state !== "connected" && (
              <QRCodePanel qrCode={qrCode} />
            )}
          </TabsContent>

          <TabsContent value="commands">
            <CommandsPanel commands={commands} prefix={config?.prefix || "."} />
          </TabsContent>

          <TabsContent value="logs">
            <LogsPanel logs={logs} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel config={config} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
