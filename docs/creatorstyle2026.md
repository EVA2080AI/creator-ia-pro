# creatorstyle2026 (Onyx/Glass)
## Design System Documentation

**`creatorstyle2026`** is a high-end, developer-centric design system engineered for the next generation of IA-powered tools. It prioritizes visual depth, high-speed interaction, and reduced cognitive load through a "Glassmorphism" aesthetic and "Onyx" color tokens.

---

## 🎨 1. Color Palette: The Onyx Foundation

The system relies on a deep, desaturated black for backgrounds to maximize the contrast of pure white text and vibrant glass accents.

| Token | Value | Role |
| :--- | :--- | :--- |
| **Background (Onyx)** | `#0b0c10` | Global page background, deep focus. |
| **Surface (Glass)** | `rgba(255,255,255,0.03)` | Base for cards and sidebars. Always paired with blur. |
| **Primary (White)** | `#ffffff` | Primary buttons (text-black), important headers. |
| **Brand (Blue)** | `#0066FF` | Action accents, focus rings, progress indicators. |
| **Subtle (Muted)** | `rgba(255,255,255,0.4)` | Secondary text, inactive states. |
| **Border (Line)** | `rgba(255,255,255,0.08)` | Ultra-thin borders for structural definition. |

---

## ✨ 2. Visual Effects: Glassmorphism

The signature "Glass" look is achieved by combining transparency with high-quality Gaussian blurs.

- **Standard Blur**: `backdrop-blur-md` (12px) for secondary panels.
- **Premium Blur**: `backdrop-blur-xl` (24px) for modals and headers.
- **Overlay**: `bg-background/80` for fixed headers to allow content to "peek" through.

---

## 📐 3. Geometry & Spacing

Creator Style uses aggressive rounding and tight spacing to feel both modern and industrial.

- **Containers (Cards/Modals)**: `rounded-2xl` (16px) or `rounded-3xl` (24px).
- **Interactive (Buttons/Inputs)**: `rounded-xl` (12px) or `rounded-2xl` (16px).
- **Icon Boxes**: `rounded-xl` with `bg-white/5` background.
- **Focus Rings**: 2px solid with 4px offset in Brand Blue.

---

## ✍️ 4. Typography: Clarity & Hierarchy

- **Primary Font**: `Inter` (Sans-serif) for body and interface logic.
- **Display Font**: `Outfit` or `Inter` (Font-black) for high-impact headers.
- **Monospace**: `JetBrains Mono` or `Consolas` for code blocks and credit counters.
- **Tracking**: `tracking-tight` for titles; `tracking-[0.2em] uppercase` for micro-labels.

---

## 🏗️ 5. Layout Philosophy: The Triple-Pane IDE

The defining layout of the 2026 ecosystem is the **Triple-Pane Resizable Shell**:

1.  **Control Plane (Left)**: Collapsible Sidebar for file trees and context.
2.  **Working Plane (Center)**: Main content area (Preview or Code).
3.  **Agent Plane (Right)**: Genesis AI Chat assistant for real-time collaboration.

---

## 📎 6. CSS Variable Reference (`index.css`)

```css
:root {
  --background: 240 10% 3.9%;   /* Deep Onyx #0b0c10 */
  --foreground: 0 0% 98%;       /* Soft White */
  --card: 240 10% 4.8%;
  --border: 240 5.9% 10%;       /* Subtle 10% line */
  --primary: 0 0% 100%;         /* Pure White Action */
  --primary-foreground: 240 5.9% 10%;
  --radius: 12px;
}
```

---

## 📝 7. Component Spec Examples

### Premium Card
```tsx
<div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6">
  {content}
</div>
```

### Action Button
```tsx
<button className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm active:scale-95 transition-all">
  Confirmar Acción
</button>
```

---

**creatorstyle2026** — *The future of coding interfaces, built for Creator IA Pro.*
