import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { BotConfig } from "@shared/schema";

const modes = [
  { value: "public", label: "Public", desc: "Everyone can use the bot" },
  { value: "private", label: "Private", desc: "Owner only" },
  { value: "group-only", label: "Group Only", desc: "Works in groups only" },
];

export function SettingsPanel({ config }: { config?: BotConfig }) {
  const { toast } = useToast();
  const [prefix, setPrefix] = useState(config?.prefix || ".");
  const [mode, setMode] = useState(config?.mode || "public");
  const [ownerNumber, setOwnerNumber] = useState(config?.ownerNumber || "");
  const [botName, setBotName] = useState(config?.botName || "Foxy Bot");

  useEffect(() => {
    if (config) {
      setPrefix(config.prefix);
      setMode(config.mode);
      setOwnerNumber(config.ownerNumber);
      setBotName(config.botName);
    }
  }, [config]);

  const updateConfig = useMutation({
    mutationFn: (data: Partial<BotConfig>) =>
      apiRequest("PATCH", "/api/bot/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/config"] });
      toast({ title: "Settings saved", description: "Bot configuration updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateConfig.mutate({ prefix, mode: mode as BotConfig["mode"], ownerNumber, botName });
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="botName">Bot Name</Label>
            <Input
              id="botName"
              data-testid="input-bot-name"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="Foxy Bot"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefix">Command Prefix</Label>
            <Input
              id="prefix"
              data-testid="input-prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.slice(0, 3))}
              placeholder="."
              maxLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerNumber">Owner Phone Number</Label>
            <Input
              id="ownerNumber"
              data-testid="input-owner-number"
              value={ownerNumber}
              onChange={(e) => setOwnerNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 254751228167"
            />
            <p className="text-xs text-muted-foreground">
              Country code + number, no spaces or symbols
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Bot Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger data-testid="select-mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {modes.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div>
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{m.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            data-testid="button-save-settings"
            onClick={handleSave}
            disabled={updateConfig.isPending}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {updateConfig.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
