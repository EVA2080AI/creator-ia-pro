// Lo que ve quien vuelve de pagar en Bold (/pricing?status=payment_returned&pack=…).
//
// Antes no veía NADA: la página de planes ignoraba el regreso y el confeti se disparaba
// al hacer clic en "comprar", antes de pagar. Ahora se le pregunta al servidor —que le
// pregunta a Bold— y se dice la verdad: aprobado, en proceso o sin pago.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { CheckCircle2, CircleAlert, Clock, FlaskConical, Loader2, X } from "lucide-react";
import { boldService, PaymentCheckError, type PaymentCheck } from "@/services/billing-service";
import { RETRY_DELAYS, UNPAID_RETRIES } from "./payment-retry";

const PLAN_NAME: Record<string, string> = { creador: "Creador", pro: "Pro", agencia: "Agencia", pyme: "Pyme" };

type View =
  | { kind: "checking"; processing: boolean }
  | { kind: "approved"; check: PaymentCheck }
  | { kind: "processing" }
  | { kind: "unpaid" }
  | { kind: "sandbox" }
  | { kind: "none" }
  | { kind: "uncredited" }
  | { kind: "error"; auth: boolean };

function copy(view: View): { title: string; body: string } {
  switch (view.kind) {
    case "checking":
      return view.processing
        ? { title: "Bold está procesando tu pago…", body: "Puede tardar un momento. No cierres esta página." }
        : { title: "Confirmando tu pago con Bold…", body: "Tarda unos segundos. No cierres esta página." };
    case "approved": {
      const credits = (view.check.credits ?? 0).toLocaleString("es-CO");
      const plan = view.check.isPlan ? PLAN_NAME[view.check.packId ?? ""] : null;
      return {
        title: "Pago aprobado",
        body: plan
          ? `Tu plan ${plan} quedó activo por 30 días y se sumaron ${credits} créditos a tu cuenta.`
          : `Se sumaron ${credits} créditos a tu cuenta.`,
      };
    }
    case "processing":
      return { title: "Tu pago está en proceso", body: "Bold todavía lo está confirmando; con PSE puede tardar unos minutos. Cuando se apruebe, los créditos aparecen solos en tu cuenta." };
    case "unpaid":
      return { title: "No se completó el pago", body: "Bold no registra un pago aprobado para esta compra. Si pagaste, los créditos se suman solos en cuanto Bold lo confirme; si no, puedes intentarlo de nuevo." };
    case "sandbox":
      return { title: "Pago de prueba", body: "Esta compra se hizo en el modo de pruebas de Bold: no se cobró nada y no suma créditos." };
    case "none":
      return { title: "No encontramos una compra reciente", body: "Si acabas de pagar y en unos minutos no ves tus créditos, escríbenos y lo revisamos." };
    case "uncredited":
      // El servidor confirmó el pago con Bold pero no pudo sumar los créditos: acá NO se
      // promete que "se suman solos", porque no va a pasar sin que alguien lo mire.
      return { title: "Tu pago está aprobado, pero falta sumar los créditos", body: "Bold confirmó el pago y algo falló al acreditarlo en tu cuenta. Escríbenos y lo resolvemos; no tienes que pagar de nuevo." };
    case "error":
      return view.auth
        ? { title: "Inicia sesión para ver tu pago", body: "Tu sesión se cerró mientras pagabas. El pago no se pierde: entra de nuevo y los créditos estarán en tu cuenta cuando Bold lo confirme." }
        : { title: "No pudimos consultar tu pago", body: "Si pagaste, no se pierde: los créditos se suman solos cuando Bold lo confirme. Vuelve a revisar en un momento." };
  }
}

/**
 * `likelyPaid`: Bold devolvió al comprador diciendo que el pago fue aprobado
 * (`bold-tx-status=approved`). NO decide nada —viene del navegador—: solo hace que se
 * insista más tiempo antes de decir "no se completó el pago" a quien probablemente pagó.
 */
export function PaymentReturn({ pack, likelyPaid = false, onClose }: { pack: string | null; likelyPaid?: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>({ kind: "checking", processing: false });
  // «Volver a revisar» solo cambia este número: la consulta vive entera en el efecto.
  const [round, setRound] = useState(0);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    setView({ kind: "checking", processing: false });

    const ask = async () => {
      try {
        const result = await boldService.confirmPayment(pack);
        if (!alive) return;
        if (result.state === "approved") {
          setView({ kind: "approved", check: result });
          // El saldo y el plan del menú salen del perfil en caché: que se vuelvan a pedir.
          void queryClient.invalidateQueries({ queryKey: ["profile"] });
          if (result.fresh && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
            void confetti({ particleCount: 120, spread: 70, origin: { y: 0.3 }, colors: ["#ffffff", "#4ade80", "#a855f7"] });
          }
          return;
        }
        if (result.state === "sandbox" || result.state === "none") {
          setView({ kind: result.state });
          return;
        }
        const limit = result.state === "processing" || likelyPaid ? RETRY_DELAYS.length : UNPAID_RETRIES;
        if (attempt < limit) {
          setView({ kind: "checking", processing: result.state === "processing" });
          timer = setTimeout(ask, RETRY_DELAYS[attempt++]);
          return;
        }
        setView({ kind: result.state });
      } catch (err) {
        if (!alive) return;
        const code = err instanceof PaymentCheckError ? err.code : undefined;
        // El servidor pide espaciar las consultas: se vuelve a preguntar, no es un fallo.
        if (code === "TOO_MANY" && attempt < RETRY_DELAYS.length) {
          timer = setTimeout(ask, RETRY_DELAYS[attempt++]);
          return;
        }
        setView(code === "INTERNAL_ERROR" ? { kind: "uncredited" } : { kind: "error", auth: code === "UNAUTHORIZED" });
      }
    };
    void ask();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [pack, likelyPaid, queryClient, round]);

  const { title, body } = copy(view);
  const canRetry = view.kind === "processing" || view.kind === "unpaid" || (view.kind === "error" && !view.auth);

  return (
    <div className="fixed inset-x-0 top-[76px] z-40 flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        data-payment-state={view.kind}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0" aria-hidden="true">
            {view.kind === "checking" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {view.kind === "approved" && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            {view.kind === "processing" && <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            {view.kind === "sandbox" && <FlaskConical className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />}
            {view.kind === "uncredited" && <CircleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            {(view.kind === "unpaid" || view.kind === "none" || view.kind === "error") && <CircleAlert className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-snug text-zinc-900 dark:text-zinc-100">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>

            {view.kind !== "checking" && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {view.kind === "approved" && (
                  <Link to="/a/basalt" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                    Ir a Basalt
                  </Link>
                )}
                {view.kind === "error" && view.auth && (
                  <Link to="/auth" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                    Iniciar sesión
                  </Link>
                )}
                {canRetry && (
                  <button type="button" onClick={() => setRound((n) => n + 1)} className="inline-flex h-10 items-center rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    Volver a revisar
                  </button>
                )}
                {view.kind === "uncredited" && (
                  <Link to="/contact" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                    Escríbenos
                  </Link>
                )}
                {(view.kind === "none" || view.kind === "unpaid" || (view.kind === "error" && !view.auth)) && (
                  <Link to="/contact" className="inline-flex h-10 items-center text-[13px] font-bold text-zinc-700 dark:text-zinc-300 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
                    Escríbenos
                  </Link>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso"
            className="-mr-1.5 -mt-1.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
