import { IMAGE_MODEL_MAP, TEXT_MODEL_MAP } from '@/services/ai-service';
import { getImageModel, getModel } from '@/lib/ai/models';

// Fase 1 — "el gasto es explícito": cada nodo muestra lo que cuesta SU modelo
// antes de ejecutar. Los créditos salen del catálogo canónico
// (src/lib/ai/models.ts) traduciendo los ids de vitrina con los mismos mapas
// que usa la ejecución — un id desconocido cae al modelo gratis por defecto,
// igual que hace el servidor.
export function textCredits(vitrinaId?: string): number {
  const canon = TEXT_MODEL_MAP[vitrinaId ?? ''] ?? vitrinaId ?? '';
  return getModel(canon).credits;
}

export function imageCredits(vitrinaId?: string): number {
  const canon = IMAGE_MODEL_MAP[vitrinaId ?? ''] ?? vitrinaId ?? '';
  return getImageModel(canon).credits;
}

export const fmtCredits = (n: number): string => (n === 0 ? 'Gratis' : `${n} cr`);
