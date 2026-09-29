import { lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, ArrowLeft, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { CANVAS_ENABLED } from "@/lib/features";

const Formarketing = lazy(() => import("./Formarketing"));

// Ruta /studio-flow: canvas real si está liberado (o para admins), si no la
// pantalla de "Próximamente". Ver src/lib/features.ts.
export default function CanvasGate() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin(user?.id);

  if (CANVAS_ENABLED || isAdmin) return <Formarketing />;
  if (loading) return null;
  return <CanvasComingSoon />;
}

function CanvasComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full w-full items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Layers className="h-7 w-7" />
        </div>
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
          Próximamente
        </span>
        <h1 className="mt-4 font-display text-2xl font-black text-zinc-900">Canvas IA</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-500">
          Estamos preparando un editor visual para diseñar y ajustar tus piezas gráficas.
          Mientras tanto, puedes pedirle a Basalt textos, imágenes y planes de contenido.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => navigate("/a/basalt")}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-bold text-white hover:bg-primary/90"
          >
            <Brain className="h-4 w-4" />
            Ir a Basalt IA
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 px-5 py-2.5 text-[13px] font-bold text-zinc-600 hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
