import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Cpu,
  Zap,
  Crown,
  ChevronDown,
  Info,
  Code,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AI_MODELS, useAIProvider } from "@/hooks/useAIProvider";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  onModelSelect?: (modelId: string, isPro: boolean) => void;
  defaultOpen?: boolean;
  compact?: boolean;
}

export function ModelSelector({
  onModelSelect,
  defaultOpen = false,
  compact = false,
}: ModelSelectorProps) {
  const {
    selectedModel,
    selectModel,
    isPro,
    models,
    isOpenSource,
    isProModel,
  } = useAIProvider();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showProConfirm, setShowProConfirm] = useState(false);
  const [pendingProModel, setPendingProModel] = useState<string | null>(null);

  const handleModelClick = async (modelId: string, tier: string) => {
    if (tier === "pro") {
      setPendingProModel(modelId);
      setShowProConfirm(true);
      return;
    }

    const success = await selectModel(modelId);
    if (success && onModelSelect) {
      onModelSelect(modelId, false);
    }
    setIsOpen(false);
  };

  const confirmProModel = async () => {
    if (!pendingProModel) return;

    const success = await selectModel(pendingProModel, true);
    if (success && onModelSelect) {
      onModelSelect(pendingProModel, true);
    }
    setShowProConfirm(false);
    setPendingProModel(null);
    setIsOpen(false);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "open-source":
        return <Cpu className="h-4 w-4" />;
      case "freemium":
        return <Zap className="h-4 w-4" />;
      case "pro":
        return <Crown className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "open-source":
        return "text-emerald-500 bg-emerald-50 border-emerald-200";
      case "freemium":
        return "text-amber-500 bg-amber-50 border-amber-200";
      case "pro":
        return "text-purple-500 bg-purple-50 border-purple-200";
      default:
        return "text-zinc-500 bg-zinc-50 border-zinc-200";
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "open-source":
        return "🟢 Open Source";
      case "freemium":
        return "🟡 Freemium";
      case "pro":
        return "🔴 Pro";
      default:
        return "";
    }
  };

  if (compact) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center gap-2",
            isPro && "border-purple-300 bg-purple-50"
          )}
        >
          {selectedModel ? (
            <>
              {getTierIcon(selectedModel.tier)}
              <span className="max-w-[100px] truncate">
                {selectedModel.name}
              </span>
            </>
          ) : (
            <>
              <Cpu className="h-4 w-4" />
              <span>Seleccionar modelo</span>
            </>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>

        <ModelDialog />
      </>
    );
  }

  function ModelDialog() {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Seleccionar modelo de IA
            </DialogTitle>
            <DialogDescription>
              Los modelos Open Source son gratuitos. Los modelos Pro consumen
              créditos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Open Source Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-emerald-100">
                  <Cpu className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-zinc-900">
                  Open Source (Recomendado)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Gratuito
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {models.openSource.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel?.id === model.id}
                    onClick={() => handleModelClick(model.id, model.tier)}
                  />
                ))}
              </div>
            </section>

            {/* Freemium Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-amber-100">
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="font-semibold text-zinc-900">Freemium</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Con límites
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {models.freemium.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel?.id === model.id}
                    onClick={() => handleModelClick(model.id, model.tier)}
                  />
                ))}
              </div>
            </section>

            {/* Pro Section */}
            <section className="border-t border-zinc-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-purple-100">
                  <Crown className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-zinc-900">Modelos Pro</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Consume créditos
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Los modelos Pro son más capaces pero consumen tus créditos.
                    Solo úsalos cuando los modelos open source no sean
                    suficientes.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {models.pro.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel?.id === model.id}
                    onClick={() => handleModelClick(model.id, model.tier)}
                  />
                ))}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  function ModelCard({
    model,
    isSelected,
    onClick,
  }: {
    model: (typeof AI_MODELS.openSource)[0];
    isSelected: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "relative p-3 rounded-xl border text-left transition-all",
          "hover:shadow-md hover:border-primary/50",
          isSelected
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-zinc-200 bg-white hover:bg-zinc-50",
          model.tier === "pro" && "border-purple-200 hover:border-purple/50"
        )}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-1.5 rounded-md",
                getTierColor(model.tier).split(" ").slice(1).join(" ")
              )}
            >
              {getTierIcon(model.tier)}
            </div>
            <span className="font-semibold text-sm">{model.name}</span>
          </div>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-primary"
            >
              <Check className="h-4 w-4" />
            </motion.div>
          )}
        </div>

        <p className="text-xs text-zinc-500 mb-2">{model.description}</p>

        <div className="flex flex-wrap gap-1">
          {model.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600"
            >
              {tag}
            </span>
          ))}
        </div>

        {model.tier === "pro" && "cost" in model && (
          <div className="mt-2 text-xs text-purple-600 font-medium">
            💰 {model.cost}
          </div>
        )}

        {"limits" in model && (
          <div className="mt-2 text-xs text-amber-600">
            ⏱️ {model.limits}
          </div>
        )}
      </button>
    );
  }

  // Pro Confirmation Dialog
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          {/* ... content from above */}
        </DialogContent>
      </Dialog>

      <Dialog open={showProConfirm} onOpenChange={setShowProConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar uso de modelo Pro
            </DialogTitle>
            <DialogDescription>
              Estás a punto de usar un modelo que consume créditos. ¿Deseas
              continuar?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-purple-900">
                {models.pro.find((m) => m.id === pendingProModel)?.name}
              </span>
            </div>
            <p className="text-sm text-purple-700 mb-2">
              {models.pro.find((m) => m.id === pendingProModel)?.description}
            </p>
            <p className="text-xs text-purple-600">
              💰{" "}
              {models.pro.find((m) => m.id === pendingProModel)?.cost}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowProConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={confirmProModel}
            >
              Usar modelo Pro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
