import React from "react";

export function LoadingState() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-xl border-2 border-border border-t-primary animate-spin" />
        <p className="text-[11px] text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}
