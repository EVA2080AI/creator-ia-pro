import { useRef, useState } from "react";
import { AlertCircle, Brain, Check, Pencil, Plus, RotateCw, X } from "lucide-react";

// La memoria del usuario: lo que el asistente recuerda entre conversaciones.
//
// Hasta ahora SOLO la escribía el modelo (etiqueta <memoria> en su respuesta) y el
// usuario únicamente podía borrar un dato. Dos consecuencias feas: para enseñarle algo
// había que decírselo "de casualidad" en una conversación y esperar que lo guardara, y
// un dato mal recordado ("su empresa es X") solo se podía borrar y volver a intentar.
// Acá se puede añadir y corregir a mano, que es lo que la gente espera de algo que
// dice recordarla.
//
// Vivía como markup con estilos en línea dentro de Basalt.tsx; acá es un componente,
// porque ahora también lo usan los Expertos.

const MAX_FACTS = 60;
const MAX_LEN = 500;

interface Props {
  facts: string[];
  /** Recibe la lista completa ya modificada: quien llama guarda y actualiza su estado. */
  onChange: (next: string[]) => void;
  /** Sin sesión no se puede guardar nada: se muestra, pero no se deja editar. */
  readOnly?: boolean;
  /** No se pudo cargar: NO se deja editar, porque guardar sube la lista completa y
   *  escribiría encima de lo que sí hay en el servidor. */
  error?: boolean;
  onRetry?: () => void;
}

export function MemoryPanel({ facts, onChange, readOnly, error, onRetry }: Props) {
  const [editing, setEditing] = useState(-1);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const addRef = useRef<HTMLInputElement | null>(null);

  const commitEdit = () => {
    const texto = draft.trim().slice(0, MAX_LEN);
    const i = editing;
    setEditing(-1);
    if (i < 0 || !texto || texto === facts[i]) return;
    onChange(facts.map((f, k) => (k === i ? texto : f)));
  };

  const commitAdd = () => {
    const texto = draft.trim().slice(0, MAX_LEN);
    setAdding(false);
    // Repetido no: el modelo ya los junta, y dos iguales se ven como un error nuestro.
    if (!texto || facts.includes(texto)) return;
    onChange([...facts, texto]);
  };

  const startEdit = (i: number) => {
    setAdding(false);
    setEditing(i);
    setDraft(facts[i]);
  };

  const startAdd = () => {
    setEditing(-1);
    setDraft("");
    setAdding(true);
    requestAnimationFrame(() => addRef.current?.focus());
  };

  const keys = (onEnter: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); onEnter(); }
    if (e.key === "Escape") { e.preventDefault(); setEditing(-1); setAdding(false); }
  };

  if (error) {
    return (
      <p className="asst-conv-note asst-conv-error">
        <AlertCircle className="w-3.5 h-3.5" aria-hidden /> <span>No se pudo cargar tu memoria. No se guardará nada hasta recuperarla.</span>
        {onRetry && <button type="button" onClick={onRetry}><RotateCw className="w-3 h-3" aria-hidden /> Reintentar</button>}
      </p>
    );
  }

  return (
    <div className="asst-memory">
      {facts.length === 0 && !adding && (
        <p className="asst-memory-empty">Aún no recuerdo nada. Cuéntame de ti o de tu empresa, o añade un dato tú mismo.</p>
      )}

      {facts.map((fact, i) =>
        editing === i ? (
          <div key={i} className="asst-memory-row editing">
            <input
              className="asst-memory-input"
              value={draft}
              autoFocus
              maxLength={MAX_LEN}
              aria-label="Corregir el dato"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={keys(commitEdit)}
              onBlur={commitEdit}
            />
            <button className="asst-memory-btn" onMouseDown={(e) => e.preventDefault()} onClick={commitEdit} aria-label="Guardar el dato">
              <Check className="w-3 h-3" aria-hidden />
            </button>
          </div>
        ) : (
          <div key={i} className="asst-memory-row">
            <span className="asst-memory-text">{fact}</span>
            {!readOnly && (
              <>
                <button className="asst-memory-btn" onClick={() => startEdit(i)} aria-label={`Corregir «${fact}»`} title="Corregir">
                  <Pencil className="w-3 h-3" aria-hidden />
                </button>
                <button className="asst-memory-btn" onClick={() => onChange(facts.filter((_, k) => k !== i))} aria-label={`Olvidar «${fact}»`} title="Olvidar">
                  <X className="w-3 h-3" aria-hidden />
                </button>
              </>
            )}
          </div>
        ),
      )}

      {!readOnly && adding && (
        <div className="asst-memory-row editing">
          <input
            ref={addRef}
            className="asst-memory-input"
            value={draft}
            maxLength={MAX_LEN}
            placeholder="Mi empresa vende seguros a pymes"
            aria-label="Dato nuevo para recordar"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={keys(commitAdd)}
            onBlur={commitAdd}
          />
          <button className="asst-memory-btn" onMouseDown={(e) => e.preventDefault()} onClick={commitAdd} aria-label="Guardar el dato nuevo">
            <Check className="w-3 h-3" aria-hidden />
          </button>
        </div>
      )}

      {!readOnly && !adding && facts.length < MAX_FACTS && (
        <button className="asst-memory-add" onClick={startAdd}>
          <Plus className="w-3 h-3" aria-hidden /> Añadir un dato
        </button>
      )}
      {facts.length >= MAX_FACTS && (
        <p className="asst-memory-empty">Memoria llena ({MAX_FACTS} datos). Borra alguno para añadir otro.</p>
      )}
    </div>
  );
}

/** El botón del menú que abre y cierra el panel. */
export function MemoryToggle({ count, open, onToggle }: { count: number; open: boolean; onToggle: () => void }) {
  return (
    <button className="asst-side-link" data-tour="memoria" onClick={onToggle} aria-expanded={open}>
      <Brain className="w-4 h-4" /> Memoria ({count})
    </button>
  );
}
