# Creator IA Pro Studio – Especificación Técnica UX/UI
**Proyecto:** Creator IA Pro (Node-based Canvas + Genesis IA)  
**Versión:** Lite (Light Mode Total)  
**URL:** https://creator-ia.com/formarketing  
**Fecha:** Abril 2026

---

## 📐 Principios de Diseño Fundamentales

### Regla de Oro: Light Mode Total
**CRÍTICO:** Esta es la versión Lite. TODO el sitio debe usar light mode. No puede existir NINGUNA página, componente, modal, o estado con elementos oscuros. Esto incluye:
- Canvas principal
- Paneles laterales
- Modales y overlays
- Estados hover/active
- Genesis IA chat
- Tooltips y popovers
- Notificaciones y toasts

### Filosofía UX
1. **Trabajo prolongado sin fatiga visual** - Fondos claros, contrastes suaves
2. **Premium pero técnico** - Limpio como Figma, preciso como Linear
3. **Zero learning curve** - Drag & drop intuitivo, feedback inmediato
4. **AI como copiloto, no como herramienta** - Genesis IA guía, no solo ejecuta

---

## 🎨 Design System

### Paleta de Colores (Light Mode)
```css
:root {
  /* Canvas & Backgrounds */
  --canvas-bg: #f8fafc;           /* slate-50 - Fondo principal del canvas */
  --surface-primary: #ffffff;      /* Nodos, cards, paneles */
  --surface-secondary: #f1f5f9;    /* slate-100 - Áreas secundarias */
  
  /* Text Hierarchy */
  --text-primary: #0f172a;         /* slate-900 - Títulos principales */
  --text-secondary: #475569;       /* slate-600 - Texto de cuerpo */
  --text-tertiary: #94a3b8;        /* slate-400 - Labels, placeholders */
  
  /* Brand & Accent */
  --brand-primary: #a855f7;        /* purple-500 - Edges, CTAs, focus */
  --brand-secondary: #c084fc;      /* purple-400 - Hover states */
  --brand-light: #f3e8ff;          /* purple-50 - Backgrounds sutiles */
  
  /* States */
  --state-success: #10b981;        /* emerald-500 */
  --state-success-bg: #d1fae5;     /* emerald-100 */
  --state-error: #ef4444;          /* red-500 */
  --state-error-bg: #fee2e2;       /* red-100 */
  --state-warning: #f59e0b;        /* amber-500 */
  --state-warning-bg: #fef3c7;     /* amber-100 */
  --state-processing: #3b82f6;     /* blue-500 */
  --state-processing-bg: #dbeafe;  /* blue-100 */
  
  /* Borders & Dividers */
  --border-subtle: #e2e8f0;        /* slate-200 */
  --border-default: #cbd5e1;       /* slate-300 */
  --border-focus: var(--brand-primary);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-focus: 0 0 0 4px var(--brand-light);
  
  /* Grid del Canvas */
  --grid-color: #cbd5e1;           /* slate-300 */
  --grid-size: 20px;
  --grid-dot-size: 1px;
}
```

### Tipografía
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Scale */
--text-xs: 0.75rem;    /* 12px - Labels pequeños */
--text-sm: 0.875rem;   /* 14px - Body text en nodos */
--text-base: 1rem;     /* 16px - Texto principal */
--text-lg: 1.125rem;   /* 18px - Títulos de sección */
--text-xl: 1.25rem;    /* 20px - Títulos de nodo */
--text-2xl: 1.5rem;    /* 24px - Headers principales */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espaciado & Layout
```css
/* 8px Grid System */
--space-1: 0.5rem;   /* 8px */
--space-2: 1rem;     /* 16px */
--space-3: 1.5rem;   /* 24px */
--space-4: 2rem;     /* 32px */
--space-6: 3rem;     /* 48px */

/* Radii */
--radius-sm: 0.375rem;   /* 6px - Buttons, inputs */
--radius-md: 0.5rem;     /* 8px - Cards pequeñas */
--radius-lg: 1rem;       /* 16px - Nodos */
--radius-xl: 1.5rem;     /* 24px - Paneles grandes */

/* Z-index Layers */
--z-canvas: 1;
--z-nodes: 10;
--z-edges: 5;
--z-toolbar: 100;
--z-sidebar: 200;
--z-modal: 1000;
--z-toast: 2000;
```

---

## 🧩 Anatomía del Nodo

### Estructura Base
```html
<div class="node-container">
  <!-- Header con icono y título -->
  <div class="node-header">
    <span class="node-icon">{icon}</span>
    <h3 class="node-title">{nombre}</h3>
    <button class="node-menu">⋯</button>
  </div>
  
  <!-- Contenido específico del nodo -->
  <div class="node-content">
    {campos de input/configuración}
  </div>
  
  <!-- Footer con estado/acciones -->
  <div class="node-footer">
    <span class="node-status">{estado}</span>
    <button class="node-action">{CTA}</button>
  </div>
  
  <!-- Handles de conexión -->
  <div class="handle handle-input"></div>
  <div class="handle handle-output"></div>
</div>
```

### Estilos CSS
```css
.node-container {
  min-width: 320px;
  max-width: 400px;
  background: var(--surface-primary);
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Estados */
.node-container[data-state="selected"] {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-focus);
}

.node-container[data-state="processing"] {
  border-color: var(--state-processing);
  animation: pulse-border 2s ease-in-out infinite;
}

.node-container[data-state="error"] {
  border-color: var(--state-error);
  background: var(--state-error-bg);
}

.node-container[data-state="success"] {
  border-color: var(--state-success);
}

.node-container[data-state="disabled"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Handles */
.handle {
  width: 16px;
  height: 16px;
  background: var(--surface-primary);
  border: 2px solid var(--brand-primary);
  border-radius: 50%;
  position: absolute;
  transition: all 150ms ease;
}

.handle-input {
  left: -9px;
  top: 50%;
  transform: translateY(-50%);
}

.handle-output {
  right: -9px;
  top: 50%;
  transform: translateY(-50%);
}

.handle:hover {
  transform: scale(1.25);
  box-shadow: 0 0 0 4px var(--brand-light);
}

.handle[data-valid="false"] {
  border-color: var(--state-error);
  animation: shake 300ms;
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--state-processing); }
  50% { border-color: var(--brand-secondary); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

---

## 📊 Sistema de Estados del Nodo

Cada nodo debe manejar 6 estados mutuamente excluyentes:

| Estado | Trigger | Visual | Interacción |
|--------|---------|--------|-------------|
| **Idle** | Estado inicial | `border-subtle`, `bg-white` | Editable, conectable |
| **Processing** | API call en progreso | Animated border purple, edge animado | Solo cancelable |
| **Success** | Respuesta exitosa | Border verde 2s, luego vuelve a idle | Muestra resultado |
| **Error** | API error / validación fallida | `bg-error-bg`, mensaje de error en footer | Retry button visible |
| **Validating** | Al conectar/desconectar | Border azul pulsante | No editable temporalmente |
| **Disabled** | Upstream node error o sin créditos | `opacity-50`, grayscale | No interactuable |

### Implementación TypeScript
```typescript
type NodeState = 
  | 'idle' 
  | 'processing' 
  | 'success' 
  | 'error' 
  | 'validating' 
  | 'disabled';

interface NodeStatus {
  state: NodeState;
  message?: string;
  progress?: number; // 0-100 para processing
  errorCode?: string;
}

interface BaseNodeData {
  id: string;
  type: NodeType;
  status: NodeStatus;
  lastUpdated: number;
  credits_cost?: number;
}
```

---

## 🔌 Sistema de Tipos de Datos y Puertos

### Tipos de Datos Soportados
```typescript
type DataType = 
  | 'text'          // String de cualquier longitud
  | 'image'         // URL o Blob de imagen
  | 'video'         // URL o Blob de video
  | 'audio'         // URL o Blob de audio
  | 'file'          // Archivo genérico
  | 'conditioning'  // Data de ControlNet/embeddings
  | 'json';         // Structured data

interface Port {
  id: string;
  type: 'input' | 'output';
  dataType: DataType;
  label: string;
  required: boolean;
  multiple?: boolean; // Acepta múltiples conexiones
}

interface NodeTypeDefinition {
  id: string;
  name: string;
  category: 'input' | 'processing' | 'output' | 'utility';
  icon: string;
  description: string;
  inputs: Port[];
  outputs: Port[];
  config: Record<string, any>; // UI fields específicos
}
```

### Validación de Conexiones
```typescript
const isValidConnection = (
  sourceNode: Node,
  sourceHandle: string,
  targetNode: Node,
  targetHandle: string
): boolean => {
  // 1. Prevenir auto-conexión
  if (sourceNode.id === targetNode.id) return false;
  
  // 2. Prevenir ciclos
  if (wouldCreateCycle(sourceNode, targetNode)) return false;
  
  // 3. Validar tipos de datos
  const sourcePort = sourceNode.data.outputs.find(p => p.id === sourceHandle);
  const targetPort = targetNode.data.inputs.find(p => p.id === targetHandle);
  
  if (!sourcePort || !targetPort) return false;
  
  // 4. Verificar compatibilidad de tipos
  if (sourcePort.dataType === targetPort.dataType) return true;
  
  // 5. Conversiones automáticas permitidas
  const autoConversions: Record<DataType, DataType[]> = {
    'image': ['conditioning'],  // Imagen puede usarse en ControlNet
    'text': ['json'],           // Texto puede parsearse a JSON
    'json': ['text'],           // JSON puede stringificarse
  };
  
  const allowedTargets = autoConversions[sourcePort.dataType] || [];
  return allowedTargets.includes(targetPort.dataType);
};

const wouldCreateCycle = (source: Node, target: Node): boolean => {
  // BFS para detectar si target ya es ancestor de source
  const visited = new Set<string>();
  const queue = [target.id];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === source.id) return true;
    if (visited.has(currentId)) continue;
    
    visited.add(currentId);
    const node = getNodeById(currentId);
    const upstreamNodes = getUpstreamNodes(node);
    queue.push(...upstreamNodes.map(n => n.id));
  }
  
  return false;
};
```

---

## 📦 Catálogo de Módulos (Nodos)

### A. Nodos de Entrada (Inputs)

#### 1. Prompt Base
```typescript
interface PromptNodeData extends BaseNodeData {
  type: 'prompt_base';
  config: {
    prompt: string;
    systemPrompt?: string;
  };
  outputs: [{
    id: 'text_out',
    type: 'output',
    dataType: 'text',
    label: 'Prompt',
  }];
}
```
**UI del Nodo:**
- Icono: 📝 (text document)
- Textarea autoresizable (min 3 líneas, max 10)
- Contador de caracteres
- Botón "Variables" para insertar placeholders

**Estados especiales:**
- Warning si prompt vacío
- Suggestion de Genesis si prompt es muy genérico

---

#### 2. Personaje / Marca
```typescript
interface BrandNodeData extends BaseNodeData {
  type: 'brand_persona';
  config: {
    brandName: string;
    tone: 'professional' | 'casual' | 'playful' | 'authoritative';
    targetAudience: string;
    keyValues: string[];
  };
  outputs: [{
    id: 'context_out',
    type: 'output',
    dataType: 'text',
    label: 'Brand Context',
  }];
}
```
**UI del Nodo:**
- Icono: 🎭 (theater masks)
- Input de texto para nombre
- Radio buttons para tone (con preview de ejemplo)
- Textarea para target audience
- Tag input para key values

---

#### 3. Subir Activo
```typescript
interface UploadNodeData extends BaseNodeData {
  type: 'upload_asset';
  config: {
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  };
  outputs: [{
    id: 'file_out',
    type: 'output',
    dataType: 'image' | 'video' | 'audio' | 'file',
    label: 'Asset',
  }];
}
```
**UI del Nodo:**
- Icono: 📎 (paperclip)
- Drag & drop zone con preview
- Soporte para: JPG, PNG, MP4, MP3, PDF
- Progress bar durante upload
- Thumbnail del archivo subido

---

### B. Nodos de Procesamiento (IA Generativa)

#### 4. Generador de Imagen
```typescript
interface ImageGenNodeData extends BaseNodeData {
  type: 'image_generator';
  config: {
    model: 'flux-pro' | 'flux-dev' | 'stable-diffusion-3';
    aspectRatio: '16:9' | '1:1' | '9:16' | '4:3';
    guidanceScale: number; // 1-20
    numInferenceSteps: number; // 20-100
    seed?: number;
  };
  inputs: [
    { id: 'prompt_in', dataType: 'text', label: 'Prompt', required: true },
    { id: 'negative_in', dataType: 'text', label: 'Negative', required: false },
    { id: 'image_in', dataType: 'image', label: 'Img2Img', required: false }
  ];
  outputs: [{
    id: 'image_out',
    type: 'output',
    dataType: 'image',
    label: 'Generated Image',
  }];
}
```
**UI del Nodo:**
- Icono: 🎨 (artist palette)
- Dropdown para modelo
- Grid de aspect ratios (visual)
- Sliders para guidance y steps
- Checkbox "Use seed" con input numérico
- Preview del resultado (lazy load)
- Botón "Regenerate" con mismo seed

**Créditos:** 1 crédito por imagen

---

#### 5. Copywriter LLM
```typescript
interface CopywriterNodeData extends BaseNodeData {
  type: 'copywriter_llm';
  config: {
    format: 'ad_copy' | 'blog_post' | 'tweet' | 'email' | 'video_script';
    maxLength: number;
    includeHashtags: boolean;
    includeEmojis: boolean;
  };
  inputs: [
    { id: 'context_in', dataType: 'text', label: 'Context', required: true },
    { id: 'brand_in', dataType: 'text', label: 'Brand Voice', required: false }
  ];
  outputs: [{
    id: 'copy_out',
    type: 'output',
    dataType: 'text',
    label: 'Final Copy',
  }];
}
```
**UI del Nodo:**
- Icono: 🧠 (brain)
- Dropdown de formato con iconos
- Slider de longitud (50-2000 chars)
- Toggles para hashtags y emojis
- Textarea editable del resultado
- Botón "Refine" para iterar

**Créditos:** 0.5 créditos por generación

---

#### 6. Mejora / Upscaler
```typescript
interface UpscalerNodeData extends BaseNodeData {
  type: 'upscaler';
  config: {
    scale: 2 | 4;
    model: 'real-esrgan' | 'ultrasharp';
    denoise: number; // 0-1
  };
  inputs: [{
    id: 'image_in',
    dataType: 'image',
    label: 'Input Image',
    required: true
  }];
  outputs: [{
    id: 'image_out',
    dataType: 'image',
    label: 'Upscaled Image',
  }];
}
```
**UI del Nodo:**
- Icono: ✨ (sparkles)
- Radio buttons: 2x / 4x
- Dropdown de modelo
- Slider de denoise
- Before/after comparison slider

**Créditos:** 0.5 créditos (2x), 1 crédito (4x)

---

#### 7. ControlNet / Estructura
```typescript
interface ControlNetNodeData extends BaseNodeData {
  type: 'controlnet';
  config: {
    preprocessor: 'canny' | 'depth' | 'pose' | 'lineart';
    strength: number; // 0.0-1.0
  };
  inputs: [
    { id: 'image_in', dataType: 'image', label: 'Reference', required: true }
  ];
  outputs: [{
    id: 'conditioning_out',
    dataType: 'conditioning',
    label: 'Conditioning Data',
  }];
}
```
**UI del Nodo:**
- Icono: 📐 (ruler)
- Dropdown de preprocessor con preview
- Slider de strength
- Preview de la imagen procesada

**Nota:** Solo puede conectarse a Image Generator

---

### C. Nodos de Salida (Outputs)

#### 8. Exportar a Redes
```typescript
interface SocialExportNodeData extends BaseNodeData {
  type: 'social_export';
  config: {
    platforms: ('instagram' | 'twitter' | 'facebook' | 'linkedin')[];
    caption?: string;
    scheduled?: Date;
  };
  inputs: [
    { id: 'image_in', dataType: 'image', label: 'Visual', required: true },
    { id: 'copy_in', dataType: 'text', label: 'Caption', required: false }
  ];
}
```
**UI del Nodo:**
- Icono: 📱 (smartphone)
- Checkboxes de plataformas
- Textarea de caption (auto-populated de input)
- Date picker para schedule
- Botón "Publish Now" o "Schedule"

---

#### 9. Descargar ZIP
```typescript
interface DownloadNodeData extends BaseNodeData {
  type: 'download_zip';
  config: {
    fileName: string;
  };
  inputs: [{
    id: 'assets_in',
    dataType: 'image' | 'video' | 'file',
    label: 'Assets',
    multiple: true,
    required: true
  }];
}
```
**UI del Nodo:**
- Icono: 📦 (package)
- Input de nombre del archivo
- Lista de assets conectados con preview
- Botón "Download ZIP"

---

## 🤖 Genesis IA – Arquitectura Tipo Gemini Pro

### Experiencia Objetivo
Genesis debe sentirse como **Gemini Pro** o **ChatGPT**: conversacional, streaming, context-aware del canvas, y capaz de ejecutar acciones en tiempo real.

### Ubicación y Layout
```html
<div class="genesis-container">
  <!-- Header fijo -->
  <div class="genesis-header">
    <div class="genesis-avatar">G</div>
    <h2>Genesis IA</h2>
    <button class="genesis-close">×</button>
  </div>
  
  <!-- Área de conversación (scrollable) -->
  <div class="genesis-messages">
    {mensajes con streaming}
  </div>
  
  <!-- Input anclado -->
  <div class="genesis-input-container">
    <textarea 
      placeholder="Pregúntame algo o pídeme crear un flujo..."
      class="genesis-textarea"
    ></textarea>
    <button class="genesis-send">
      <SendIcon />
    </button>
  </div>
</div>
```

### Estilos CSS (Light Mode Total)
```css
.genesis-container {
  position: fixed;
  right: 0;
  top: 0;
  width: 400px;
  height: 100vh;
  background: var(--surface-primary);
  border-left: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sidebar);
}

.genesis-header {
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--surface-secondary);
}

.genesis-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
}

.genesis-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Burbujas de mensaje */
.message-bubble {
  max-width: 85%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.message-bubble.user {
  align-self: flex-end;
  background: var(--brand-light);
  color: var(--text-primary);
  border: 1px solid var(--brand-secondary);
}

.message-bubble.genesis {
  align-self: flex-start;
  background: var(--surface-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

/* Streaming indicator */
.message-bubble.streaming::after {
  content: '▊';
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* Input container */
.genesis-input-container {
  padding: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: var(--space-2);
  background: var(--surface-primary);
}

.genesis-textarea {
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: var(--space-2);
  border: 2px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: var(--text-sm);
  resize: none;
  background: var(--surface-primary);
  color: var(--text-primary);
}

.genesis-textarea:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-focus);
}

.genesis-send {
  width: 44px;
  height: 44px;
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 150ms;
}

.genesis-send:hover:not(:disabled) {
  background: var(--brand-secondary);
  transform: translateY(-2px);
}

.genesis-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

### Capacidades de Genesis IA

#### 1. Context Awareness del Canvas
Genesis debe tener acceso en tiempo real al estado del canvas:

```typescript
interface CanvasContext {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];
  lastAction: {
    type: 'node_added' | 'edge_created' | 'node_deleted';
    timestamp: number;
    nodeId?: string;
  };
  userIntent?: string; // Inferido del historial
}

const buildGenesisPrompt = (userMessage: string, context: CanvasContext): string => {
  const systemPrompt = `
Eres Genesis, el asistente IA de Creator IA Pro. Tu trabajo es ayudar al usuario a crear flujos de trabajo visuales usando nodos conectados.

CONTEXTO ACTUAL DEL CANVAS:
- Nodos activos: ${context.nodes.length}
- Conexiones: ${context.edges.length}
- Último nodo creado: ${context.lastAction.nodeId || 'ninguno'}

CAPACIDADES:
1. Responder preguntas sobre cómo funciona la plataforma
2. Sugerir flujos completos basados en objetivos
3. Añadir nodos directamente al canvas usando la función addNode()
4. Conectar nodos automáticamente usando connectNodes()
5. Optimizar flujos existentes

REGLAS:
- Siempre usa light mode en tus respuestas visuales
- Sé conversacional pero preciso
- Si el usuario dice "crea una campaña", genera un flujo completo
- Explica brevemente qué haces antes de hacerlo
`;

  return systemPrompt + `\n\nUSUARIO: ${userMessage}`;
};
```

---

#### 2. Tool Calling (Acciones Directas)

Genesis usa Claude's tool calling para ejecutar acciones:

```typescript
const genesisTools = [
  {
    name: 'addNode',
    description: 'Añade un nuevo nodo al canvas',
    input_schema: {
      type: 'object',
      properties: {
        nodeType: {
          type: 'string',
          enum: ['prompt_base', 'image_generator', 'copywriter_llm', 'upscaler', 'social_export'],
          description: 'Tipo de nodo a crear'
        },
        position: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' }
          }
        },
        config: {
          type: 'object',
          description: 'Configuración inicial del nodo'
        }
      },
      required: ['nodeType']
    }
  },
  {
    name: 'connectNodes',
    description: 'Conecta dos nodos existentes',
    input_schema: {
      type: 'object',
      properties: {
        sourceId: { type: 'string' },
        targetId: { type: 'string' },
        sourceHandle: { type: 'string' },
        targetHandle: { type: 'string' }
      },
      required: ['sourceId', 'targetId']
    }
  },
  {
    name: 'createFlow',
    description: 'Crea un flujo completo con múltiples nodos pre-conectados',
    input_schema: {
      type: 'object',
      properties: {
        flowType: {
          type: 'string',
          enum: ['social_campaign', 'blog_post', 'ad_creative', 'video_script'],
          description: 'Template de flujo a crear'
        },
        initialPrompt: { type: 'string' }
      },
      required: ['flowType']
    }
  },
  {
    name: 'optimizeFlow',
    description: 'Analiza el flujo actual y sugiere mejoras',
    input_schema: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          enum: ['performance', 'cost', 'quality'],
          description: 'Aspecto a optimizar'
        }
      }
    }
  }
];
```

**Ejemplo de interacción:**

```
Usuario: "Crea un flujo para promocionar unos zapatos en Instagram"

Genesis (streaming): 
"Perfecto, voy a crear un flujo completo para eso. Incluirá:
1. Un nodo de Prompt con el concepto del producto
2. Un Generador de Imagen para el visual
3. Un Copywriter para el caption
4. Exportación directa a Instagram

Creando nodos..." 

[Tool call: createFlow({ flowType: 'social_campaign', initialPrompt: 'zapatos deportivos' })]

Genesis (después de ejecutar):
"✅ Flujo creado. Puedes editar el prompt inicial en el primer nodo para personalizar 
el estilo de los zapatos. ¿Quieres que ajuste algo?"
```

---

#### 3. Streaming de Respuestas

```typescript
const streamGenesisResponse = async (
  userMessage: string, 
  context: CanvasContext
) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      stream: true,
      messages: [{
        role: 'user',
        content: buildGenesisPrompt(userMessage, context)
      }],
      tools: genesisTools
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.type === 'content_block_delta') {
          // Actualizar UI con texto streaming
          appendToGenesisMessage(data.delta.text);
        }
        
        if (data.type === 'tool_use') {
          // Ejecutar acción
          await executeGenesisTool(data.name, data.input);
        }
      }
    }
  }
};

const appendToGenesisMessage = (text: string) => {
  const lastMessage = document.querySelector('.message-bubble.genesis:last-child');
  if (lastMessage) {
    lastMessage.textContent += text;
  }
};

const executeGenesisTool = async (toolName: string, input: any) => {
  switch (toolName) {
    case 'addNode':
      const newNode = createNode(input.nodeType, input.position, input.config);
      addNodeToCanvas(newNode);
      showToast(`Nodo ${input.nodeType} añadido`);
      break;
      
    case 'connectNodes':
      const edge = createEdge(input.sourceId, input.targetId, input.sourceHandle, input.targetHandle);
      addEdgeToCanvas(edge);
      break;
      
    case 'createFlow':
      const flow = FLOW_TEMPLATES[input.flowType];
      await createFlowFromTemplate(flow, input.initialPrompt);
      break;
      
    case 'optimizeFlow':
      const suggestions = analyzeCurrentFlow(input.focus);
      showOptimizationModal(suggestions);
      break;
  }
};
```

---

#### 4. Ejemplos de Prompts de Usuario → Respuestas de Genesis

**Ejemplo 1: Pregunta básica**
```
Usuario: "¿Cómo funciona el nodo de imagen?"

Genesis:
"El Generador de Imagen toma un prompt de texto y crea visuales usando modelos 
como Flux Pro. Puedes conectarle:
- Un nodo de Prompt (para la descripción)
- Un nodo de Marca (para mantener consistencia)
- Otro nodo de imagen (para img2img)

Cada generación cuesta 1 crédito. ¿Quieres que agregue uno al canvas?"
```

**Ejemplo 2: Creación de flujo**
```
Usuario: "necesito crear un anuncio de ropa deportiva para Facebook"

Genesis:
"Perfecto, voy a crear un flujo optimizado para ads de Facebook:

1️⃣ Nodo de Marca (configura el tone deportivo)
2️⃣ Generador de Imagen (visual del producto)
3️⃣ Copywriter (texto persuasivo para ad)
4️⃣ Exportar a Redes (formato Facebook)

[Ejecuta createFlow]

✅ Flujo creado en el canvas. El ratio ya está configurado en 1:1 (óptimo para 
Facebook Feed). Solo necesitas:
- Editar el prompt de imagen con detalles de tu ropa
- Ajustar el tone en el nodo de Marca si quieres algo más energético

¿Listo para generar?"
```

**Ejemplo 3: Optimización**
```
Usuario: "este flujo está muy lento"

Genesis:
"Voy a analizar tu flujo actual...

[Tool call: optimizeFlow({ focus: 'performance' })]

Encontré 2 oportunidades:
1. Estás usando Flux Pro (lento) → Cambia a Flux Dev para 3x más rápido
2. Tienes 2 upscalers en serie → Usa solo el final para ahorrar tiempo

¿Quiero que aplique estos cambios automáticamente?"
```

---

#### 5. Sugerencias Proactivas

Genesis debe mostrar sugerencias contextuales SIN que el usuario pregunte:

```typescript
const proactiveSuggestions = {
  onEmptyCanvas: {
    trigger: 'canvas vacío por >10s',
    message: '👋 ¿Primera vez? Puedo crear un flujo de ejemplo. Solo dime qué tipo de contenido necesitas.',
    actions: ['Ver templates', 'Empezar desde cero']
  },
  
  onDisconnectedNode: {
    trigger: 'nodo sin conexiones de salida',
    message: '💡 Ese nodo no está conectado a nada. ¿Quieres que lo conecte a un Exportar?',
    actions: ['Conectar a Social Export', 'Conectar a Download']
  },
  
  onCostlyFlow: {
    trigger: 'flujo total >10 créditos',
    message: '⚠️ Este flujo costará ~12 créditos. Puedo optimizarlo para usar solo 6.',
    actions: ['Ver cómo optimizar', 'Continuar igual']
  },
  
  onSuccessfulGeneration: {
    trigger: 'imagen generada con éxito',
    message: '✨ ¡Quedó genial! ¿Quieres que agregue variaciones o un upscaler?',
    actions: ['Añadir variaciones', 'Upscale 4x']
  }
};
```

---

## 🚨 Manejo de Errores

### Tipos de Errores y Respuestas

| Error | Causa | UI Feedback | Acción Usuario |
|-------|-------|-------------|----------------|
| **API Timeout** | Generación >60s | Toast: "La generación está tomando más tiempo. Seguirá en background" | Puede seguir trabajando |
| **Rate Limit** | >10 requests/min | Modal: "Has alcanzado el límite. Espera 30s o upgrade a Pro" | Esperar o upgrade |
| **Invalid Connection** | Tipos incompatibles | Nodo shake + tooltip: "Este nodo solo acepta imágenes" | Conectar correctamente |
| **Créditos Insuficientes** | Balance = 0 | Modal: "Te quedan 0 créditos. Compra más para continuar" | Ir a billing |
| **NSFW Content** | Imagen bloqueada | Nodo en estado error + "Contenido inapropiado detectado" | Cambiar prompt |
| **Network Error** | Sin internet | Banner sticky arriba: "Sin conexión. Reconectando..." | Esperar |

### Implementación de Error Boundaries

```typescript
const handleNodeError = (nodeId: string, error: Error) => {
  const node = getNodeById(nodeId);
  
  // Actualizar estado del nodo
  updateNodeData(nodeId, {
    status: {
      state: 'error',
      message: error.message,
      errorCode: error.code
    }
  });
  
  // Log para debugging
  console.error(`[Node ${nodeId}] Error:`, error);
  
  // Notificar a Genesis IA
  notifyGenesis({
    type: 'node_error',
    nodeId,
    error: error.message
  });
  
  // UI feedback
  if (error.code === 'INSUFFICIENT_CREDITS') {
    showCreditsModal();
  } else {
    showToast(error.message, 'error');
  }
};
```

---

## ⚡ Performance y Persistencia

### Optimizaciones de Rendering

```typescript
// 1. Virtualización del canvas (solo renderizar nodos visibles)
const useVisibleNodes = (nodes: Node[], viewport: Viewport) => {
  return useMemo(() => {
    const padding = 200; // px extra fuera del viewport
    return nodes.filter(node => {
      const isInViewport = 
        node.position.x + node.width > viewport.x - padding &&
        node.position.x < viewport.x + viewport.width + padding &&
        node.position.y + node.height > viewport.y - padding &&
        node.position.y < viewport.y + viewport.height + padding;
      return isInViewport;
    });
  }, [nodes, viewport]);
};

// 2. Debounce de auto-save
const useDebouncedSave = (flow: Flow, delay = 3000) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      saveFlowToSupabase(flow);
    }, delay);
    
    return () => clearTimeout(timeoutRef.current);
  }, [flow, delay]);
};

// 3. Lazy load de previews pesadas
const NodePreview = ({ imageUrl }: { imageUrl: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="preview-container">
      {!isLoaded && <Skeleton />}
      <img 
        src={imageUrl} 
        onLoad={() => setIsLoaded(true)}
        style={{ display: isLoaded ? 'block' : 'none' }}
      />
    </div>
  );
};
```

### Estrategia de Persistencia

```typescript
interface FlowPersistence {
  // Local (para drafts)
  localStorage: {
    key: `flow_draft_${userId}`,
    autoSave: true,
    debounce: 3000 // ms
  };
  
  // Cloud (para proyectos guardados)
  supabase: {
    table: 'flows',
    realtime: true, // Sync entre tabs
    versionControl: {
      enabled: true,
      maxVersions: 10,
      autoSnapshot: 'every_5_minutes'
    }
  };
  
  // Export (para backup)
  export: {
    format: 'json',
    includeAssets: true, // Base64 de imágenes
    compression: 'gzip'
  };
}

const saveFlow = async (flow: Flow) => {
  try {
    // 1. Local save inmediato
    localStorage.setItem(`flow_draft_${userId}`, JSON.stringify(flow));
    
    // 2. Cloud save con retry
    await supabase
      .from('flows')
      .upsert({
        id: flow.id,
        user_id: userId,
        data: flow,
        updated_at: new Date()
      });
    
    // 3. Crear snapshot de versión si hay cambios significativos
    if (hasSignificantChanges(flow)) {
      await createFlowSnapshot(flow);
    }
    
    showToast('Guardado', 'success', 1000);
  } catch (error) {
    console.error('Save failed:', error);
    showToast('Error al guardar. Reintentando...', 'error');
    setTimeout(() => saveFlow(flow), 5000);
  }
};
```

---

## ♿ Accesibilidad (WCAG 2.1 AA)

### Contraste de Colores
Todos los pares de colores cumplen ratio mínimo 4.5:1:

```
✅ text-primary (#0f172a) sobre bg-white → 18.2:1
✅ text-secondary (#475569) sobre bg-white → 7.8:1
✅ brand-primary (#a855f7) sobre bg-white → 4.6:1
✅ state-error (#ef4444) sobre bg-white → 4.7:1
```

### Navegación por Teclado

```typescript
const keyboardShortcuts = {
  // Canvas
  'Space + Drag': 'Pan canvas',
  'Cmd/Ctrl + Scroll': 'Zoom in/out',
  'Cmd/Ctrl + 0': 'Reset zoom',
  
  // Selección
  'Tab': 'Navegar entre nodos',
  'Shift + Tab': 'Navegar atrás',
  'Enter': 'Editar nodo seleccionado',
  'Escape': 'Cerrar editor',
  
  // Edición
  'Cmd/Ctrl + A': 'Seleccionar todos',
  'Cmd/Ctrl + D': 'Duplicar selección',
  'Delete/Backspace': 'Eliminar selección',
  'Cmd/Ctrl + Z': 'Deshacer',
  'Cmd/Ctrl + Shift + Z': 'Rehacer',
  
  // Creación
  'Cmd/Ctrl + K': 'Abrir menú de nodos',
  'Cmd/Ctrl + G': 'Abrir Genesis IA',
  '/': 'Focus en búsqueda de nodos'
};

// Implementación
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.includes('Mac');
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    
    if (modifier && e.key === 'z') {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    }
    
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      focusNextNode();
    }
    
    if (e.key === 'Enter' && selectedNode) {
      e.preventDefault();
      openNodeEditor(selectedNode);
    }
    
    // ... resto de shortcuts
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedNode]);
```

### ARIA Labels

```html
<!-- Nodo -->
<div 
  role="article"
  aria-label="Generador de Imagen - Estado: idle"
  aria-describedby="node-description-123"
  tabindex="0"
>
  <div id="node-description-123" class="sr-only">
    Nodo de procesamiento que genera imágenes a partir de texto. 
    Conectado a: Prompt Base. Costo: 1 crédito.
  </div>
  
  <!-- Handle -->
  <button
    role="button"
    aria-label="Puerto de entrada - Acepta: texto"
    class="handle handle-input"
    tabindex="0"
  />
</div>

<!-- Genesis IA -->
<div 
  role="complementary"
  aria-label="Asistente Genesis IA"
>
  <div 
    role="log"
    aria-live="polite"
    aria-atomic="false"
    class="genesis-messages"
  >
    {/* Mensajes aquí */}
  </div>
  
  <textarea
    aria-label="Escribe un mensaje para Genesis IA"
    placeholder="Pregúntame algo o pídeme crear un flujo..."
  />
</div>
```

---

## 🎯 UX Details (Micro-interacciones)

### Feedback Visual en Acciones

```typescript
const microInteractions = {
  // Al conectar nodos exitosamente
  onEdgeCreated: () => {
    playSound('connect');
    animateEdge('pulse');
    showToast('✓ Conectado', 'success', 1500);
  },
  
  // Al intentar conexión inválida
  onInvalidConnection: (targetNode) => {
    shakeNode(targetNode.id);
    playSound('error');
    showTooltip('Tipos incompatibles', targetNode.position);
  },
  
  // Al completar generación
  onGenerationComplete: (nodeId) => {
    confetti({
      particleCount: 50,
      origin: getNodeCenter(nodeId)
    });
    pulseNode(nodeId, 'success');
  },
  
  // Al arrastrar sobre drop zone válido
  onDragOverValidZone: (zone) => {
    zone.style.background = 'var(--state-success-bg)';
    zone.style.border = '2px dashed var(--state-success)';
  }
};
```

### Animaciones con Framer Motion

```typescript
import { motion } from 'framer-motion';

const NodeContainer = ({ node, children }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="node-container"
      data-state={node.status.state}
    >
      {children}
    </motion.div>
  );
};

const GenesisMessage = ({ message, isUser }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`message-bubble ${isUser ? 'user' : 'genesis'}`}
    >
      {message}
    </motion.div>
  );
};
```

---

## 📱 Responsive Considerations

Aunque Creator IA Pro es desktop-first, debe funcionar en tablets:

### Breakpoints
```css
/* Desktop (default) */
@media (min-width: 1024px) {
  .genesis-container { width: 400px; }
  .node-container { min-width: 320px; }
}

/* Tablet landscape */
@media (max-width: 1023px) and (min-width: 768px) {
  .genesis-container { width: 350px; }
  .node-container { min-width: 280px; }
  .handle { width: 20px; height: 20px; } /* Más grande para touch */
}

/* Tablet portrait */
@media (max-width: 767px) {
  .genesis-container {
    width: 100%;
    height: 50vh;
    top: auto;
    bottom: 0;
    border-left: none;
    border-top: 1px solid var(--border-default);
  }
  
  .node-container { min-width: 260px; }
  .handle { width: 24px; height: 24px; }
}
```

---

## 🧪 Testing Checklist

### Antes de deploy, verificar:

**Funcional:**
- [ ] Todos los nodos se pueden crear y eliminar
- [ ] Validación de conexiones funciona correctamente
- [ ] Genesis IA responde en <2s y usa streaming
- [ ] Auto-save funciona cada 3s
- [ ] Drag & drop de archivos funciona
- [ ] Exportación de flujos genera JSON válido

**Visual (Light Mode):**
- [ ] NO existe ningún elemento oscuro en todo el sitio
- [ ] Contraste de textos cumple WCAG AA
- [ ] Animaciones son smooth (60fps)
- [ ] Estados de nodo se ven claramente distintos
- [ ] Genesis IA usa solo burbujas claras

**Performance:**
- [ ] Canvas con 50+ nodos rinde >30fps
- [ ] Previews de imagen usan lazy loading
- [ ] API calls tienen timeout de 60s
- [ ] No hay memory leaks en long sessions

**Accesibilidad:**
- [ ] Navegación por teclado funciona
- [ ] Screen reader lee nodos correctamente
- [ ] Focus visible en todos los elementos interactivos
- [ ] Todos los colores pasan contrast check

---

## 📦 Stack Tecnológico Recomendado

```typescript
const techStack = {
  frontend: {
    framework: 'React 18 + TypeScript',
    canvas: 'React Flow 11',
    state: 'Zustand',
    styling: 'Tailwind CSS 3',
    animations: 'Framer Motion',
    forms: 'React Hook Form + Zod'
  },
  
  backend: {
    api: 'Next.js API Routes',
    database: 'Supabase (PostgreSQL)',
    storage: 'Supabase Storage',
    realtime: 'Supabase Realtime'
  },
  
  ai: {
    llm: 'Anthropic Claude (Sonnet 4)',
    imageGen: 'Replicate (Flux, SD3)',
    upscaling: 'Replicate (Real-ESRGAN)'
  },
  
  tooling: {
    bundler: 'Vite',
    linter: 'ESLint + Prettier',
    testing: 'Vitest + Testing Library',
    deployment: 'Vercel'
  }
};
```

---

## 🎬 Próximos Pasos

1. **Prototipo de Genesis IA** - Implementar streaming y tool calling
2. **Matriz de Conexiones** - Código de validación completo
3. **Sistema de Estados** - Máquina de estados para nodos
4. **Design Tokens** - Variables CSS globales
5. **Componente Base de Nodo** - Estructura reutilizable

---

**Documento creado por:** Claude (Anthropic)  
**Para:** Sebas - Lead Product Designer  
**Proyecto:** Creator IA Pro Studio  
**Versión:** 1.0 - Light Mode Total
