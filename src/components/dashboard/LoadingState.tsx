import React from "react";

// h-full/w-full, no h-screen/w-screen: este loading state vive dentro de
// .asst-shell-scroller (BasaltAppLayout) además del layout viejo — w-screen
// se salía del ancho disponible y generaba scroll horizontal (QA post-
// migración, 2026-09-29).
export function LoadingState() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-xl border-2 border-border border-t-primary animate-spin" />
        <p className="text-[11px] text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}
