import { useCanvasStore } from "@/store/useCanvasStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Play, Image, Video, Sparkles, Layout, Smartphone, Tablet, Monitor } from "lucide-react";

interface PropertiesSidebarProps {
  onRun: (nodeId: string) => void;
  generating: boolean;
}

export function PropertiesSidebar({ onRun, generating }: PropertiesSidebarProps) {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const persistPayload = useCanvasStore((s) => s.persistPayload);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node || !selectedNodeId) return null;

  const { data } = node;
  const payload = data.dataPayload ?? {};
  const isImage = data.type === "image";
  const isUI = data.type === "ui";

  const updatePayload = (key: string, value: unknown) => {
    const newPayload = { ...payload, [key]: value };
    updateNodeData(selectedNodeId, { dataPayload: newPayload });
    persistPayload(selectedNodeId, newPayload);
  };

  return (
    <div className="absolute right-0 top-0 z-50 h-full w-80 border-l border-border bg-card/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isImage ? "bg-primary/15 text-primary" : isUI ? "bg-gold/15 text-gold" : "bg-accent/15 text-accent"
            }`}
          >
            {isImage ? <Image className="h-4 w-4" /> : isUI ? <Layout className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {isImage ? "Imagen" : isUI ? "Diseño UI" : "Video"} — Propiedades
          </span>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Estado:</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              data.status === "ready"
                ? "bg-success/15 text-success"
                : data.status === "error"
                ? "bg-destructive/15 text-destructive"
                : "bg-primary/15 text-primary"
            }`}
          >
            {data.status === "ready" ? "Listo" : data.status === "error" ? "Error" : "Generando..."}
          </span>
        </div>

        {/* Prompt (read-only for already generated, editable for pending) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Prompt</Label>
          <Textarea
            value={data.prompt}
            readOnly
            className="bg-muted border-none text-xs font-mono resize-none h-20"
          />
        </div>

        {/* Model selection */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Modelo</Label>
          <Select
            value={(payload.model as string) ?? (isUI ? "gemini-3-flash" : isImage ? "gemini-image" : "gemini-video")}
            onValueChange={(v) => updatePayload("model", v)}
          >
            <SelectTrigger className="bg-muted border-none text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isUI ? (
                <>
                  <SelectItem value="gemini-3-flash">Gemini 1.5 Flash (Layouts)</SelectItem>
                  <SelectItem value="gemini-3.1-pro-low">Gemini Pro (Advanced)</SelectItem>
                </>
              ) : isImage ? (
                <>
                  <SelectItem value="gemini-image">Pollinations (Free)</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="gemini-video">Gemini Video (Beta)</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {isUI && (
           <div className="space-y-1.5">
             <Label className="text-xs text-muted-foreground">Dispositivo</Label>
             <div className="flex gap-1">
               {[
                 { id: "mobile", icon: Smartphone },
                 { id: "tablet", icon: Tablet },
                 { id: "desktop", icon: Monitor }
               ].map((d) => (
                 <Button
                   key={d.id}
                   variant={(payload.device || "desktop") === d.id ? "default" : "outline"}
                   size="sm"
                   onClick={() => updatePayload("device", d.id)}
                   className="flex-1 h-9 px-0 gap-1"
                 >
                   <d.icon className="h-3.5 w-3.5" />
                   <span className="text-[10px] uppercase font-bold">{d.id.slice(0, 3)}</span>
                 </Button>
               ))}
             </div>
           </div>
        )}

        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
          <Select
            value={(payload.aspect_ratio as string) ?? "1:1"}
            onValueChange={(v) => updatePayload("aspect_ratio", v)}
          >
            <SelectTrigger className="bg-muted border-none text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">1:1 (Cuadrado)</SelectItem>
              <SelectItem value="16:9">16:9 (Paisaje)</SelectItem>
              <SelectItem value="9:16">9:16 (Retrato)</SelectItem>
              <SelectItem value="4:3">4:3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seed */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Semilla (opcional)</Label>
          <Input
            type="number"
            placeholder="Aleatorio"
            value={(payload.seed as string) ?? ""}
            onChange={(e) => updatePayload("seed", e.target.value ? Number(e.target.value) : null)}
            className="bg-muted border-none text-xs font-mono"
          />
        </div>

        {/* Run button */}
        <Button
          onClick={() => onRun(selectedNodeId)}
          disabled={generating || data.status === "loading"}
          className="w-full gap-2 mt-2"
        >
          {data.status === "loading" ? (
            <div className="h-4 w-4 animate-spin-slow rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {data.status === "loading" ? "Generando..." : "Re-generar"}
        </Button>

        {/* Preview */}
        {data.status === "ready" && data.assetUrl && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Vista previa</Label>
            <div className="rounded-lg overflow-hidden border border-border">
              {isImage ? (
                <img src={data.assetUrl} alt={data.prompt} className="w-full object-cover" />
              ) : (
                <video src={data.assetUrl} controls muted className="w-full" />
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {data.status === "error" && data.errorMessage && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-xs text-destructive">{data.errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
