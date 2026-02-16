import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Smartphone, KeyRound, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectPanelProps {
  pairingCode: string | null;
  state: string;
}

export function ConnectPanel({ pairingCode, state }: ConnectPanelProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: sessionCheck } = useQuery<{ exists: boolean }>({
    queryKey: ["/api/bot/session-exists"],
  });

  const startWithPair = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/bot/start", { mode: "pair", data: phoneNumber }),
    onSuccess: () => {
      toast({ title: "Connecting...", description: "Requesting pairing code from WhatsApp" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message || "Could not start connection", variant: "destructive" });
    },
  });

  const startWithSession = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/bot/start", { mode: "session", data: sessionId }),
    onSuccess: () => {
      toast({ title: "Connecting...", description: "Authenticating with Session ID" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message || "Invalid Session ID", variant: "destructive" });
    },
  });

  const reconnect = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/start", {}),
    onSuccess: () => {
      toast({ title: "Reconnecting...", description: "Using existing session" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message || "Could not reconnect", variant: "destructive" });
    },
  });

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode.replace("-", ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPending = startWithPair.isPending || startWithSession.isPending || reconnect.isPending;

  if (state === "pairing" && pairingCode) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="no-default-active-elevate">Pairing Code Ready</Badge>
            <p className="text-sm text-muted-foreground">
              Enter this 8-digit code in WhatsApp to link this bot
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div
              className="text-4xl font-mono font-bold tracking-[0.3em] text-center py-4 px-6 rounded-md bg-muted"
              data-testid="text-pairing-code"
            >
              {pairingCode}
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopyCode}
              data-testid="button-copy-code"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium">How to pair:</p>
            <ol className="text-xs text-muted-foreground space-y-0.5 text-left max-w-xs mx-auto">
              <li>1. Open WhatsApp on your phone</li>
              <li>2. Go to Settings &gt; Linked Devices</li>
              <li>3. Tap "Link a Device"</li>
              <li>4. Choose "Link with phone number instead"</li>
              <li>5. Enter the 8-digit code above</li>
            </ol>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Code expires in ~10 minutes. Keep this page open.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state === "connecting") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Establishing connection to WhatsApp...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold">Connect to WhatsApp</h3>
          <p className="text-xs text-muted-foreground">
            Choose a connection method below
          </p>
        </div>

        {sessionCheck?.exists && (
          <div className="p-3 rounded-md bg-muted/50 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium">Existing session found</p>
              <p className="text-xs text-muted-foreground">Reconnect with your previous session</p>
            </div>
            <Button
              size="sm"
              onClick={() => reconnect.mutate()}
              disabled={isPending}
              data-testid="button-reconnect"
            >
              {reconnect.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : null}
              Reconnect
            </Button>
          </div>
        )}

        <Tabs defaultValue="pair">
          <TabsList className="w-full">
            <TabsTrigger value="pair" className="flex-1" data-testid="tab-pair-code">
              <Smartphone className="w-4 h-4 mr-1.5" />
              Pair Code
            </TabsTrigger>
            <TabsTrigger value="session" className="flex-1" data-testid="tab-session-id">
              <KeyRound className="w-4 h-4 mr-1.5" />
              Session ID
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pair" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                data-testid="input-phone-number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="254788710904"
              />
              <p className="text-xs text-muted-foreground">
                Country code + number, no + or spaces (e.g. 254788710904)
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => startWithPair.mutate()}
              disabled={isPending || phoneNumber.length < 10}
              data-testid="button-start-pair"
            >
              {startWithPair.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-1.5" />
              )}
              Get Pairing Code
            </Button>
          </TabsContent>

          <TabsContent value="session" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label htmlFor="sessionId">Session ID</Label>
              <Input
                id="sessionId"
                data-testid="input-session-id"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="FOXY:~eyJhbGci..."
              />
              <p className="text-xs text-muted-foreground">
                Paste your session ID (FOXY:~... or plain base64)
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => startWithSession.mutate()}
              disabled={isPending || !sessionId.trim()}
              data-testid="button-start-session"
            >
              {startWithSession.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 mr-1.5" />
              )}
              Connect with Session ID
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
