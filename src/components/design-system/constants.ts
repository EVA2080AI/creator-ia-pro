import { 
  Palette, Type, Layout, Box, Shield, Zap, MousePointer2, 
  MessageSquare, Database, Command, LucideIcon, Layers
} from 'lucide-react';

export interface DesignSection {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface DesignColor {
  name: string;
  hex: string;
  text: string;
  desc: string;
}

export const SECTIONS: DesignSection[] = [
  { id: 'colors', label: 'Colores', icon: Palette },
  { id: 'typography', label: 'Tipografía', icon: Type },
  { id: 'buttons', label: 'Botones', icon: MousePointer2 },
  { id: 'forms', label: 'Formularios', icon: Layout },
  { id: 'chat', label: 'Chat & IA', icon: MessageSquare },
  { id: 'navigation', label: 'Navegación', icon: Layers }, // Note: Layers is imported in individual files as needed or here
  { id: 'data', label: 'Datos & Status', icon: Database },
  { id: 'components', label: 'Componentes', icon: Box },
  { id: 'feedback', label: 'Feedback', icon: Zap },
  { id: 'layout', label: 'Estructuras', icon: Layout },
  { id: 'industrial', label: 'Industrial v19.5', icon: Shield },
  { id: 'atomic', label: 'Atómico (V7)', icon: Command },
];

export const COLORS: DesignColor[] = [
  { name: 'Primary (Action)', hex: '#3B82F6', text: 'white', desc: 'Main brand color, used for primary actions.' },
  { name: 'Secondary (Logic)', hex: '#6366F1', text: 'white', desc: 'Indigo accent used for features and highlights.' },
  { name: 'Accent (Growth)', hex: '#A855F7', text: 'white', desc: 'Purple accent used for AI and premium features.' },
  { name: 'Success', hex: '#10B981', text: 'white', desc: 'Used for positive states and confirmations.' },
  { name: 'Warning', hex: '#F59E0B', text: 'white', desc: 'Used for warnings and pending actions.' },
  { name: 'Error', hex: '#EF4444', text: 'white', desc: 'Used for critical errors and deletions.' },
  { name: 'Zinc 950', hex: '#09090B', text: 'white', desc: 'Deep background for cards and overlays.' },
  { name: 'Zinc 100', hex: '#F4F4F5', text: 'zinc-900', desc: 'Lighter backgrounds and separators.' },
];
