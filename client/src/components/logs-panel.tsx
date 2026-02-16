import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";
import type { LogEntry } from "@shared/schema";

const levelColors: Record<string, string> = {
  info: "text-blue-500 dark:text-blue-400",
  warn: "text-yellow-500 dark:text-yellow-400",
  error: "text-red-500 dark:text-red-400",
};

export function LogsPanel({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="w-4 h-4" />
            Live Logs
          </div>
          <Badge variant="secondary">{logs.length} entries</Badge>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="p-4 font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No logs yet. Start the bot to see activity.
              </p>
            ) : (
              logs.map((log, i) => {
                const time = new Date(log.time).toLocaleTimeString();
                return (
                  <div
                    key={i}
                    className="flex gap-2 leading-5 hover:bg-muted/50 rounded px-1.5 py-0.5"
                    data-testid={`log-entry-${i}`}
                  >
                    <span className="text-muted-foreground flex-shrink-0">
                      {time}
                    </span>
                    <span
                      className={`uppercase w-12 flex-shrink-0 font-semibold ${
                        levelColors[log.level] || "text-muted-foreground"
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-foreground break-all">{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
