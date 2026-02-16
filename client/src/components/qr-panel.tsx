import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, QrCode } from "lucide-react";

export function QRCodePanel({ qrCode }: { qrCode: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!qrCode || !canvasRef.current) {
      setLoading(true);
      return;
    }

    setLoading(true);
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(
        canvasRef.current,
        qrCode,
        {
          width: 280,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (err: any) => {
          if (!err) setLoading(false);
        }
      );
    });
  }, [qrCode]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center p-6 gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <QrCode className="w-4 h-4" />
          <span>Scan this QR code with WhatsApp to connect</span>
        </div>

        <div className="relative flex items-center justify-center rounded-md overflow-hidden bg-white p-2">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <canvas ref={canvasRef} data-testid="qr-canvas" />
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Open WhatsApp on your phone, go to Settings, then Linked Devices, then Link a Device.
          </p>
          <p className="text-xs text-muted-foreground">
            The QR code refreshes automatically. Keep this page open.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
