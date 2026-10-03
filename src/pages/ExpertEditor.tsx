import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { CHAT_MODELS, DEFAULT_MODEL_ID, canAccessModel } from "@/lib/ai/models";
import {
  createAssistant, deleteAssistant, getAssistant, updateAssistant,
  type Assistant, type AssistantWelcomeCard,
} from "@/lib/assistants";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// "Mis expertos" — nuestros Gems, pero con los 11 ya escritos como punto de partida.
//
// La API estaba completa desde hacía semanas (POST/PATCH/DELETE con los permisos
// correctos) y createAssistant/updateAssistant/deleteAssistant eran código muerto en
// src/lib/assistants.ts: no había pantalla. Lo que de verdad nos diferencia de un Gem
// vacío es "Duplicar y ajustar": se parte de un experto real del dominio en vez de una
// hoja en blanco, que es donde la gente abandona.

const MAX_CARDS = 4;

/** Lo que se edita acá. El resto del asistente (marca, capacidades) se hereda. */
interface Draft {
  name: string;
  tagline: string;
  systemPrompt: string;
  defaultModel: string;
  cards: AssistantWelcomeCard[];
}

const EMPTY: Draft = {
  name: "",
  tagline: "",
  systemPrompt: "",
  defaultModel: DEFAULT_MODEL_ID,
  cards: [],
};

const toDraft = (a: Assistant, copia: boolean): Draft => ({
  name: copia ? `${a.name} (mi versión)` : a.name,
  tagline: a.tagline ?? "",
  systemPrompt: a.persona?.systemPrompt ?? "",
  defaultModel: a.defaultModel || DEFAULT_MODEL_ID,
  cards: (a.welcome?.cards ?? []).slice(0, MAX_CARDS).map((c) => ({ label: c.label, prompt: c.prompt, icon: c.icon })),
});

const label = "block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2";
const field = "w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

export default function ExpertEditor() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const desde = params.get("desde");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth("/auth");
  const { profile } = useProfile(user?.id);
  const tier = profile?.subscription_tier;

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [original, setOriginal] = useState<Assistant | null>(null);
  const [loading, setLoading] = useState(!!slug || !!desde);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editing = !!slug;
  /** Un experto del sistema no se edita: se duplica (lo mismo que responde la API). */
  const readOnly = editing && original?.visibility === "system";

  useEffect(() => {
    const fuente = slug || desde;
    if (!fuente) return;
    let vivo = true;
    setLoading(true);
    void getAssistant(fuente).then((a) => {
      if (!vivo) return;
      if (a) {
        setOriginal(slug ? a : null);
        setDraft(toDraft(a, !slug));
      } else {
        toast.error("No encontré ese experto.");
      }
      setLoading(false);
    });
    return () => { vivo = false; };
  }, [slug, desde]);

  const models = useMemo(() => CHAT_MODELS.filter((m) => canAccessModel(tier, m.minTier)), [tier]);

  const setCard = (i: number, patch: Partial<AssistantWelcomeCard>) =>
    setDraft((d) => ({ ...d, cards: d.cards.map((c, k) => (k === i ? { ...c, ...patch } : c)) }));

  const save = useCallback(async () => {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Ponle un nombre a tu experto.");
      return;
    }
    if (!draft.systemPrompt.trim()) {
      toast.error("Escribe las instrucciones: es lo que hace distinto a tu experto.");
      return;
    }
    setSaving(true);
    // Las tarjetas vacías no se guardan: una tarjeta sin prompt en la bienvenida
    // manda un mensaje en blanco al modelo.
    const cards = draft.cards.filter((c) => c.label.trim() && c.prompt.trim());
    const payload = {
      name,
      tagline: draft.tagline.trim(),
      persona: { systemPrompt: draft.systemPrompt.trim() },
      defaultModel: draft.defaultModel,
      welcome: {
        title: `Hola, soy ${name}`,
        subtitle: draft.tagline.trim() || "¿En qué te ayudo hoy?",
        cards,
      },
    };
    const saved = slug && !readOnly ? await updateAssistant(slug, payload) : await createAssistant(payload);
    setSaving(false);
    if (!saved) {
      toast.error("No se pudo guardar tu experto. Inténtalo de nuevo.");
      return;
    }
    toast.success(slug && !readOnly ? "Experto actualizado." : "Experto creado.");
    navigate(`/a/${saved.slug}`);
  }, [draft, slug, readOnly, navigate]);

  const remove = useCallback(async () => {
    if (!slug) return;
    setConfirmDelete(false);
    const ok = await deleteAssistant(slug);
    if (!ok) {
      toast.error("No se pudo borrar el experto.");
      return;
    }
    toast.success("Experto borrado.");
    navigate("/a/basalt");
  }, [slug, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>{editing ? `Editar ${draft.name}` : "Crear un experto"} | Creator IA Pro</title></Helmet>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-5 md:py-10 pb-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="mb-6">
          <p className="hidden md:block text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Mis expertos</p>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
            {editing ? draft.name || "Editar experto" : desde ? "Duplicar y ajustar" : "Crear un experto"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Un experto es un chat con instrucciones propias: su tono, lo que sabe de ti y de tu negocio, y en qué formato responde.
          </p>
        </div>

        {readOnly && (
          <div className="rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground mb-6">
            Los expertos que vienen con la plataforma no se editan — pero puedes quedarte con una copia tuya y cambiarle lo que quieras.{" "}
            <button className="font-semibold text-primary" onClick={() => navigate(`/expertos/nuevo?desde=${slug}`)}>
              Duplicar este experto
            </button>
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-3xl bg-card/70 border border-border/60 p-6 md:p-8 space-y-5">
            <div>
              <label className={label} htmlFor="exp-name">Nombre</label>
              <input id="exp-name" className={field} value={draft.name} maxLength={60} placeholder="Experto en licitaciones"
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="exp-tagline">Descripción corta</label>
              <input id="exp-tagline" className={field} value={draft.tagline} maxLength={140} placeholder="Revisa pliegos y arma propuestas"
                onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="exp-prompt">Instrucciones</label>
              <textarea
                id="exp-prompt"
                className={`${field} min-h-[220px] leading-relaxed font-mono text-[13px]`}
                value={draft.systemPrompt}
                maxLength={12000}
                placeholder={"Eres un experto en… Hablas en español, en tono cercano.\n\nCuando te pidan X, entrega: 1) … 2) …\nNunca inventes datos: si falta información, pregunta."}
                onChange={(e) => setDraft((d) => ({ ...d, systemPrompt: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Es el mensaje que recibe el modelo antes de cada conversación. Sé concreto: qué sabe, para quién trabaja, qué formato usa y qué no debe hacer.
              </p>
            </div>
            <div>
              <label className={label} htmlFor="exp-model">Modelo por defecto</label>
              <select id="exp-model" className={field} value={draft.defaultModel}
                onChange={(e) => setDraft((d) => ({ ...d, defaultModel: e.target.value }))}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.free ? "gratis" : `${m.credits} cr`}{m.vision ? " · ve imágenes" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-3xl bg-card/70 border border-border/60 p-6 md:p-8">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Tarjetas de bienvenida</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Los atajos que ve quien abre el chat. Dejarlas vacías también está bien: la pantalla queda limpia.
            </p>
            <div className="space-y-3">
              {draft.cards.map((c, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2">
                  <input className={`${field} sm:w-56`} value={c.label} maxLength={60} placeholder="Revisar un pliego"
                    aria-label={`Título de la tarjeta ${i + 1}`}
                    onChange={(e) => setCard(i, { label: e.target.value })} />
                  <input className={field} value={c.prompt} maxLength={500} placeholder="Revisa este pliego y dime los riesgos…"
                    aria-label={`Mensaje de la tarjeta ${i + 1}`}
                    onChange={(e) => setCard(i, { prompt: e.target.value })} />
                  <button type="button" className="shrink-0 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                    aria-label={`Quitar la tarjeta ${i + 1}`}
                    onClick={() => setDraft((d) => ({ ...d, cards: d.cards.filter((_, k) => k !== i) }))}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {draft.cards.length < MAX_CARDS && (
              <button type="button" className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary"
                onClick={() => setDraft((d) => ({ ...d, cards: [...d.cards, { label: "", prompt: "" }] }))}>
                <Plus className="w-4 h-4" /> Agregar tarjeta
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : readOnly ? <Sparkles className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {readOnly ? "Guardar como experto mío" : editing ? "Guardar cambios" : "Crear experto"}
            </button>
            {editing && !readOnly && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                <Trash2 className="w-4 h-4" /> Borrar
              </button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar «{draft.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borra el experto, no las conversaciones que tuviste con él. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>Borrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
