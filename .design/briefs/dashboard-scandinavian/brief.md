# Brief: Dashboard — identidad Scandinavian

## Contexto

- ¿Por qué ahora? El usuario pidió explícitamente un "ciclo de automejoras... con look diferente". `.design/skills/frontend-design.md` ya prescribe Scandinavian para el Dashboard desde hace meses, nunca se implementó — todo el Dashboard usaba la misma escala de gris fría (`zinc-*`) que el resto de la app, sin ninguna diferenciación real entre superficies.
- ¿Qué problema resuelve? El Dashboard es la primera pantalla que ve cualquier usuario después de loguearse — es la superficie con más impacto en la percepción de "esto se ve diferente/cuidado".

## Filosofía aplicada: Scandinavian (`.design/philosophies/scandinavian.md`)

> "Warmth plus restraint. Rounded. Accessible by default."

- **Colores neutros cálidos**: escala `stone-*` de Tailwind (gris con base cálida) en vez de `zinc-*` (gris frío) — mismo número de pasos, mismo contraste, distinto tinte. Aplicado en `Dashboard.tsx` y sus 6 componentes exclusivos (`ProjectCard`, `StatCard`, `ChartSection`, `LoadingState`, `CheckoutBanner`, `WelcomeOnboarding` — confirmado con grep que ninguno se usa fuera del Dashboard, cero riesgo de que el cambio se filtre a otra superficie).
- Los colores hex embebidos directamente en el gráfico de `ChartSection.tsx` (recharts no acepta clases de Tailwind, solo strings) se alinearon a los valores hex reales de `stone-100/400/200/900` en vez de dejar el gráfico con tinte frío mientras la tarjeta que lo envuelve es cálida.
- No se tocó `src/index.css` ni ningún token global — el cambio es exclusivo del Dashboard vía clases locales, no afecta ninguna otra página.

## Exploración de codebase

- Componentes reutilizados: ninguno nuevo, solo se re-skinnearon los 6 ya existentes.
- Confirmado (grep) que `stone` es un color estándar de Tailwind ya disponible sin cambios de config (`tailwind.config.ts` solo *extiende* la paleta con tokens semánticos propios, no la reemplaza).

## Notas / restricciones

- No pude verificar el resultado visualmente — requiere sesión iniciada y esta sesión tiene la regla dura de no loguearse en nombre del usuario. Verificado por código: `lint`/`typecheck`/`test`/`build` en verde, grep confirma que no queda ningún `zinc-` residual ni artefactos de doble-reemplazo (`stone-stone`).
- Pendiente real: confirmación visual del usuario en su cuenta.
